import type { Point2 } from "../primitives/point.ts";

const cross = (o: Point2, a: Point2, b: Point2) =>
  (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

/** Closed triangle test including its edges, for counterclockwise a, b, c. */
function inTriangle(p: Point2, a: Point2, b: Point2, c: Point2) {
  return cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0;
}

/**
 * Ear clipping of one simple ring that validateSimplePolygon accepted (any winding, redundant
 * straight vertices allowed). Returns counterclockwise index triples into the given vertices;
 * straight vertices are dropped without a zero-area triangle. O(n²) to O(n³): meant for
 * building outlines with few vertices, not for pointer-time work.
 */
export function triangulateSimplePolygon(vertices: readonly Point2[]): [number, number, number][] {
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i]!,
      b = vertices[(i + 1) % vertices.length]!;
    area += a.x * b.y - b.x * a.y;
  }
  const ring = vertices.map((_, i) => i);
  if (area < 0) ring.reverse();
  const triangles: [number, number, number][] = [];
  let guard = ring.length * ring.length + 8;
  while (ring.length > 3 && guard-- > 0) {
    let clipped = false;
    for (let i = 0; i < ring.length; i++) {
      const ia = ring[(i + ring.length - 1) % ring.length]!,
        ib = ring[i]!,
        ic = ring[(i + 1) % ring.length]!;
      const a = vertices[ia]!,
        b = vertices[ib]!,
        c = vertices[ic]!;
      const turn = cross(a, b, c);
      if (turn === 0) {
        // Straight vertex: removing it leaves the same outline.
        ring.splice(i, 1);
        clipped = true;
        break;
      }
      if (turn < 0) continue;
      const blocked = ring.some(
        (j) => j !== ia && j !== ib && j !== ic && inTriangle(vertices[j]!, a, b, c),
      );
      if (blocked) continue;
      triangles.push([ia, ib, ic]);
      ring.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) throw new Error("Umriss lässt sich nicht in Dreiecke zerlegen.");
  }
  if (ring.length === 3 && cross(vertices[ring[0]!]!, vertices[ring[1]!]!, vertices[ring[2]!]!) > 0)
    triangles.push([ring[0]!, ring[1]!, ring[2]!]);
  return triangles;
}
