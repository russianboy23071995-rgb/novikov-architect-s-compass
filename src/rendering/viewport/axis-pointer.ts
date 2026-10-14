import type { ProjectionState } from "./projection-state.ts";
import type { Vector3 } from "../../geometry/projections/orthographic.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
/** Signed orthographic axis distance. Reject view-aligned axes instead of amplifying noise. */
export function axisPointerDistance(
  projection: ProjectionState,
  origin: Vector3,
  direction: Vector3,
  pointer: Point2,
): number | null {
  const screen = (point: Vector3) => {
    const p = projection.project(point),
      v = projection.viewport;
    return { x: v.left + ((p[0] + 1) * v.width) / 2, y: v.top + ((1 - p[1]) * v.height) / 2 };
  };
  const a = screen(origin),
    b = screen(origin.map((n, i) => n + direction[i]!) as unknown as Vector3);
  const dx = b.x - a.x,
    dy = b.y - a.y,
    squared = dx * dx + dy * dy;
  if (!Number.isFinite(squared) || squared < 1) return null;
  const value = ((pointer.x - a.x) * dx + (pointer.y - a.y) * dy) / squared;
  return Number.isFinite(value) ? value : null;
}
