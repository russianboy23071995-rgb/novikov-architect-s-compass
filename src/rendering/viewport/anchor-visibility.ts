import type { Vector3 } from "../../geometry/projections/orthographic.ts";
import type { Solid } from "../../lib/bim/geometry.ts";
import type { ProjectionState } from "./projection-state.ts";
import { nearestWallSurface } from "./wall-depth.ts";

/** Numerical NDC-depth tolerance, not a world-space snapping radius or X-ray policy. */
export const ANCHOR_DEPTH_TOLERANCE = 1e-7;
export type AnchorVisibility = "visible" | "occluded" | "outside" | "invalid";

/** Classify against the solid belonging to the displayed snapshot.
 * Does not acquire references or determine whether hidden targets may be offered. */
export function classifyAnchorVisibility(
  solid: Pick<Solid, "faces">,
  projection: ProjectionState | null,
  anchor: Vector3,
): AnchorVisibility {
  if (!projection || !anchor.every(Number.isFinite)) return "invalid";
  const point = projection.project(anchor);
  if (!point.every(Number.isFinite)) return "invalid";
  if (point.some((value) => Math.abs(value) > 1)) return "outside";
  const surface = nearestWallSurface(solid, projection.project, point[0], point[1]);
  return surface && point[2] - surface.depth > ANCHOR_DEPTH_TOLERANCE ? "occluded" : "visible";
}
