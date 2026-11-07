import type { Point2 } from "../primitives/point.ts";
import { triangulateSimplePolygon } from "./triangulate.ts";

const cross = (o: Point2, a: Point2, b: Point2) =>
  (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
const MIN_AREA = 1e-9;

/** Area of a ring, without sign. */
export function ringArea(points: readonly Point2[]): number {
  let sum = 0;
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length]!;
    sum += p.x * q.y - q.x * p.y;
  });
  return Math.abs(sum) / 2;
}

function triangles(points: readonly Point2[]): Point2[][] {
  return triangulateSimplePolygon(points).map(([i, j, k]) => {
    const tri = [points[i]!, points[j]!, points[k]!];
    return cross(tri[0]!, tri[1]!, tri[2]!) < 0 ? tri.reverse() : tri;
  });
}

/** Sutherland–Hodgman: the part of a convex ring inside a counterclockwise triangle. */
function clip(subject: readonly Point2[], window: readonly Point2[]): Point2[] {
  let out = [...subject];
  window.forEach((a, i) => {
    const b = window[(i + 1) % window.length]!;
    const input = out;
    out = [];
    input.forEach((p, j) => {
      const q = input[(j + 1) % input.length]!;
      const dp = cross(a, b, p),
        dq = cross(a, b, q);
      if (dp >= 0) out.push(p);
      if (dp > 0 !== dq > 0 && dp !== dq) {
        const t = dp / (dp - dq);
        out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
      }
    });
  });
  return out;
}

/** Where two simple polygons overlap, as convex pieces; their areas add up exactly. */
export function overlapPieces(a: readonly Point2[], b: readonly Point2[]): Point2[][] {
  const windows = triangles(b);
  return triangles(a)
    .flatMap((piece) => windows.map((window) => clip(piece, window)))
    .filter((piece) => piece.length >= 3 && ringArea(piece) > MIN_AREA);
}
