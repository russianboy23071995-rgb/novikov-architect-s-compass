import { projectOrthographic } from "../src/geometry/projections/orthographic.ts";
import type {
  Vector3,
  ProjectionFrame,
  OrthographicCamera,
} from "../src/geometry/projections/orthographic.ts";
/** Pilot only: affine coefficients from the existing projection, no second camera model. */
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
export function projectWithMatrix(point: Vector3, origin: Vector3, matrix: Float32Array): Vector3 {
  // Model the Float32 vertex storage as well as uniform quantisation.
  const p = point.map((v, i) => Math.fround(v - origin[i]!));
  return [0, 1, 2].map(
    (row) =>
      matrix[row]! * p[0]! +
      matrix[4 + row]! * p[1]! +
      matrix[8 + row]! * p[2]! +
      matrix[12 + row]!,
  ) as unknown as Vector3;
}
