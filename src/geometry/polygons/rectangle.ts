import type { Point2 as Point } from "../primitives/point.ts";
export function rectangleContour(
  mode: "diagonal" | "side-height",
  points: readonly Point[],
): Point[] {
  const [a, b, c] = points;
  if (!a || !b) return [];
  if (![a.x, a.y, b.x, b.y, ...(c ? [c.x, c.y] : [])].every(Number.isFinite))
    throw new Error("Ungültiger Punkt.");
  if (mode === "diagonal") return [{ ...a }, { x: b.x, y: a.y }, { ...b }, { x: a.x, y: b.y }];
  if (!c) return [];
  const dx = b.x - a.x,
    dy = b.y - a.y,
    length = Math.hypot(dx, dy);
  if (!length) throw new Error("Die Grundseite benötigt eine Länge.");
  const height = ((c.x - a.x) * -dy + (c.y - a.y) * dx) / length;
  const offset = { x: (-dy / length) * height, y: (dx / length) * height };
  return [
    { ...a },
    { ...b },
    { x: b.x + offset.x, y: b.y + offset.y },
    { x: a.x + offset.x, y: a.y + offset.y },
  ];
}
