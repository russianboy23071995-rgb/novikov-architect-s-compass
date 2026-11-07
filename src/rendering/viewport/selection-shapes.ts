import { roofWindowRings } from "../../domain/elements/roof/window.ts";
import { stairGeometry, stairLayout, stairOutline } from "../../domain/elements/stair/model.ts";
import { maskOnPaper } from "../../domain/elements/drawing/model.ts";
import { textBox } from "../../domain/elements/text/model.ts";
import { planDenominator } from "../../domain/views/scale.ts";
import { dimensionLayout } from "../../domain/elements/dimension/model.ts";
import { columnOutline } from "../../domain/elements/column/model.ts";
import { slabOpeningOutline } from "../../domain/elements/slab/opening.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { imageReferenceCorners } from "./image-reference.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../../application/selection/target.ts";
import { connectedWallContours } from "../../domain/elements/wall/connections.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { objectOutline, objectPickRings } from "../../domain/elements/object/model.ts";
import { objectDefinition } from "../../domain/elements/object/catalog.ts";
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
  /** Pick areas where they differ from the footprint: the parts of an object. */
  pick?: readonly (readonly Point[])[];
  /** Rank of a display band: 1 above all kinds, -1 below (K3); higher values pick first. */
  band?: number;
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
  // A placed drawing (docs/ZEICHNUNG.md): its mask on the paper.
  drawing: (d) => ({ points: maskOnPaper(d), closed: true }),
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
  slabOpening: (o) => ({ points: slabOpeningOutline(o), closed: true }),
  roof: (r) => ({ points: r.points, closed: true }),
  room: (r) => ({ points: r.points, closed: true }),
  column: (c) => ({ points: columnOutline(c), closed: true }),
  // A chain is picked along its dimension line (docs/MASSKETTE.md).
  dimension: (d) => {
    const { line } = dimensionLayout(d);
    return { points: [line.start, line.end], closed: false };
  },
  // Paper sized texts at the storey's output scale (docs/TEXT.md).
  text: (t, { project }) => ({ points: textBox(t, planDenominator(project)), closed: true }),
  stair: (s, { project }) => ({
    // Footprint of all flights and the landing; unknown height: width square (docs/TREPPE.md).
    points: ((g) => (g ? stairLayout(s, g).footprint : stairOutline(s, s.width)))(
      stairGeometry(s, storeyOf(project).height ?? null),
    ),
    closed: true,
  }),
  // Picked along its line like a polyline (docs/GELAENDER.md).
  railing: (r) => ({ points: r.points, closed: false }),
  // The object's box in plan (docs/OBJEKTBIBLIOTHEK.md).
  object: (o) => ({ points: objectOutline(o), closed: true, pick: objectPickRings(o) }),
  // Outline only: the terrain lies under everything else (docs/GELAENDE.md).
  terrain: (t) => ({ points: [...t.outline, t.outline[0]!], closed: false }),
  // Its opening on the roof top, seen from above (docs/DACHFLAECHENFENSTER.md).
  roofWindow: (w, { project }) => {
    const roof = storeyOf(project).roofs?.find((r) => r.id === w.roofId);
    return { points: roof ? roofWindowRings(roof, w).top : [], closed: true };
  },
};

/** Short caption per kind for hints: the user-facing number or mark where one exists. */
const PLAN_CAPTIONS: { [K in ElementKind]: (element: ElementOf<K>) => string | undefined } = {
  reference: () => undefined,
  drawing: () => undefined,
  wall: () => undefined,
  window: (w) => w.mark,
  door: (d) => d.mark,
  line: () => undefined,
  hatch: () => undefined,
  slab: () => undefined,
  slabOpening: () => undefined,
  roof: () => undefined,
  room: (r) => (r.name ? `${r.number} ${r.name}` : r.number),
  column: () => undefined,
  dimension: () => undefined,
  text: (t) => t.content.split("\n")[0]!.slice(0, 24),
  stair: () => undefined,
  railing: () => undefined,
  roofWindow: () => undefined,
  object: (o) => objectDefinition(o.catalogId).name,
  terrain: () => undefined,
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
  "slabOpening",
  "roof",
  "room",
  "column",
  "dimension",
  "text",
  "stair",
  "railing",
  "roofWindow",
  "object",
  "terrain",
];

/** Plan paint order, topmost first (lines over walls with their openings over hatches over
 * roofs, slabs, rooms and reference images; plan-scene runs). Every kind needs a rank. */
const PICK_RANK: Record<ElementKind, number> = {
  line: 0,
  dimension: 0,
  text: 0,
  stair: 2,
  railing: 2,
  // In its roof, so a click on it picks the window.
  roofWindow: 3.5,
  // Beneath walls and columns, above hatches and rooms (docs/OBJEKTBIBLIOTHEK.md).
  object: 2.5,
  terrain: 8,
  window: 1,
  door: 1,
  wall: 2,
  column: 2,
  hatch: 3,
  roof: 4,
  slab: 5,
  // Drawn over its slab, so a click inside the opening picks the opening.
  slabOpening: 4.5,
  room: 6,
  // Under the layout's own lines and texts, which stay pickable on top of it.
  drawing: 6,
  reference: 7,
};

/** World-space plan geometry; contains no selection state or gesture rules. */
export function planSelectionShapes(project: Project): SelectionShape[] {
  const context = { project, contours: connectedWallContours(project) };
  const storey = storeyOf(project);
  const front = storey.displayBands?.front ?? [],
    back = storey.displayBands?.back ?? [];
  const bandOf = (id: string) => {
    const above = front.indexOf(id);
    if (above >= 0) return 1 + above / (front.length + 1);
    const below = back.indexOf(id);
    return below >= 0 ? -2 + below / (back.length + 1) : undefined;
  };
  const kinds = [...SHAPE_ORDER, ...(Object.keys(ELEMENT_KINDS) as ElementKind[])].filter(
    (kind, i, all) => all.indexOf(kind) === i,
  );
  return kinds.flatMap((kind) =>
    [...storeyElements(storey, kind)]
      // A locked underlay is not picked (docs/BILDUNTERLAGE.md, B2).
      .filter((element) => !(kind === "reference" && "locked" in element && element.locked))
      .map((element) => {
        const shape = (
          PLAN_SHAPES[kind] as (
            e: typeof element,
            c: ShapeContext,
          ) => { points: readonly Point[]; closed: boolean }
        )(element, context);
        const band = bandOf(element.id);
        return {
          target: { kind, id: element.id } as ElementTarget,
          ...shape,
          ...(band === undefined ? {} : { band }),
        };
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
  const near = (pts: readonly Point[], closed: boolean) => {
    const edges = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < edges; i++)
      if (segmentDistance(point, pts[i]!, pts[(i + 1) % pts.length]!) <= tolerance) return true;
    return false;
  };
  const hit = (shape: SelectionShape) => {
    const closed = shape.closed !== false;
    return (shape.pick ?? [shape.points]).some(
      (pts) =>
        pts.length > 0 &&
        ((closed && pts.length >= 3 && contains(pts, point)) || near(pts, closed)),
    );
  };
  return shapes
    .map((shape, order) => ({ shape, order }))
    .filter(({ shape }) => hit(shape))
    .sort(
      (a, b) =>
        (b.shape.band ?? 0) - (a.shape.band ?? 0) ||
        PICK_RANK[a.shape.target.kind] - PICK_RANK[b.shape.target.kind] ||
        b.order - a.order,
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
