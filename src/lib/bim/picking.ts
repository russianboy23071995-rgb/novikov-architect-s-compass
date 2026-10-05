import {
  createProjectionFrame,
  projectOrthographic,
} from "../../geometry/projections/orthographic.ts";
import type { Camera } from "./geometry.ts";
import type { DisplaySurfaces } from "../../rendering/viewport/layer-display.ts";
import { nearestWallSurface } from "../../rendering/viewport/wall-depth.ts";
import type { ProjectionFrame } from "../../geometry/projections/orthographic.ts";

/** Match the rendered triangles and depth test; holes contain no pickable faces. */
export function pickWall(
  solid: DisplaySurfaces,
  camera: Camera,
  aspect: number,
  x: number,
  y: number,
): string | null {
  return pickWallInProjection(solid, createProjectionFrame(solid), camera, aspect, x, y);
}

export function pickWallInProjection(
  solid: DisplaySurfaces,
  frame: ProjectionFrame,
  camera: Camera,
  aspect: number,
  x: number,
  y: number,
): string | null {
  if (![aspect, x, y].every(Number.isFinite) || aspect <= 0 || Math.abs(x) > 1 || Math.abs(y) > 1)
    return null;
  return (
    nearestWallSurface(solid, (point) => projectOrthographic(point, frame, camera, aspect), x, y)
      ?.wallId ?? null
  );
}

export function isSelectionClick(startX: number, startY: number, x: number, y: number): boolean {
  return Math.hypot(x - startX, y - startY) <= 4;
}
