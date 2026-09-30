import type { DrawingLine } from "./model.ts";
export type LineAppearance = Pick<DrawingLine, "color" | "penWidth" | "style">;
export const defaultLineAppearance: LineAppearance = {
  color: "#334155",
  penWidth: 0.25,
  style: "solid",
};
export function lineLength(line: DrawingLine): number {
  return line.points
    .slice(1)
    .reduce((sum, p, i) => sum + Math.hypot(p.x - line.points[i]!.x, p.y - line.points[i]!.y), 0);
}
/** Break symbols affect presentation only, never the editable vertices. */
export function linePath(line: DrawingLine): string {
  const first = line.points[0]!;
  let path = `M ${first.x} ${-first.y}`;
  for (let i = 1; i < line.points.length; i++) {
    const a = line.points[i - 1]!,
      b = line.points[i]!;
    const dx = b.x - a.x,
      dy = b.y - a.y,
      length = Math.hypot(dx, dy);
    if (line.style === "break" && length > 0) {
      const size = Math.min(0.08, length / 8);
      for (const [along, across] of [
        [length / 2 - size, 0],
        [length / 2 - size / 3, size],
        [length / 2 + size / 3, -size],
        [length / 2 + size, 0],
      ]) {
        path += ` L ${a.x + (dx / length) * along! - (dy / length) * across!} ${-(a.y + (dy / length) * along! + (dx / length) * across!)}`;
      }
    }
    path += ` L ${b.x} ${-b.y}`;
  }
  return path;
}
