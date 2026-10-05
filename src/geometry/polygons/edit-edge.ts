import type { Point2 } from "../primitives/point.ts";
import { intersectLines } from "../intersections/lines.ts";
import { validateSimplePolygon } from "./simple-polygon.ts";
export function contourEdge(points: readonly Point2[], index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= points.length || points.length < 3)
    throw new Error("Ungültige Konturkante.");
  const a = points[index]!,
    b = points[(index + 1) % points.length]!;
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (!Number.isFinite(length) || !length) throw new Error("Ungültige Konturkante.");
  return { a, b, normal: { x: -(b.y - a.y) / length, y: (b.x - a.x) / length } };
}
export function editContourEdge(
  points: readonly Point2[],
  index: number,
  action: "insert" | "edge",
  anchor: Point2,
  target: Point2,
): Point2[] {
  const { a, b, normal } = contourEdge(points, index);
  const result = points.map((p) => ({ ...p }));
  if (action === "insert") result.splice(index + 1, 0, { ...target });
  else {
    const distance = (target.x - anchor.x) * normal.x + (target.y - anchor.y) * normal.y;
    if (distance === 0) return result;
    const prev = points[(index + points.length - 1) % points.length]!,
      next = points[(index + 2) % points.length]!;
    const shifted = { x: a.x + normal.x * distance, y: a.y + normal.y * distance };
    const direction = { x: b.x - a.x, y: b.y - a.y };
    const start = intersectLines(shifted, direction, prev, { x: a.x - prev.x, y: a.y - prev.y });
    const end = intersectLines(shifted, direction, b, { x: next.x - b.x, y: next.y - b.y });
    if (!start || !end)
      throw new Error("Die Nachbarkanten erlauben keine eindeutige Seitenverschiebung.");
    if ((end.x - start.x) * direction.x + (end.y - start.y) * direction.y <= 0)
      throw new Error("Die Seite darf nicht kollabieren oder ihre Richtung umkehren.");
    result[index] = start;
    result[(index + 1) % points.length] = end;
  }
  const before = validateSimplePolygon(points),
    after = validateSimplePolygon(result);
  if (!before.valid || !after.valid || before.signedArea * after.signedArea <= 0)
    throw new Error("Die Änderung erzeugt eine ungültige Kontur.");
  return result;
}
