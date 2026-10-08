import type { Vector3 } from "../src/geometry/projections/orthographic.ts";
export { cameraMatrix } from "../src/geometry/projections/camera-matrix.ts";
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
