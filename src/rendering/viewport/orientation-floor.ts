import type { ProjectionBounds, Vector3 } from "../../geometry/projections/orthographic.ts";
import type { ProjectionState } from "./projection-state.ts";

/** Decorative z=0 footprint, independent of model geometry/picking and camera fit. */
export function orientationFloor(
  bounds: ProjectionBounds,
  projection: ProjectionState,
): string | null {
  if (![...bounds.min, ...bounds.max].every(Number.isFinite)) return null;
  const padding = Math.max(
    1,
    Math.max(bounds.max[0] - bounds.min[0], bounds.max[1] - bounds.min[1]) * 0.15,
  );
  const corners: Vector3[] = [
    [bounds.min[0] - padding, bounds.min[1] - padding, 0],
    [bounds.max[0] + padding, bounds.min[1] - padding, 0],
    [bounds.max[0] + padding, bounds.max[1] + padding, 0],
    [bounds.min[0] - padding, bounds.max[1] + padding, 0],
  ];
  const points = corners.map((p) => projection.project(p));
  if (!points.flat().every(Number.isFinite)) return null;
  return points
    .map(
      ([x, y]) =>
        `${((x + 1) * projection.viewport.width) / 2},${((1 - y) * projection.viewport.height) / 2}`,
    )
    .join(" ");
}
