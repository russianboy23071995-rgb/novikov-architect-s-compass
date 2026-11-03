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

const signedArea = (ring: readonly Point2[]) => {
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!,
      b = ring[(i + 1) % ring.length]!;
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
};
/** Proper crossing of the open segments a–b and c–d. */
function crosses(a: Point2, b: Point2, c: Point2, d: Point2) {
  const d1 = cross(c, d, a),
    d2 = cross(c, d, b),
    d3 = cross(a, b, c),
    d4 = cross(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/**
 * Ear clipping of an outline with holes (Deckendurchbrüche, docs/DECKENDURCHBRUCH.md). The holes
 * must lie strictly inside the outline and apart from each other. Each hole is joined to the
 * outline by a bridge to the nearest visible vertex, rightmost hole first; the bridged ring is
 * clipped like a simple ring, where a vertex at a triangle corner never blocks it.
 * Returns counterclockwise index triples into [...outer, ...holes[0], ...holes[1], …].
 */
export function triangulatePolygonWithHoles(
  outer: readonly Point2[],
  holes: readonly (readonly Point2[])[],
): [number, number, number][] {
  if (!holes.length) return triangulateSimplePolygon(outer);
  const vertices: Point2[] = [...outer];
  const ccw = (ring: number[]) =>
    signedArea(ring.map((i) => vertices[i]!)) < 0 ? ring.reverse() : ring;
  let ring = ccw(outer.map((_, i) => i));
  const holeRings = holes.map((hole) => {
    const start = vertices.length;
    vertices.push(...hole);
    // Holes run clockwise so the bridged ring keeps the material on its left.
    return ccw(hole.map((_, i) => start + i)).reverse();
  });
  const holeEdges = holeRings.flatMap((h) => h.map((i, k) => [i, h[(k + 1) % h.length]!] as const));
  const maxX = (h: number[]) => Math.max(...h.map((i) => vertices[i]!.x));
  for (const hole of [...holeRings].sort((a, b) => maxX(b) - maxX(a))) {
    const m = hole.reduce((best, i) => (vertices[i]!.x > vertices[best]!.x ? i : best), hole[0]!);
    const pm = vertices[m]!;
    const edges = [...ring.map((i, k) => [i, ring[(k + 1) % ring.length]!] as const), ...holeEdges];
    const visible = (p: number) =>
      !edges.some(
        ([a, b]) =>
          a !== p &&
          b !== p &&
          a !== m &&
          b !== m &&
          crosses(pm, vertices[p]!, vertices[a]!, vertices[b]!),
      );
    const candidates = [...new Set(ring)]
      .filter((p) => vertices[p]!.x !== pm.x || vertices[p]!.y !== pm.y)
      .sort(
        (p, q) =>
          Math.hypot(vertices[p]!.x - pm.x, vertices[p]!.y - pm.y) -
          Math.hypot(vertices[q]!.x - pm.x, vertices[q]!.y - pm.y),
      );
    const p = candidates.find(visible);
    if (p === undefined) throw new Error("Umriss lässt sich nicht in Dreiecke zerlegen.");
    const at = ring.indexOf(p),
      from = hole.indexOf(m);
    const loop = [...hole.slice(from), ...hole.slice(0, from), m];
    ring = [...ring.slice(0, at + 1), ...loop, ...ring.slice(at)];
  }
  // Clip the bridged ring; duplicated bridge vertices share positions with triangle corners.
  const same = (a: Point2, b: Point2) => a.x === b.x && a.y === b.y;
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
        ring.splice(i, 1);
        clipped = true;
        break;
      }
      if (turn < 0) continue;
      const blocked = ring.some((j) => {
        const q = vertices[j]!;
        return !same(q, a) && !same(q, b) && !same(q, c) && inTriangle(q, a, b, c);
      });
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
