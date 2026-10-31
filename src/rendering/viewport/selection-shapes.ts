import { columnOutline } from "../../domain/elements/column/model.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { imageReferenceCorners } from "./image-reference.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../../application/selection/target.ts";
import { connectedWallContours } from "../../domain/elements/wall/connections.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { contains } from "../../geometry/polygons/contains.ts";
import {
  ELEMENT_KINDS,
  storeyElements,
  type ElementKind,
  type ElementOf,
} from "../../domain/elements/registry.ts";

/** Plan footprint of one element: a closed area (`closed`) or an open polyline (lines). */
export type SelectionShape = {
  target: ElementTarget;
  points: readonly Point[];
  closed?: boolean;
};

type ShapeContext = { project: Project; contours: ReturnType<typeof connectedWallContours> };

/** Opening footprint: the part of the host wall body under the opening. */
function openingShape(
  context: ShapeContext,
  opening: { wallId: string; position: number; width: number },
) {
  const host = storeyOf(context.project).walls.find((w) => w.id === opening.wallId)!;
  const length = Math.hypot(host.end.x - host.start.x, host.end.y - host.start.y);
  const at = (d: number) => ({
    x: host.start.x + ((host.end.x - host.start.x) * d) / length,
    y: host.start.y + ((host.end.y - host.start.y) * d) / length,
  });
  return wallBody({
    ...host,
    start: at(opening.position * length - opening.width / 2),
    end: at(opening.position * length + opening.width / 2),
  }).corners;
}

/**
 * Plan footprint per element kind. Typed over the element registry: a new kind added to
 * ELEMENT_KINDS fails the type check here until it supplies its footprint, so box selection and
 * the Tab cycling of overlapping elements (docs/TAB_AUSWAHL.md) know every kind.
 */
const PLAN_SHAPES: {
  [K in ElementKind]: (
    element: ElementOf<K>,
    context: ShapeContext,
  ) => {
    points: readonly Point[];
    closed: boolean;
  };
} = {
  reference: (r, { project }) => ({
    points: imageReferenceCorners(
      r,
      project.assets.find((a) => a.id === r.assetId)!,
    ),
    closed: true,
  }),
  wall: (w, { contours }) => ({ points: contours.get(w.id) ?? wallBody(w).corners, closed: true }),
  window: (w, context) => ({ points: openingShape(context, w), closed: true }),
  door: (d, context) => ({ points: openingShape(context, d), closed: true }),
  line: (l) => ({ points: l.points, closed: false }),
  hatch: (h) => ({ points: h.points, closed: true }),
  slab: (s) => ({ points: s.points, closed: true }),
  roof: (r) => ({ points: r.points, closed: true }),
  room: (r) => ({ points: r.points, closed: true }),
  column: (c) => ({ points: columnOutline(c), closed: true }),
};

/** Short caption per kind for hints: the user-facing number or mark where one exists. */
const PLAN_CAPTIONS: { [K in ElementKind]: (element: ElementOf<K>) => string | undefined } = {
  reference: () => undefined,
  wall: () => undefined,
  window: (w) => w.mark,
  door: (d) => d.mark,
  line: () => undefined,
  hatch: () => undefined,
  slab: () => undefined,
  roof: () => undefined,
  room: (r) => (r.name ? `${r.number} ${r.name}` : r.number),
  column: () => undefined,
};

/** Shape order of the box selection (kept stable for existing callers). */
const SHAPE_ORDER: readonly ElementKind[] = [
  "reference",
  "wall",
  "window",
  "door",
  "line",
  "hatch",
  "slab",
  "roof",
  "room",
  "column",
];

/** Plan paint order, topmost first (lines over walls with their openings over hatches over
 * roofs, slabs, rooms and reference images; plan-scene runs). Every kind needs a rank. */
const PICK_RANK: Record<ElementKind, number> = {
  line: 0,
  window: 1,
  door: 1,
  wall: 2,
  column: 2,
  hatch: 3,
  roof: 4,
  slab: 5,
  room: 6,
  reference: 7,
};

/** World-space plan geometry; contains no selection state or gesture rules. */
export function planSelectionShapes(project: Project): SelectionShape[] {
  const context = { project, contours: connectedWallContours(project) };
  const storey = storeyOf(project);
  const kinds = [...SHAPE_ORDER, ...(Object.keys(ELEMENT_KINDS) as ElementKind[])].filter(
    (kind, i, all) => all.indexOf(kind) === i,
  );
  return kinds.flatMap((kind) =>
    [...storeyElements(storey, kind)].map((element) => {
      const shape = (
        PLAN_SHAPES[kind] as (
          e: typeof element,
          c: ShapeContext,
        ) => { points: readonly Point[]; closed: boolean }
      )(element, context);
      return { target: { kind, id: element.id } as ElementTarget, ...shape };
    }),
  );
}

/** "Raum R-001 Wohnen", "Tür T1", "Decke": kind label plus number or mark where present. */
export function planElementCaption(project: Project, target: ElementTarget): string {
  const element = [...storeyElements(storeyOf(project), target.kind)].find(
    (e) => e.id === target.id,
  );
  const caption = element
    ? (PLAN_CAPTIONS[target.kind] as (e: typeof element) => string | undefined)(element)
    : undefined;
  return caption
    ? `${ELEMENT_KINDS[target.kind].label} ${caption}`
    : ELEMENT_KINDS[target.kind].label;
}

function segmentDistance(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

/**
 * Every element under a plan point, topmost first (docs/TAB_AUSWAHL.md): inside a closed
 * footprint or within `tolerance` model metres of its outline or of an open polyline. Same
 * kind: later drawn first. Hidden elements are filtered by the caller's shapes.
 */
export function shapesAt(
  shapes: readonly SelectionShape[],
  point: Point,
  tolerance: number,
): SelectionShape[] {
  if (![point.x, point.y, tolerance].every(Number.isFinite)) return [];
  const near = (s: SelectionShape) => {
    const pts = s.points;
    const edges = s.closed === false ? pts.length - 1 : pts.length;
    for (let i = 0; i < edges; i++)
      if (segmentDistance(point, pts[i]!, pts[(i + 1) % pts.length]!) <= tolerance) return true;
    return false;
  };
  return shapes
    .map((shape, order) => ({ shape, order }))
    .filter(
      ({ shape }) =>
        shape.points.length > 0 &&
        ((shape.closed !== false && shape.points.length >= 3 && contains(shape.points, point)) ||
          near(shape)),
    )
    .sort(
      (a, b) =>
        PICK_RANK[a.shape.target.kind] - PICK_RANK[b.shape.target.kind] || b.order - a.order,
    )
    .map(({ shape }) => shape);
}

/** A rectangle is convex: containing every vertex contains every straight edge too. */
export function enclosedTargets(
  shapes: readonly SelectionShape[],
  a: Point,
  b: Point,
): ElementTarget[] {
  if (![a.x, a.y, b.x, b.y].every(Number.isFinite)) return [];
  const minX = Math.min(a.x, b.x),
    maxX = Math.max(a.x, b.x),
    minY = Math.min(a.y, b.y),
    maxY = Math.max(a.y, b.y);
  return shapes
    .filter(
      (s) =>
        s.points.length > 0 &&
        s.points.every((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY),
    )
    .map((s) => s.target);
}
