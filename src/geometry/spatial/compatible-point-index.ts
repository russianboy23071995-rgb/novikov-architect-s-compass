import type { Point2 } from "../primitives/point.ts";
import { MAX_MODEL_TOLERANCE_METRES, pointsCompatible } from "../tolerances/model.ts";
import { createBoxIndex } from "./box-index.ts";
/** Conservative broad phase; exact model compatibility remains the narrow phase. */
export function createCompatiblePointIndex(points: readonly Point2[]) {
  const index = createBoxIndex(
    points
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      .map((p) => ({
        box: { minX: p.x, maxX: p.x, minY: p.y, maxY: p.y },
        value: { ...p },
      })),
  );
  return Object.freeze({
    has(point: Point2): boolean {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
      const radius = MAX_MODEL_TOLERANCE_METRES;
      const bound = (n: number) => Math.max(-Number.MAX_VALUE, Math.min(Number.MAX_VALUE, n));
      return index
        .query({
          minX: bound(point.x - radius),
          maxX: bound(point.x + radius),
          minY: bound(point.y - radius),
          maxY: bound(point.y + radius),
        })
        .some((p) => pointsCompatible(p, point));
    },
  });
}
