export type Point2 = { x: number; y: number };

/** Preserve the same floating-point operation order in full and prepared edits. */
export function translatePoint(point: Point2, delta: Point2): Point2 {
  return { x: point.x + delta.x, y: point.y + delta.y };
}
