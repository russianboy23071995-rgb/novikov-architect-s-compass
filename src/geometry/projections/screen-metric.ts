import type { Point2 } from "../primitives/point.ts";
import { projectDirection } from "./direction.ts";

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
    projectSegment(p: Point2, start: Point2, end: Point2) {
      const dx = end.x - start.x,
        dy = end.y - start.y;
      const point = this.projectLine(p, start, { x: dx, y: dy });
      if (!point) return null;
      const t = Math.abs(dx) >= Math.abs(dy) ? (point.x - start.x) / dx : (point.y - start.y) / dy;
      if (!Number.isFinite(t)) return null;
      const closest = t < 0 ? { ...start } : t > 1 ? { ...end } : point;
      return { point: closest, t, distance: this.distance(p, closest) };
    },
    /** Nearest point on an infinite model line in CSS distance, not a model-angle constraint. */
    projectLine(p: Point2, origin: Point2, direction: Point2): Point2 | null {
      if (![p.x, p.y, origin.x, origin.y, direction.x, direction.y].every(Number.isFinite))
        return null;
      const size = Math.max(Math.abs(direction.x), Math.abs(direction.y));
      if (!size) return null;
      const x = direction.x / size,
        y = direction.y / size;
      // Normalize the matrix to avoid squaring large pixel scales.
      const sx = (a / scale) * x + (b / scale) * y;
      const sy = (c / scale) * x + (d / scale) * y;
      const length = Math.hypot(sx, sy);
      if (!length || !Number.isFinite(length)) return null;
      const dx = p.x - origin.x,
        dy = p.y - origin.y;
      const px = (a / scale) * dx + (b / scale) * dy;
      const py = (c / scale) * dx + (d / scale) * dy;
      const t = (px * (sx / length) + py * (sy / length)) / length;
      const point = { x: origin.x + t * x, y: origin.y + t * y };
      return Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null;
    },
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
    projectSegment(p: Point2, start: Point2, end: Point2) {
      const dx = end.x - start.x,
        dy = end.y - start.y,
        ll = dx * dx + dy * dy;
      if (!ll || !Number.isFinite(ll)) return null;
      const t = ((p.x - start.x) * dx + (p.y - start.y) * dy) / ll;
      if (!Number.isFinite(t)) return null;
      const clamped = Math.max(0, Math.min(1, t));
      return {
        point: { x: start.x + clamped * dx, y: start.y + clamped * dy },
        t,
        distance: Math.hypot(p.x - start.x - clamped * dx, p.y - start.y - clamped * dy) * scale,
      };
    },
    projectLine: (p: Point2, origin: Point2, direction: Point2) => {
      if (![p.x, p.y, origin.x, origin.y].every(Number.isFinite)) return null;
      const point = projectDirection(p, origin, direction);
      return point && Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null;
    },
    distance: (p: Point2, q: Point2) => Math.hypot(p.x - q.x, p.y - q.y) * scale,
  });
}
