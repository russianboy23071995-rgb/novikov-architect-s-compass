import type { Point } from "../../domain/project/schema.ts";

/**
 * How a click-by-click drawing tool closes (docs/POLYGON_REGELN.md, Regel 3). Every tool that
 * sets points one by one declares one value; the click rule below is then shared:
 * - "polygon": closed outline (hatch, slab, …); closing keeps the points as drawn.
 * - "polyline": open path that may close; closing repeats the start point at the end.
 * - "none": no closing by click (e.g. rectangle constructions, single lines).
 */
export type PathClosure = "polygon" | "polyline" | "none";

export type PathClick = { kind: "append"; points: Point[] } | { kind: "finish"; points: Point[] };

/** Snapped clicks reproduce the start exactly; the bound only absorbs rounding. */
const SAME_POINT = 1e-9;

/** Fewest drawn points before a click on the start closes the shape (a triangle). */
export const MIN_CLOSING_POINTS = 3;

/** True when a click at `point` would close `points` instead of adding a point. */
export function closesAtStart(
  points: readonly Point[],
  point: Point,
  closure: PathClosure,
): boolean {
  const start = points[0];
  return (
    closure !== "none" &&
    start !== undefined &&
    points.length >= MIN_CLOSING_POINTS &&
    Math.hypot(point.x - start.x, point.y - start.y) <= SAME_POINT
  );
}

/** Next state of a click-by-click drawing: add the point, or close and finish the shape. */
export function resolvePathClick(
  points: readonly Point[],
  point: Point,
  closure: PathClosure,
): PathClick {
  if (!closesAtStart(points, point, closure)) return { kind: "append", points: [...points, point] };
  return {
    kind: "finish",
    points: closure === "polyline" ? [...points, { ...points[0]! }] : [...points],
  };
}

/** Same capture radius as endpoint snapping in the plan. */
export const START_CAPTURE_PX = 10;

/**
 * The start point wins over every other snap near it (guides, angles, grid): a cursor within
 * `radiusPx` on screen returns the exact start, so preview and click close alike. Null when
 * the tool does not close by click, too few points exist or the cursor is farther away.
 */
export function capturedStart(
  points: readonly Point[],
  cursor: Point,
  pixelsPerMetre: number,
  closure: PathClosure,
  radiusPx = START_CAPTURE_PX,
): Point | null {
  const start = points[0];
  if (closure === "none" || !start || points.length < MIN_CLOSING_POINTS) return null;
  const distancePx = Math.hypot(cursor.x - start.x, cursor.y - start.y) * pixelsPerMetre;
  return distancePx <= radiusPx ? { ...start } : null;
}
