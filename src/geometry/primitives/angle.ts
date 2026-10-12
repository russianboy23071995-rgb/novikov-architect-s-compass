import type { Point2 } from "./point.ts";
/** Smaller included angle in degrees; normalize before products to avoid overflow. */
export function includedAngle(a: Point2, vertex: Point2, b: Point2): number {
  if (![a.x, a.y, vertex.x, vertex.y, b.x, b.y].every(Number.isFinite))
    throw new Error("Ungültiger Messpunkt.");
  const ax = a.x - vertex.x,
    ay = a.y - vertex.y,
    bx = b.x - vertex.x,
    by = b.y - vertex.y;
  const al = Math.hypot(ax, ay),
    bl = Math.hypot(bx, by);
  if (!al || !bl) throw new Error("Die Winkelschenkel benötigen einen Abstand zum Scheitel.");
  if (!Number.isFinite(al) || !Number.isFinite(bl)) throw new Error("Messbereich zu groß.");
  const ux = ax / al,
    uy = ay / al,
    vx = bx / bl,
    vy = by / bl;
  return (Math.atan2(Math.abs(ux * vy - uy * vx), ux * vx + uy * vy) * 180) / Math.PI;
}
