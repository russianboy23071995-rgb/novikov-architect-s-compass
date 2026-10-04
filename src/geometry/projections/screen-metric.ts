import type { Point2 } from "../primitives/point.ts";

/** Linear part of an affine plane-to-CSS map. Translation cancels in distances. */
export function createAffineScreenMetric(a: number, b: number, c: number, d: number) {
  const scale = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d));
  const determinant = (a / scale) * (d / scale) - (b / scale) * (c / scale);
  const inverse = [
    d / scale / determinant / scale,
    -b / scale / determinant / scale,
    -c / scale / determinant / scale,
    a / scale / determinant / scale,
  ];
  if (![a, b, c, d, ...inverse].every(Number.isFinite) || !scale || !determinant)
    throw new Error("Invalid screen metric");
  const stretch = Math.hypot(a, b, c, d);
  if (!Number.isFinite(stretch)) throw new Error("Invalid screen metric");
  const delta = (p: Point2, q: Point2) => {
    const x = p.x - q.x,
      y = p.y - q.y;
    return { x: a * x + b * y, y: c * x + d * y };
  };
  return Object.freeze({
    distance(p: Point2, q: Point2) {
      const v = delta(p, q);
      return Math.hypot(v.x, v.y);
    },
    queryBounds(p: Point2, radius: number, padding: number) {
      if (![p.x, p.y, radius, padding].every(Number.isFinite) || radius < 0 || padding < 0)
        throw new Error("Invalid local snap query");
      const x = radius * (Math.abs(inverse[0]!) + Math.abs(inverse[1]!)) + padding;
      const y = radius * (Math.abs(inverse[2]!) + Math.abs(inverse[3]!)) + padding;
      const box = { minX: p.x - x, maxX: p.x + x, minY: p.y - y, maxY: p.y + y };
      if (!Object.values(box).every(Number.isFinite)) throw new Error("Invalid local snap query");
      return box;
    },
    segmentNear(p: Point2, start: Point2, end: Point2, radius: number, padding: number) {
      const u = delta(start, p),
        v = delta(end, p);
      const dx = v.x - u.x,
        dy = v.y - u.y,
        length = Math.hypot(dx, dy);
      const nx = length ? dx / length : 0,
        ny = length ? dy / length : 0;
      const along = Math.max(0, Math.min(length, -(u.x * nx + u.y * ny)));
      const distance = Math.hypot(u.x + along * nx, u.y + along * ny);
      // Tolerance contacts can be slightly beyond a segment. Preserve these for
      // exact intersection validation; roundoff uncertainty retains candidates.
      const roundoff =
        64 *
        Number.EPSILON *
        stretch *
        Math.max(
          1,
          Math.abs(p.x),
          Math.abs(p.y),
          Math.abs(start.x),
          Math.abs(start.y),
          Math.abs(end.x),
          Math.abs(end.y),
        );
      const limit = radius + Math.SQRT2 * stretch * padding + roundoff;
      return !Number.isFinite(distance + limit) || distance <= limit;
    },
  });
}
export type ScreenMetric = ReturnType<typeof createAffineScreenMetric>;

/** Preserve the existing 2D distance arithmetic exactly, including radius edges. */
export function createIsotropicScreenMetric(scale: number): ScreenMetric {
  if (!Number.isFinite(scale) || scale <= 0) throw new Error("Invalid screen metric");
  return Object.freeze({
    ...createAffineScreenMetric(scale, 0, 0, scale),
    distance: (p: Point2, q: Point2) => Math.hypot(p.x - q.x, p.y - q.y) * scale,
  });
}
