import type { Point2 } from "../../geometry/primitives/point.ts";
/** Linear work in path vertices. SVG tiles repeat lazily; no generated model lines. */
export function linePatternLayout(points: readonly Point2[], period: number, repeatLength: number) {
  if (
    !Number.isFinite(period) ||
    period <= 0 ||
    !Number.isFinite(repeatLength) ||
    repeatLength <= 0
  )
    throw new Error("Invalid line pattern size");
  const scale = repeatLength / period;
  const segments = [];
  let phase = 0;
  for (let i = 1; i < points.length; i++) {
    const start = points[i - 1]!,
      end = points[i]!;
    const dx = end.x - start.x,
      dy = end.y - start.y,
      length = Math.hypot(dx, dy);
    if (length > 0) {
      segments.push({ start, length, rotation: (-Math.atan2(dy, dx) * 180) / Math.PI, phase });
      phase = (phase + length) % repeatLength;
    }
  }
  return { scale, segments };
}
