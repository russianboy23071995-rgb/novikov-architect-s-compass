import {
  projectOrthographic,
  type OrthographicCamera,
  type ProjectionFrame,
  type Vector3,
} from "../../geometry/projections/orthographic.ts";
/** World point under the viewport centre on the camera-facing plane through frame centre. */
export function cameraFocus(
  frame: ProjectionFrame,
  camera: OrthographicCamera,
  aspect: number,
): Vector3 {
  const c = Math.cos(camera.yaw),
    s = Math.sin(camera.yaw),
    sp = Math.sin(camera.pitch),
    cp = Math.cos(camera.pitch);
  const scale = (0.85 * camera.zoom) / frame.radius;
  const u = (-camera.panX * Math.max(1, aspect)) / scale,
    v = -camera.panY / (scale * Math.min(1, aspect));
  return [
    frame.center[0] + u * c - v * s * sp,
    frame.center[1] + u * s + v * c * sp,
    frame.center[2] + v * cp,
  ];
}
/** Preserve pivot screen position while rotating, independent of model bounds. */
export function orbitAround(
  frame: ProjectionFrame,
  base: OrthographicCamera,
  aspect: number,
  pivot: Vector3,
  dx: number,
  dy: number,
): OrthographicCamera {
  const next = {
    ...base,
    yaw: base.yaw + dx * 0.008,
    pitch: Math.max(-1.45, Math.min(1.45, base.pitch + dy * 0.008)),
  };
  const before = projectOrthographic(pivot, frame, base, aspect),
    after = projectOrthographic(pivot, frame, next, aspect);
  return {
    ...next,
    panX: next.panX + before[0] - after[0],
    panY: next.panY + before[1] - after[1],
  };
}
