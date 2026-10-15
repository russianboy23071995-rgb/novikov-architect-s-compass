import type { ProjectionState } from "./projection-state.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import type { ToolInteraction } from "../../application/tools/interaction.ts";

/** Orthographic screen projection onto an arbitrary spatial axis, in CSS pixels.
 * View-aligned axes cannot be resolved by the mouse; numeric input remains usable. */
export function axisTarget(
  projection: ProjectionState,
  axis: NonNullable<ToolInteraction["axisConstraint"]>,
  elevation: number,
  client: Point2,
  step: number | null,
): Point2 | null {
  const a = projection.project([axis.origin.x, axis.origin.y, elevation]);
  const b = projection.project([
    axis.origin.x + axis.direction[0],
    axis.origin.y + axis.direction[1],
    elevation + axis.direction[2],
  ]);
  const { width, height, left, top } = projection.viewport;
  const dx = ((b[0] - a[0]) * width) / 2,
    dy = (-(b[1] - a[1]) * height) / 2;
  const squared = dx * dx + dy * dy;
  if (!Number.isFinite(squared) || squared < 1e-6) return null;
  const px = client.x - left - ((a[0] + 1) * width) / 2;
  const py = client.y - top - ((1 - a[1]) * height) / 2;
  let delta = (px * dx + py * dy) / squared;
  if (step != null && step > 0) delta = Math.round(delta / step) * step;
  return Number.isFinite(delta) ? { x: axis.origin.x, y: axis.origin.y + delta } : null;
}
