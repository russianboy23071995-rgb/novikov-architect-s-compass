import type { Point2 } from "../primitives/point.ts";
import { contains } from "./contains.ts";

/** Vertex merge grid in model metres: shared wall faces meet within rounding noise. */
const GRID = 1e-7;
const key = (p: Point2) => `${Math.round(p.x / GRID)},${Math.round(p.y / GRID)}`;
type Segment = { a: Point2; b: Point2 };

/** Parameters along s where t meets it: crossings, touching ends and collinear overlaps. */
function splitParameters(s: Segment, t: Segment, out: number[]) {
  const d = { x: s.b.x - s.a.x, y: s.b.y - s.a.y };
  const e = { x: t.b.x - t.a.x, y: t.b.y - t.a.y };
  const length = Math.hypot(d.x, d.y);
  const eps = GRID / Math.max(length, GRID);
  const cross = d.x * e.y - d.y * e.x;
  const w = { x: t.a.x - s.a.x, y: t.a.y - s.a.y };
  if (Math.abs(cross) <= 1e-12 * length * Math.hypot(e.x, e.y)) {
    // Parallel: only collinear overlaps split, at the other segment's end points.
    if (Math.abs(w.x * d.y - w.y * d.x) / length > GRID) return;
    for (const p of [t.a, t.b]) {
      const u = ((p.x - s.a.x) * d.x + (p.y - s.a.y) * d.y) / (length * length);
      if (u > eps && u < 1 - eps) out.push(u);
    }
    return;
  }
  const u = (w.x * e.y - w.y * e.x) / cross;
  const v = (w.x * d.y - w.y * d.x) / cross;
  const ev = GRID / Math.max(Math.hypot(e.x, e.y), GRID);
  if (u > eps && u < 1 - eps && v > -ev && v < 1 + ev) out.push(u);
}

/** Signed area, positive for counterclockwise rings. */
function signedArea(ring: readonly Point2[]) {
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!,
      b = ring[(i + 1) % ring.length]!;
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

/** Drops vertices on a straight run. */
function withoutCollinear(ring: Point2[]): Point2[] {
  return ring.filter((p, i) => {
    const a = ring[(i + ring.length - 1) % ring.length]!,
      b = ring[(i + 1) % ring.length]!;
    return Math.abs((p.x - a.x) * (b.y - p.y) - (p.y - a.y) * (b.x - p.x)) > GRID * GRID;
  });
}

/**
 * The closed area around `point` that the given rings (wall bodies in plan) enclose, as a
 * counterclockwise outline; null when the point lies inside a ring or in no closed area
 * (docs/ROOM_ELEMENT.md, R2). All ring edges are split where they cross, touch or overlap,
 * merged into one planar graph, and its faces are traced; the bounded face containing the
 * point is the result. Islands inside the area (free-standing walls) are not cut out yet.
 */
export function enclosedFace(
  rings: readonly (readonly Point2[])[],
  point: Point2,
): Point2[] | null {
  if (rings.some((ring) => ring.length >= 3 && contains(ring as Point2[], point))) return null;
  const segments: Segment[] = rings.flatMap((ring) =>
    ring.map((a, i) => ({ a, b: ring[(i + 1) % ring.length]! })),
  );
  // Split every segment at all meeting points with every other segment (bounding boxes first).
  const vertices = new Map<string, Point2>();
  const neighbours = new Map<string, Set<string>>();
  const link = (p: Point2, q: Point2) => {
    const kp = key(p),
      kq = key(q);
    if (kp === kq) return;
    if (!vertices.has(kp)) vertices.set(kp, p);
    if (!vertices.has(kq)) vertices.set(kq, q);
    (neighbours.get(kp) ?? neighbours.set(kp, new Set()).get(kp)!).add(kq);
    (neighbours.get(kq) ?? neighbours.set(kq, new Set()).get(kq)!).add(kp);
  };
  const boxes = segments.map((s) => [
    Math.min(s.a.x, s.b.x) - GRID,
    Math.min(s.a.y, s.b.y) - GRID,
    Math.max(s.a.x, s.b.x) + GRID,
    Math.max(s.a.y, s.b.y) + GRID,
  ]);
  segments.forEach((s, i) => {
    const params = [0, 1];
    const [ax0, ay0, ax1, ay1] = boxes[i]!;
    segments.forEach((t, j) => {
      if (i === j) return;
      const [bx0, by0, bx1, by1] = boxes[j]!;
      if (bx0! > ax1! || bx1! < ax0! || by0! > ay1! || by1! < ay0!) return;
      splitParameters(s, t, params);
    });
    params.sort((x, y) => x - y);
    const at = (u: number) => ({ x: s.a.x + (s.b.x - s.a.x) * u, y: s.a.y + (s.b.y - s.a.y) * u });
    for (let k = 0; k + 1 < params.length; k++) link(at(params[k]!), at(params[k + 1]!));
  });
  // Outgoing edges per vertex in counterclockwise order.
  const ordered = new Map<string, string[]>();
  for (const [k, set] of neighbours) {
    const p = vertices.get(k)!;
    ordered.set(
      k,
      [...set].sort((m, n) => {
        const a = vertices.get(m)!,
          b = vertices.get(n)!;
        return Math.atan2(a.y - p.y, a.x - p.x) - Math.atan2(b.y - p.y, b.x - p.x);
      }),
    );
  }
  // Trace faces with the interior on the left: at each vertex take the edge just clockwise
  // of the way back. Bounded faces come out counterclockwise (positive area).
  const visited = new Set<string>();
  let best: Point2[] | null = null,
    bestArea = Infinity;
  for (const [from, outs] of ordered)
    for (const to of outs) {
      if (visited.has(`${from}>${to}`)) continue;
      const face: Point2[] = [];
      let u = from,
        v = to,
        guard = 0;
      while (!visited.has(`${u}>${v}`) && guard++ < 100000) {
        visited.add(`${u}>${v}`);
        face.push(vertices.get(u)!);
        const around = ordered.get(v)!;
        const back = around.indexOf(u);
        const next = around[(back + around.length - 1) % around.length]!;
        u = v;
        v = next;
      }
      const area = signedArea(face);
      if (area > 0 && area < bestArea && contains(face, point)) {
        best = face;
        bestArea = area;
      }
    }
  return best ? withoutCollinear(best) : null;
}
