/** Convex planar faces only, with their existing winding. */
export function* faceTriangles(vertexCount: number): Generator<readonly [number, number, number]> {
  for (let i = 1; i + 1 < vertexCount; i++) yield [0, i, i + 1];
}
