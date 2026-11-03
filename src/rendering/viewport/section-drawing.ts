import type { Project } from "../../domain/project/schema.ts";
import { resolveStoreyLevels } from "../../domain/storeys/heights.ts";
import { isElevation, sectionFrame, type Section } from "../../domain/views/sections.ts";
import { buildingParts } from "./building-solid.ts";
import { isOwnedProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import type { Face, Solid, Vec3 } from "./storey-solid.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import type { Material } from "../../domain/elements/wall/assembly.ts";
import { assemblyLibraryOf, wallLayerBands } from "./wall-layers.ts";

/** A point of the section drawing: x to the viewer's right along the line, y = height. */
export type SectionPoint = { x: number; y: number };
/** Building part seen beyond the cut: polygon and its visible edges, farthest first. */
export type SectionView = {
  /** The element the face belongs to (docs/FILTER.md, L45). */
  id: string;
  points: SectionPoint[];
  edges: [SectionPoint, SectionPoint][];
  /** Opening symbol of a sash pane (FL3), dashed when the sash opens away from the viewer. */
  marks?: { segments: [SectionPoint, SectionPoint][]; dashed: boolean };
};
/**
 * Cut part of one element: closed outlines (filled) and open pieces (stroked only). `kind`:
 * building parts get the cut fill; frames of window and door elements and their glass are drawn
 * as outlines only (docs/FENSTER_TUEREN.md, FT2).
 */
export type SectionCut = {
  id: string;
  kind: "part" | "frame" | "glass";
  loops: SectionPoint[][];
  open: SectionPoint[][];
  /**
   * Layers of a cut wall with a build-up (docs/WANDAUFBAU.md, SA3): vertical strips from x to
   * x, left to right, each to be clipped by the loops. The layer faces are vertical planes, so in
   * any section they are vertical lines.
   */
  layers?: SectionLayerStrip[];
};
export type SectionLayerStrip = { from: number; to: number; material: Material };
export type SectionLevel = { storeyId: string; name: string; elevation: number };
export type SectionDrawing = {
  cuts: SectionCut[];
  views: SectionView[];
  levels: SectionLevel[];
  /** Horizontal extent of the line; the drawing lies within x 0…width. */
  width: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number } | null;
};

/** Elements the drawing shows, cut or beyond the line (docs/FILTER.md, L45). */
export const sectionShownIds = (drawing: SectionDrawing): Set<string> =>
  new Set([...drawing.cuts.map((c) => c.id), ...drawing.views.map((v) => v.id)]);

const EPS = 1e-9;
const key = (p: readonly number[]) => p.map((v) => Math.round(v * 1e5)).join(",");

type Local = { u: number; z: number; w: number };
type Tagged = { p: Local; edge: string | null };

/** Clips a polygon to the half space where `side(p) ≥ 0`; edges keep their source tag. */
function clip(polygon: Tagged[], side: (p: Local) => number): Tagged[] {
  const out: Tagged[] = [];
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length]!;
    const sa = side(a.p),
      sb = side(b.p);
    const cross = (): Local => {
      const t = sa / (sa - sb);
      return {
        u: a.p.u + (b.p.u - a.p.u) * t,
        z: a.p.z + (b.p.z - a.p.z) * t,
        w: a.p.w + (b.p.w - a.p.w) * t,
      };
    };
    if (sa >= -EPS) {
      if (sb >= -EPS) out.push(a);
      else if (sa > EPS) out.push(a, { p: cross(), edge: null });
      // On the boundary and leaving: the next edge runs along the boundary.
      else out.push({ p: a.p, edge: null });
    } else if (sb > EPS) out.push({ p: cross(), edge: a.edge });
  });
  return out;
}

/** A view face before its edges are known: candidate edges carry their key. */
type PartView = {
  depth: number;
  id: string;
  points: SectionPoint[];
  candidates: { key: string; from: SectionPoint; to: SectionPoint }[];
  marks?: { segments: [SectionPoint, SectionPoint][]; dashed: boolean };
};
/**
 * The work of one storey part of the building for one section line: edge normals, cut segments
 * chained per element, view faces with their candidate edges. Edges are decided across all
 * parts afterwards, so a part never decides alone what a neighbouring storey hides.
 */
type PartSection = { edges: PartEdges; cuts: SectionCut[]; views: PartView[] };
/** Edges of one storey part, the same for every section: the key of each face edge, the
 * normals of the faces meeting there, and the edges not only between smooth facets. */
type PartEdges = { keys: string[][]; normals: Map<string, Vec3[]>; rough: Set<string> };
// Per storey part (identity kept while its storey is unchanged), and per section line.
const partEdgeTables = new WeakMap<Solid, PartEdges>();
const partSections = new WeakMap<Solid, Map<string, PartSection>>();
const edgeKey = (a: Vec3, b: Vec3) => {
  const ka = key(a),
    kb = key(b);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
};
function partEdges(part: Solid, frozen: boolean): PartEdges {
  const known = frozen ? partEdgeTables.get(part) : undefined;
  if (known) return known;
  const normals = new Map<string, Vec3[]>();
  // Edges where only facets of one curved surface meet (a round opening) stay undrawn.
  const rough = new Set<string>();
  const keys = (part.faces as readonly Face[]).map((face) =>
    face.vertices.map((a, i) => {
      const k = edgeKey(a, face.vertices[(i + 1) % face.vertices.length]!);
      const list = normals.get(k);
      if (list) list.push(face.normal);
      else normals.set(k, [face.normal]);
      if (!face.smooth) rough.add(k);
      return k;
    }),
  );
  const result = { keys, normals, rough };
  if (frozen) partEdgeTables.set(part, result);
  return result;
}
const lineKey = (section: Section) =>
  JSON.stringify([section.start, section.end, section.look, isElevation(section)]);

function partSection(part: Solid, section: Section, frozen: boolean): PartSection {
  const line = lineKey(section);
  const known = frozen ? partSections.get(part)?.get(line) : undefined;
  if (known) return known;
  const { d, view, length } = sectionFrame(section);
  const mirror = section.look === "right";
  const local = (v: Vec3): Local => {
    const x = v[0] - section.start.x,
      y = v[1] - section.start.y;
    return { u: x * d.x + y * d.y, z: v[2], w: x * view.x + y * view.y };
  };
  const out = (p: Local): SectionPoint => ({ x: mirror ? length - p.u : p.u, y: p.z });
  const edges = partEdges(part, frozen);
  // Per element and kind: frame and glass of one window are chained apart.
  const segments = new Map<
    string,
    { id: string; kind: SectionCut["kind"]; list: [Local, Local][] }
  >();
  const views: PartView[] = [];
  const within = (p: Tagged[]) =>
    clip(
      clip(p, (q) => q.u),
      (q) => length - q.u,
    );
  for (const [index, face] of (part.faces as readonly Face[]).entries()) {
    const faceKeys = edges.keys[index]!;
    const tagged: Tagged[] = face.vertices.map((v, i) => ({ p: local(v), edge: faceKeys[i]! }));
    // Cut: where the face crosses the plane w = 0, within the line.
    const crossings: Local[] = [];
    tagged.forEach((a, i) => {
      const b = tagged[(i + 1) % tagged.length]!;
      if ((a.p.w < -EPS && b.p.w > EPS) || (a.p.w > EPS && b.p.w < -EPS)) {
        const t = a.p.w / (a.p.w - b.p.w);
        crossings.push({ u: a.p.u + (b.p.u - a.p.u) * t, z: a.p.z + (b.p.z - a.p.z) * t, w: 0 });
      } else if (Math.abs(a.p.w) <= EPS && Math.abs(b.p.w) > EPS) crossings.push(a.p);
    });
    if (crossings.length >= 2) {
      // Along the cut line: by u, or by height where the line is (nearly) vertical.
      const spanU = Math.max(...crossings.map((c) => c.u)) - Math.min(...crossings.map((c) => c.u));
      const spanZ = Math.max(...crossings.map((c) => c.z)) - Math.min(...crossings.map((c) => c.z));
      crossings.sort(spanU >= spanZ ? (a, b) => a.u - b.u : (a, b) => a.z - b.z);
      // Whole outlines first, limited to the line afterwards, so parts the line starts or ends
      // in stay closed along the end of the line.
      for (let i = 0; i + 1 < crossings.length; i += 2) {
        const kind = face.glass ? "glass" : face.opening ? "frame" : "part";
        const k = `${face.wallId}#${kind}`;
        const entry = segments.get(k) ?? { id: face.wallId, kind, list: [] };
        entry.list.push([crossings[i]!, crossings[i + 1]!]);
        segments.set(k, entry);
      }
    }
    // View: faces turned to the viewer, behind the plane.
    const facing = face.normal[0] * view.x + face.normal[1] * view.y;
    if (facing > -1e-6) continue;
    const seen = within(clip(tagged, (q) => q.w));
    if (seen.length < 3) continue;
    const depth = seen.reduce((sum, q) => sum + q.p.w, 0) / seen.length;
    const candidates: PartView["candidates"] = [];
    seen.forEach((a, i) => {
      if (a.edge)
        candidates.push({ key: a.edge, from: out(a.p), to: out(seen[(i + 1) % seen.length]!.p) });
    });
    // Opening symbol lines lie in the pane; kept behind the plane and limited to the line.
    const symbol = (face.marks?.segments ?? []).flatMap(
      ([a, b]): [SectionPoint, SectionPoint][] => {
        let [p, q] = [local(a), local(b)];
        if (p.w < -EPS || q.w < -EPS) return [];
        if (p.u > q.u) [p, q] = [q, p];
        if (q.u < 0 || p.u > length) return [];
        const at = (u: number): Local => {
          const t = (u - p.u) / (q.u - p.u);
          return { u, z: p.z + (q.z - p.z) * t, w: p.w + (q.w - p.w) * t };
        };
        return [[out(p.u < 0 ? at(0) : p), out(q.u > length ? at(length) : q)]];
      },
    );
    views.push({
      depth,
      id: face.wallId,
      points: seen.map((q) => out(q.p)),
      candidates,
      ...(symbol.length ? { marks: { segments: symbol, dashed: face.marks!.dashed } } : {}),
    });
  }
  // An elevation (A1) cuts nothing: only what lies beyond the line in the viewing direction.
  const cuts: SectionCut[] = isElevation(section)
    ? []
    : [...segments.values()]
        .map(({ id, kind, list }) => ({ ...chain(id, list, length, out), kind }))
        .filter((c) => c.loops.length > 0 || c.open.length > 0);
  const result = { edges, cuts, views };
  if (frozen) {
    let bySection = partSections.get(part);
    if (!bySection) partSections.set(part, (bySection = new Map()));
    bySection.set(line, result);
  }
  return result;
}

/**
 * Section or elevation drawing of the whole building (docs/SCHNITTE.md). The work is done per
 * storey part and remembered while the part stays the same (docs/performance/SECTION_PARTS.md):
 * an edit recomputes only its storey. Edges between faces of different parts, the depth order
 * and the wall layers are decided over the whole building, so the drawing equals the one of a
 * single pass over all faces.
 */
export function sectionDrawing(project: Project, section: Section): SectionDrawing {
  const parts = buildingParts(project);
  // Parts of an owned snapshot keep their identity while their storey stays; only those are remembered.
  const frozen = isOwnedProjectSnapshot(project);
  const pieces = parts.map((part) => partSection(part, section, frozen));
  const { d, length } = sectionFrame(section);
  const mirror = section.look === "right";

  // Edges shared by faces of different planes (or by one face only) are visible edges; the
  // faces meeting at an edge may belong to different storey parts.
  const decided = new Map<string, boolean>();
  const visibleEdge = (k: string) => {
    let known = decided.get(k);
    if (known !== undefined) return known;
    let first: Vec3 | undefined,
      count = 0,
      rough = false,
      bent = false;
    for (const piece of pieces) {
      if (piece.edges.rough.has(k)) rough = true;
      for (const m of piece.edges.normals.get(k) ?? []) {
        if (!first) first = m;
        else if (first[0] * m[0] + first[1] * m[1] + first[2] * m[2] < 1 - 1e-6) bent = true;
        count++;
      }
    }
    known = count < 2 || (rough && bent);
    decided.set(k, known);
    return known;
  };
  const views = pieces
    .flatMap((piece) => piece.views)
    .map((v, order) => ({ v, order }))
    .sort((a, b) => b.v.depth - a.v.depth || a.order - b.order)
    .map(({ v }): SectionView => ({
      id: v.id,
      points: v.points,
      edges: v.candidates
        .filter((c) => visibleEdge(c.key))
        .map((c): [SectionPoint, SectionPoint] => [c.from, c.to]),
      ...(v.marks ? { marks: v.marks } : {}),
    }));
  const cuts = pieces.flatMap((piece) => piece.cuts);
  const layered = withWallLayers(project, section, cuts, { d, length, mirror });
  const names = new Map(project.storeys.map((s) => [s.id, s.name]));
  const levels = resolveStoreyLevels(project.storeys, project.groundStoreyId)
    .filter((l) => l.elevation !== null)
    .map((l) => ({ storeyId: l.storeyId, name: names.get(l.storeyId)!, elevation: l.elevation! }));
  const all = [
    ...cuts.flatMap((c) => [...c.loops.flat(), ...c.open.flat()]),
    ...views.flatMap((v) => v.points),
  ];
  return {
    cuts: layered,
    views,
    levels,
    width: length,
    bounds: all.length
      ? {
          minX: Math.min(...all.map((p) => p.x)),
          minY: Math.min(...all.map((p) => p.y)),
          maxX: Math.max(...all.map((p) => p.x)),
          maxY: Math.max(...all.map((p) => p.y)),
        }
      : null,
  };
}

const drawings = new WeakMap<Project, WeakMap<Section, SectionDrawing>>();
// The last drawing per section with what it was derived from (docs/performance/SECTION_PARTS.md).
const lastDrawing = new WeakMap<Section, { inputs: readonly unknown[]; drawing: SectionDrawing }>();
/** Everything a section drawing reads: the storey parts of the building, the storeys (walls of
 * the build-up, names and levels), the build-up library and the ground storey. Layouts, texts,
 * project information or view settings are not part of it. */
const drawingInputs = (project: Project): unknown[] => [
  ...buildingParts(project),
  "|",
  ...project.storeys,
  project.materials,
  project.wallAssemblies,
  project.groundStoreyId,
  project.groundDatum,
];
const same = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
/**
 * The section drawing, derived once per project and section (a layout draws it every frame),
 * and reused for a newer project when nothing it reads has changed. Only owned snapshots reuse:
 * their storeys and parts keep their identity while unchanged.
 */
export function rememberedSectionDrawing(project: Project, section: Section): SectionDrawing {
  let bySection = drawings.get(project);
  if (!bySection) drawings.set(project, (bySection = new WeakMap()));
  let drawing = bySection.get(section);
  if (drawing) return drawing;
  const owned = isOwnedProjectSnapshot(project);
  const inputs = owned ? drawingInputs(project) : [];
  const last = owned ? lastDrawing.get(section) : undefined;
  drawing = last && same(last.inputs, inputs) ? last.drawing : sectionDrawing(project, section);
  bySection.set(section, drawing);
  if (owned) lastDrawing.set(section, { inputs, drawing });
  return drawing;
}

/**
 * Extent of a section drawing with its storey marks beside the border (BS1): `margin` on both
 * sides, 1 m above and below. The section tab fits it; on a layout it is the Abbild's frame
 * (docs/ZEICHNUNG.md, ZW4). Drawing coordinates, y = height.
 */
export function sectionExtent(drawing: SectionDrawing, margin: number) {
  const b = drawing.bounds ?? { minX: 0, maxX: drawing.width, minY: 0, maxY: 3 };
  const levels = drawing.levels.map((l) => l.elevation);
  return {
    minX: Math.min(b.minX, 0) - margin,
    maxX: Math.max(b.maxX, drawing.width) + margin,
    minY: Math.min(b.minY, ...levels) - 1,
    maxY: Math.max(b.maxY, ...levels) + 1,
  };
}

/**
 * Cut walls with a build-up get their layers as strips (docs/WANDAUFBAU.md, SA3). Across the
 * drawing x the distance from the wall's body centre plane grows linearly; each layer face is
 * where it reaches the face's offset. A line parallel to the wall stays in one layer.
 */
function withWallLayers(
  project: Project,
  section: Section,
  cuts: SectionCut[],
  frame: { d: { x: number; y: number }; length: number; mirror: boolean },
): SectionCut[] {
  const library = assemblyLibraryOf(project);
  const walls = new Map(project.storeys.flatMap((s) => s.walls).map((w) => [w.id, w]));
  return cuts.map((cut) => {
    const wall = cut.kind === "part" ? walls.get(cut.id) : undefined;
    const bands = wall && wallLayerBands(wall, library);
    if (!wall || !bands) return cut;
    const body = wallBody(wall);
    // Lateral offset at drawing x: a + b·x.
    const at = (x: number) => {
      const u = frame.mirror ? frame.length - x : x;
      const p = { x: section.start.x + frame.d.x * u, y: section.start.y + frame.d.y * u };
      return (p.x - body.start.x) * body.normal.x + (p.y - body.start.y) * body.normal.y;
    };
    const a = at(0),
      b = at(1) - a;
    const xs = cut.loops.flat().map((p) => p.x);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    if (Math.abs(b) < 1e-9) {
      const band = bands.find((l) => a >= l.from - 1e-9 && a <= l.to + 1e-9) ?? bands[0]!;
      return { ...cut, layers: [{ from: minX, to: maxX, material: band.material }] };
    }
    const layers = bands
      .map((band) => {
        const x1 = (band.from - a) / b,
          x2 = (band.to - a) / b;
        return {
          from: Math.max(minX, Math.min(x1, x2)),
          to: Math.min(maxX, Math.max(x1, x2)),
          material: band.material,
        };
      })
      .filter((l) => l.to - l.from > 1e-9)
      .sort((l, m) => l.from - m.from);
    return { ...cut, layers };
  });
}

/**
 * Joins an element's cut segments end to end into closed outlines, then limits them to the line
 * (u 0…length): outlines are clipped as polygons and stay closed, open pieces are cut off.
 */
function chain(
  id: string,
  list: [Local, Local][],
  length: number,
  out: (p: Local) => SectionPoint,
): Omit<SectionCut, "kind"> {
  const k = (p: Local) => key([p.u, p.z]);
  const rest = list.filter(([a, b]) => k(a) !== k(b));
  const loops: SectionPoint[][] = [];
  const open: SectionPoint[][] = [];
  const closed = (loop: Local[]) => {
    const part = clip(
      clip(
        loop.map((p) => ({ p, edge: null })),
        (q) => q.u,
      ),
      (q) => length - q.u,
    );
    if (part.length >= 3) loops.push(part.map((q) => out(q.p)));
  };
  const at = (p: Local, q: Local, u: number): Local => {
    const t = (u - p.u) / (q.u - p.u);
    return { u, z: p.z + (q.z - p.z) * t, w: 0 };
  };
  const piece = (path: Local[]) =>
    path.slice(1).forEach((b0, i) => {
      let [a, b] = path[i]!.u <= b0.u ? [path[i]!, b0] : [b0, path[i]!];
      if (b.u < 0 || a.u > length) return;
      if (a.u < 0) a = at(a, b, 0);
      if (b.u > length) b = at(a, b, length);
      open.push([out(a), out(b)]);
    });
  while (rest.length) {
    const [first, second] = rest.shift()!;
    const path = [first, second];
    for (;;) {
      const end = k(path.at(-1)!);
      if (end === k(path[0]!) && path.length > 3) break;
      const i = rest.findIndex(([a, b]) => k(a) === end || k(b) === end);
      if (i < 0) break;
      const [a, b] = rest.splice(i, 1)[0]!;
      path.push(k(a) === end ? b : a);
    }
    if (k(path.at(-1)!) === k(path[0]!) && path.length > 3) closed(path.slice(0, -1));
    else piece(path);
  }
  return { id, loops, open };
}
