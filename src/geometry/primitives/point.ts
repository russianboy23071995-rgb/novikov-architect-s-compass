export type Point2 = { x: number; y: number };

/** Preserve the same floating-point operation order in full and prepared edits. */
export function translatePoint(point: Point2, delta: Point2): Point2 {
  return { x: point.x + delta.x, y: point.y + delta.y };
}

/** Move a path vertex, preserving a duplicated closing vertex when present. */
export function replacePathVertex(
  input: readonly Point2[],
  index: number,
  position: Point2,
): Point2[] {
  if (!Number.isInteger(index) || index < 0 || index >= input.length)
    throw new Error("Ungültiger Punkt.");
  const points = input.map((p) => ({ ...p }));
  const last = points.length - 1;
  const closed =
    points.length > 2 && points[0]!.x === points[last]!.x && points[0]!.y === points[last]!.y;
  points[index] = { ...position };
  if (closed && (index === 0 || index === last)) {
    points[0] = { ...position };
    points[last] = { ...position };
  }
  return points;
}
