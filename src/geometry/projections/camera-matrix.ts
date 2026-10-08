import { projectOrthographic } from "./orthographic.ts";
import type { Vector3, ProjectionFrame, OrthographicCamera } from "./orthographic.ts";
/** Affine coefficients from the shared projection; coordinates are local to the buffer origin. */
export function cameraMatrix(
  frame: ProjectionFrame,
  camera: OrthographicCamera,
  aspect: number,
  origin: Vector3,
) {
  const linearFrame = { ...frame, center: [0, 0, 0] as Vector3 },
    linearCamera = { ...camera, panX: 0, panY: 0 };
  const x = projectOrthographic([1, 0, 0], linearFrame, linearCamera, aspect),
    y = projectOrthographic([0, 1, 0], linearFrame, linearCamera, aspect),
    z = projectOrthographic([0, 0, 1], linearFrame, linearCamera, aspect),
    t = projectOrthographic(origin, frame, camera, aspect);
  return new Float32Array([...x, 0, ...y, 0, ...z, 0, ...t, 1]);
}
