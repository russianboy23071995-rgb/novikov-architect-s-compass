import type { Project } from "../../domain/project/schema.ts";
import { resolveStoreyLevels } from "../../domain/storeys/heights.ts";
import { sectionFrame, type Section } from "../../domain/views/sections.ts";
import { buildBuildingSolid } from "./building-solid.ts";
import type { Face, Vec3 } from "./storey-solid.ts";

/** A point of the section drawing: x to the viewer's right along the line, y = height. */
export type SectionPoint = { x: number; y: number };
/** Building part seen beyond the cut: polygon and its visible edges, farthest first. */
export type SectionView = { points: SectionPoint[]; edges: [SectionPoint, SectionPoint][] };
/** Cut part of one element: closed outlines (filled) and open pieces (stroked only). */
export type SectionCut = { id: string; loops: SectionPoint[][]; open: SectionPoint[][] };
export type SectionLevel = { storeyId: string; name: string; elevation: number };
export type SectionDrawing = {
  cuts: SectionCut[];
  views: SectionView[];
  levels: SectionLevel[];
  /** Horizontal extent of the line; the drawing lies within x 0…width. */
  width: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number } | null;
};

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

/**
 * Section drawing from the building solid (docs/SCHNITT.md, SC3). The plane stands on the
 * section line; parts it meets are cut (outlines per element), parts behind it in the viewing
 * direction are drawn as a view: faces turned to the viewer, farthest first (painter's order),
 * with their visible edges only (edges between faces of one plane are left out). Faces in front
 * of the plane are not drawn. The drawing is limited to the length of the line.
 */
export function sectionDrawing(project: Project, section: Section): SectionDrawing {
  const solid = buildBuildingSolid(project);
  const { d, view, length } = sectionFrame(section);
  const mirror = section.look === "right";
  const local = (v: Vec3): Local => {
    const x = v[0] - section.start.x,
      y = v[1] - section.start.y;
    return { u: x * d.x + y * d.y, z: v[2], w: x * view.x + y * view.y };
  };
  const out = (p: Local): SectionPoint => ({ x: mirror ? length - p.u : p.u, y: p.z });

  // Edges shared by faces of different planes (or by one face only) are visible edges.
  const edgeNormals = new Map<string, Vec3[]>();
  const edgeKey = (a: Vec3, b: Vec3) => {
    const ka = key(a),
      kb = key(b);
    return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
  };
  for (const face of solid.faces)
    face.vertices.forEach((a, i) => {
      const k = edgeKey(a, face.vertices[(i + 1) % face.vertices.length]!);
      const list = edgeNormals.get(k);
      if (list) list.push(face.normal);
      else edgeNormals.set(k, [face.normal]);
    });
  const visibleEdge = (k: string) => {
    const normals = edgeNormals.get(k)!;
    if (normals.length < 2) return true;
    const [n] = normals;
    return normals.some((m) => n![0] * m[0] + n![1] * m[1] + n![2] * m[2] < 1 - 1e-6);
  };

  const segments = new Map<string, [Local, Local][]>();
  const views: { depth: number; view: SectionView }[] = [];
  const within = (p: Tagged[]) =>
    clip(
      clip(p, (q) => q.u),
      (q) => length - q.u,
    );
  for (const face of solid.faces as readonly Face[]) {
    const tagged: Tagged[] = face.vertices.map((v, i) => ({
      p: local(v),
      edge: edgeKey(v, face.vertices[(i + 1) % face.vertices.length]!),
    }));
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
        const list = segments.get(face.wallId) ?? [];
        list.push([crossings[i]!, crossings[i + 1]!]);
        segments.set(face.wallId, list);
      }
    }
    // View: faces turned to the viewer, behind the plane.
    const facing = face.normal[0] * view.x + face.normal[1] * view.y;
    if (facing > -1e-6) continue;
    const part = within(clip(tagged, (q) => q.w));
    if (part.length < 3) continue;
    const depth = part.reduce((sum, q) => sum + q.p.w, 0) / part.length;
    const edges: [SectionPoint, SectionPoint][] = [];
    part.forEach((a, i) => {
      if (a.edge && visibleEdge(a.edge))
        edges.push([out(a.p), out(part[(i + 1) % part.length]!.p)]);
    });
    views.push({ depth, view: { points: part.map((q) => out(q.p)), edges } });
  }
  views.sort((a, b) => b.depth - a.depth);

  const cuts: SectionCut[] = [...segments]
    .map(([id, list]) => chain(id, list, length, out))
    .filter((c) => c.loops.length > 0 || c.open.length > 0);
  const names = new Map(project.storeys.map((s) => [s.id, s.name]));
  const levels = resolveStoreyLevels(project.storeys, project.groundStoreyId)
    .filter((l) => l.elevation !== null)
    .map((l) => ({ storeyId: l.storeyId, name: names.get(l.storeyId)!, elevation: l.elevation! }));
  const all = [
    ...cuts.flatMap((c) => [...c.loops.flat(), ...c.open.flat()]),
    ...views.flatMap((v) => v.view.points),
  ];
  return {
    cuts,
    views: views.map((v) => v.view),
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

/**
 * Joins an element's cut segments end to end into closed outlines, then limits them to the line
 * (u 0…length): outlines are clipped as polygons and stay closed, open pieces are cut off.
 */
function chain(
  id: string,
  list: [Local, Local][],
  length: number,
  out: (p: Local) => SectionPoint,
): SectionCut {
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
