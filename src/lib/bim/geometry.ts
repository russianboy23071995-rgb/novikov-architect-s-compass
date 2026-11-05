import {
  createProjectionFrame,
  projectOrthographic,
} from "../../geometry/projections/orthographic.ts";
import type {
  OrthographicCamera,
  ProjectionBounds,
  Vector3,
} from "../../geometry/projections/orthographic.ts";

// The storey solid (buildSolid, buildPreviewSolid, Solid/Face/Vec3) lives in
// rendering/viewport/storey-solid.ts since 27.10.2026; only camera helpers remain here.

export type Camera = OrthographicCamera;
export const initialCamera: Camera = { yaw: -0.45, pitch: 0.3, zoom: 1, panX: 0, panY: 0 };

/** Orthographic camera in a Z-up world; depth is preserved for WebGL occlusion. */
export function projectPoint(
  point: Vector3,
  solid: ProjectionBounds,
  camera: Camera,
  aspect: number,
): [number, number, number] {
  return projectOrthographic(point, createProjectionFrame(solid), camera, aspect);
}
