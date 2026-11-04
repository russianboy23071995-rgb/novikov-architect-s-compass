import { storeyOf } from "../../domain/storeys/access.ts";
import { connectedWallContours } from "../../domain/elements/wall/connections.ts";
import { isOwnedProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { SnapReference } from "../../constraints/snapping/engine.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import { segmentMidpoint } from "../../geometry/primitives/segment.ts";
import { segmentIntersectionReferences } from "../../constraints/snapping/segment-references.ts";
import type { SnapSegment } from "../../constraints/snapping/segment-references.ts";
import { createDerivedCache } from "../../domain/project/derived-cache.ts";
import { columnOutline } from "../../domain/elements/column/model.ts";
import { objectOutline } from "../../domain/elements/object/model.ts";
import { roofWindowRings } from "../../domain/elements/roof/window.ts";
import { maskOnPaper } from "../../domain/elements/drawing/model.ts";
import { MARGIN_FRAME_SNAP_ID, PAPER_SNAP_ID, rectCorners, sheetFrames } from "./sheet-frames.ts";

// Project snapshots are immutable. Weak keys release discarded projects; the undo history
// drops the entries of the steps it keeps (domain/project/derived-cache.ts).
// Keep tool filtering and temporary construction origins out of this model-only cache.
const referenceCache = createDerivedCache<Project, readonly SnapReference[]>();
/** Interpret only the wall endpoint features emitted below; midpoints are not editable grips. */
export function wallEndpointIndex(feature: string): 0 | 1 | null {
  if (["axis-start", "corner-0--1", "corner-0-1"].includes(feature)) return 0;
  if (["axis-end", "corner-1--1", "corner-1-1"].includes(feature)) return 1;
  return null;
}

export function getProjectSnapReferences(project: Project): readonly SnapReference[] {
  let references = referenceCache.get(project);
  if (!references) {
    references = Object.freeze(projectSnapReferences(project));
    referenceCache.set(project, references);
  }
  return references;
}

function midpointReference(
  entityId: string,
  feature: string,
  a: Point2,
  b: Point2,
): SnapReference[] {
  const point = segmentMidpoint(a, b);
  return point
    ? [
        {
          point,
          entityId,
          kind: "midpoint",
          segment: { start: { ...a }, end: { ...b } },
          // Include the source segment snapshot: a rotation about its centre must invalidate tracking too.
          feature: `${feature}:${JSON.stringify([a.x, a.y, b.x, b.y])}`,
          directions: [{ x: b.x - a.x, y: b.y - a.y }],
        },
      ]
    : [];
}

/** Disposable references derived from the authoritative model. Wall endpoints mean axis ends. */
export function projectSnapReferences(project: Project): SnapReference[] {
  const { references, segments } = projectSnapPrimitives(project);
  return [...references, ...segmentIntersectionReferences(segments)];
}

type Part = { references: SnapReference[]; segments: SnapSegment[] };
export type SnapPart = Readonly<Part>;
// Parts derived from deeply frozen elements of owned snapshots. Identity fixes their content,
// so an unchanged line, hatch or wall set keeps its derived references across commits.
const elementParts = new WeakMap<object, Part>();
const wallParts = new WeakMap<object, { key: string; part: Part }>();

/** Collects one element's references and the midpoint segments that point at them. */
function part(build: (midpoint: typeof midpointReference) => SnapReference[]): Part {
  const segments: SnapSegment[] = [];
  const references = build((id, feature, start, end) => {
    const refs = midpointReference(id, feature, start, end);
    if (refs[0]) segments.push({ start: { ...start }, end: { ...end }, source: refs[0] });
    return refs;
  });
  return { references, segments };
}

function remembered<T extends object>(owned: boolean, element: T, build: (e: T) => Part): Part {
  if (!owned) return build(element);
  let cached = elementParts.get(element);
  if (!cached) elementParts.set(element, (cached = build(element)));
  return cached;
}

/** Snap parts per element kind, in query order (walls, doors, hatches, lines, slabs). Parts of unchanged elements of
 * owned snapshots are the same objects across commits.
 */
export function projectSnapParts(project: Project): readonly (readonly SnapPart[])[] {
  const owned = isOwnedProjectSnapshot(project);
  const storey = storeyOf(project);
  return [
    wallsPart(project, owned),
    doorsPart(storey, owned),
    storey.hatches.map((hatch) => remembered(owned, hatch, hatchPart)),
    (storey.lines ?? []).map((line) => remembered(owned, line, linePart)),
    // Ceiling slab corners and edge midpoints, like a hatch outline (docs/SLAB_ELEMENT.md, B3).
    (storey.slabs ?? []).map((slab) => remembered(owned, slab, hatchPart)),
    // Roof outline corners and edge midpoints (docs/ROOF_ELEMENT.md, D3).
    (storey.roofs ?? []).map((roof) => remembered(owned, roof, hatchPart)),
    // Room outline corners and edge midpoints (docs/ROOM_ELEMENT.md, R2).
    (storey.rooms ?? []).map((room) => remembered(owned, room, hatchPart)),
    // Column centre; corners and edge midpoints of a rectangle, four rim points of a circle
    // (docs/STUETZEN.md, P3).
    (storey.columns ?? []).map((column) => remembered(owned, column, columnPart)),
    // Mask corners and edge midpoints of a drawing on a layout (docs/ZEICHNUNG.md, ZW2).
    (storey.drawings ?? []).map((d) => remembered(owned, d, drawingPart)),
    // Deckendurchbruch corners and edge midpoints (docs/DECKENDURCHBRUCH.md), after all
    // earlier kinds so their order stays.
    (storey.slabOpenings ?? []).map((o) =>
      remembered(owned, o, (opening) =>
        opening.points
          ? hatchPart({ id: opening.id, points: opening.points })
          : circlePart(opening),
      ),
    ),
    // Railing points and segment midpoints like a polyline (docs/GELAENDER.md, G3), after all
    // earlier kinds so their order stays.
    (storey.railings ?? []).map((railing) => remembered(owned, railing, linePart)),
    // Object: corners and edge midpoints of its box and its centre (docs/OBJEKTBIBLIOTHEK.md).
    (storey.objects ?? []).map((object) =>
      remembered(owned, object, (o) => {
        const outline = hatchPart({ id: o.id, points: objectOutline(o) });
        const centre: SnapReference = {
          point: { ...o.position },
          entityId: o.id,
          feature: "centre",
          directions: [],
        };
        return { references: [centre, ...outline.references], segments: outline.segments };
      }),
    ),
    // Roof window: corners and edge midpoints of its opening on the roof top and its centre
    // (docs/DACHFLAECHENFENSTER.md, D3), after all earlier kinds.
    (storey.roofWindows ?? []).flatMap((w) => {
      const roof = (storey.roofs ?? []).find((r) => r.id === w.roofId);
      if (!roof) return [];
      const top = roofWindowRings(roof, w).top;
      const outline = hatchPart({ id: w.id, points: top });
      const centre: SnapReference = {
        point: { x: top.reduce((n, p) => n + p.x, 0) / 4, y: top.reduce((n, p) => n + p.y, 0) / 4 },
        entityId: w.id,
        feature: "centre",
        directions: [],
      };
      return [{ references: [centre, ...outline.references], segments: outline.segments }];
    }),
    // Paper and margin frame of a Plankopf or layout: corners, edge midpoints and, through
    // the corner directions, the edges themselves (docs/LAYOUTS.md).
    sheetParts(project),
  ];
}

function columnPart(column: NonNullable<Project["storeys"][number]["columns"]>[number]): Part {
  const centre: SnapReference = {
    point: { ...column.position },
    entityId: column.id,
    feature: "centre",
    directions: [],
  };
  if (column.shape.kind === "rectangle") {
    const outline = hatchPart({ id: column.id, points: columnOutline(column) });
    return { references: [centre, ...outline.references], segments: outline.segments };
  }
  const outline = columnOutline(column);
  const step = outline.length / 4;
  return {
    references: [
      centre,
      ...[0, 1, 2, 3].map((k) => ({
        point: { ...outline[k * step]! },
        entityId: column.id,
        feature: `quadrant-${k}`,
        directions: [],
      })),
    ],
    segments: [],
  };
}

/** A round slab opening: centre and the four quadrant points of its rim. */
function circlePart(
  opening: NonNullable<Project["storeys"][number]["slabOpenings"]>[number],
): Part {
  const { center, diameter } = opening.circle!;
  const r = diameter / 2;
  return {
    references: [
      { point: { ...center }, entityId: opening.id, feature: "centre", directions: [] },
      ...[0, 1, 2, 3].map((k) => ({
        point: {
          x: center.x + r * Math.cos((k * Math.PI) / 2),
          y: center.y + r * Math.sin((k * Math.PI) / 2),
        },
        entityId: opening.id,
        feature: `quadrant-${k}`,
        directions: [],
      })),
    ],
    segments: [],
  };
}

/** No intersection enumeration; shared primitive adapter for old and local query paths. */
export function projectSnapPrimitives(project: Project) {
  const parts = projectSnapParts(project).flat();
  return {
    references: parts.flatMap((p) => p.references),
    segments: parts.flatMap((p) => p.segments),
  };
}

// Opening jambs depend on the opening and its host wall; reuse only while both are the same
// objects.
const doorParts = new WeakMap<object, { wall: object; part: Part }>();

/** The four jamb corners of each window and door (both wall faces at both opening edges);
 * windows since docs/MASSKETTE.md (M1), so chains and other tools snap to window edges. */
function doorsPart(storey: Project["storeys"][number], owned: boolean): Part[] {
  const walls = new Map(storey.walls.map((w) => [w.id, w]));
  return [...storey.windows, ...(storey.doors ?? [])].flatMap((door) => {
    const wall = walls.get(door.wallId);
    if (!wall) return [];
    const cached = owned ? doorParts.get(door) : undefined;
    if (cached?.wall === wall) return [cached.part];
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    const body = wallBody(wall);
    const d = { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y };
    const at = (along: number, side: -1 | 1) => ({
      x: body.start.x + (d.x / length) * along + (body.normal.x * side * wall.thickness) / 2,
      y: body.start.y + (d.y / length) * along + (body.normal.y * side * wall.thickness) / 2,
    });
    const left = door.position * length - door.width / 2;
    const result: Part = {
      references: (
        [
          ["start", left],
          ["end", left + door.width],
        ] as const
      ).flatMap(([edge, along]) =>
        ([-1, 1] as const).map((side) => ({
          point: at(along, side),
          entityId: door.id,
          feature: `jamb-${edge}-${side}`,
          directions: [d],
        })),
      ),
      segments: [],
    };
    if (owned) doorParts.set(door, { wall, part: result });
    return [result];
  });
}

/** Wall references depend on the wall and its joined contour. Each wall keeps its own part
 * while both are unchanged, so an edit derives only the walls whose contour changed
 * (docs/performance/EDIT_CYCLE.md, Teil B).
 */
function wallsPart(project: Project, owned: boolean): Part[] {
  // Snapping needs only the joined 2D contours, not the extruded solids.
  const joined = connectedWallContours(project);
  return storeyOf(project).walls.map((wall) => {
    const ring = joined.get(wall.id);
    const key = ring ? JSON.stringify(ring) : "";
    const cached = owned ? wallParts.get(wall) : undefined;
    if (cached?.key === key) return cached.part;
    const result = part((midpoint) => {
      const d = { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y };
      const body = wallBody(wall);
      return [
        ...[wall.start, wall.end].flatMap((point, index) => [
          {
            point: { ...point },
            entityId: wall.id,
            feature: index === 0 ? "axis-start" : "axis-end",
            directions: [d],
          },
          ...[-1, 1].map((side) => ({
            // A copy: the snap index freezes its references, the contour stays shared.
            point: ((corner) => (corner ? { ...corner } : body.corner(index, side)))(
              ring?.[index === 0 ? (side === -1 ? 0 : 3) : side === -1 ? 1 : 2],
            ),
            entityId: wall.id,
            feature: ring ? `join-corner-${index}-${side}` : `corner-${index}-${side}`,
            directions: [d],
          })),
        ]),
        ...midpoint(wall.id, "axis-midpoint", wall.start, wall.end),
      ];
    });
    if (owned) wallParts.set(wall, { key, part: result });
    return result;
  });
}

function hatchPart(hatch: { id: string; points: readonly { x: number; y: number }[] }): Part {
  return part((midpoint) =>
    hatch.points.flatMap((point, index) => {
      const before = hatch.points[(index + hatch.points.length - 1) % hatch.points.length]!;
      const after = hatch.points[(index + 1) % hatch.points.length]!;
      return [
        {
          point: { ...point },
          entityId: hatch.id,
          feature: `vertex-${index}`,
          directions: [before, after].map((p) => ({ x: p.x - point.x, y: p.y - point.y })),
        },
        ...midpoint(hatch.id, `segment-${index}-midpoint`, point, after),
      ];
    }),
  );
}

/** Points and segment midpoints of a line, polyline or railing (docs/GELAENDER.md, G3). */
function linePart(line: { id: string; points: readonly { x: number; y: number }[] }): Part {
  return part((midpoint) => [
    ...line.points.map((point, index) => ({
      point: { ...point },
      entityId: line.id,
      feature: `vertex-${index}`,
      directions: [line.points[index - 1], line.points[index + 1]]
        .filter((p) => p !== undefined)
        .map((p) => ({ x: p.x - point.x, y: p.y - point.y })),
    })),
    ...line.points
      .slice(1)
      .flatMap((point, index) =>
        midpoint(line.id, `segment-${index}-midpoint`, line.points[index]!, point),
      ),
  ]);
}

function drawingPart(drawing: Parameters<typeof maskOnPaper>[0] & { id: string }): Part {
  return hatchPart({ id: drawing.id, points: maskOnPaper(drawing) });
}

const sheetPartCache = createDerivedCache<Project, Part[]>();
function sheetParts(project: Project): Part[] {
  const sheet = sheetFrames(project);
  if (!sheet) return [];
  let parts = sheetPartCache.get(project);
  if (!parts) {
    const under = sheet.backdrop ? storeyOf(sheet.backdrop) : null;
    parts = [
      hatchPart({ id: PAPER_SNAP_ID, points: rectCorners(sheet.paper) }),
      hatchPart({ id: MARGIN_FRAME_SNAP_ID, points: rectCorners(sheet.frame) }),
      // Master drawing and title block under a layout: their corners and lines snap.
      ...(under?.lines ?? []).map(linePart),
      ...(under?.hatches ?? []).map(hatchPart),
      ...(under?.drawings ?? []).map(drawingPart),
    ];
    sheetPartCache.set(project, parts);
  }
  return parts;
}

/** Snap part of a closed outline: corners with both edge directions, edge midpoints. */
export const ringSnapPart = (id: string, points: readonly Point2[]): SnapPart =>
  hatchPart({ id, points });
/** Snap part of an open polyline: its points and the midpoints of its pieces. */
export function pathSnapPart(id: string, points: readonly Point2[]): SnapPart {
  return part((midpoint) => [
    ...points.map((point, index) => ({
      point: { ...point },
      entityId: id,
      feature: `vertex-${index}`,
      directions: [points[index - 1], points[index + 1]]
        .filter((p) => p !== undefined)
        .map((p) => ({ x: p.x - point.x, y: p.y - point.y })),
    })),
    ...points
      .slice(1)
      .flatMap((point, index) => midpoint(id, `segment-${index}-midpoint`, points[index]!, point)),
  ]);
}
