import type { Point2 } from "../primitives/point.ts";
import { intersectLines } from "../intersections/lines.ts";
import {
  validateSimplePolygon,
  preparePolygonVertexEdit,
  changedEdgePairs,
} from "./simple-polygon.ts";
export function contourEdge(points: readonly Point2[], index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= points.length || points.length < 3)
    throw new Error("Ungültige Konturkante.");
  const a = points[index]!,
    b = points[(index + 1) % points.length]!;
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (!Number.isFinite(length) || !length) throw new Error("Ungültige Konturkante.");
  return { a, b, normal: { x: -(b.y - a.y) / length, y: (b.x - a.x) / length } };
}
export function editContourEdge(
  points: readonly Point2[],
  index: number,
  action: "insert" | "edge",
  anchor: Point2,
  target: Point2,
): Point2[] {
  const result = moveContourEdge(points, index, action, anchor, target);
  const before = validateSimplePolygon(points),
    after = validateSimplePolygon(result);
  if (!before.valid || !after.valid || before.signedArea * after.signedArea <= 0)
    throw new Error("Die Änderung erzeugt eine ungültige Kontur.");
  return result;
}

function moveContourEdge(
  points: readonly Point2[],
  index: number,
  action: "insert" | "edge",
  anchor: Point2,
  target: Point2,
): Point2[] {
  const { a, b, normal } = contourEdge(points, index);
  const result = points.map((p) => ({ ...p }));
  if (action === "insert") result.splice(index + 1, 0, { ...target });
  else {
    const distance = (target.x - anchor.x) * normal.x + (target.y - anchor.y) * normal.y;
    if (distance === 0) return result;
    const prev = points[(index + points.length - 1) % points.length]!,
      next = points[(index + 2) % points.length]!;
    const shifted = { x: a.x + normal.x * distance, y: a.y + normal.y * distance };
    const direction = { x: b.x - a.x, y: b.y - a.y };
    const start = intersectLines(shifted, direction, prev, { x: a.x - prev.x, y: a.y - prev.y });
    const end = intersectLines(shifted, direction, b, { x: next.x - b.x, y: next.y - b.y });
    if (!start || !end)
      throw new Error("Die Nachbarkanten erlauben keine eindeutige Seitenverschiebung.");
    if ((end.x - start.x) * direction.x + (end.y - start.y) * direction.y <= 0)
      throw new Error("Die Seite darf nicht kollabieren oder ihre Richtung umkehren.");
    result[index] = start;
    result[(index + 1) % points.length] = end;
  }
  return result;
}

/** First valid motion interval only: never jump through a self-intersection. */
export function capContourEdge(
  points: readonly Point2[],
  index: number,
  anchor: Point2,
  target: Point2,
): Point2 {
  return prepareContourEdge(points, index, anchor)(target);
}

/** One preparation per pinned edit; no project or UI dependencies. */
export function prepareContourEdge(input: readonly Point2[], index: number, origin: Point2) {
  const points = input.map((p) => ({ ...p })),
    anchor = { ...origin };
  const { a, b, normal } = contourEdge(points, index);
  if (![anchor.x, anchor.y].every(Number.isFinite)) throw new Error("Ungültiger Ursprung.");
  const changed = [index, (index + 1) % points.length];
  const validation = preparePolygonVertexEdit(points, changed);
  const pairs = changedEdgePairs(points.length, changed);
  return (target: Point2): Point2 => {
    if (![target.x, target.y].every(Number.isFinite)) throw new Error("Ungültige Zielposition.");
    const distance = (target.x - anchor.x) * normal.x + (target.y - anchor.y) * normal.y;
    if (!Number.isFinite(distance)) throw new Error("Ungültiger Versatz.");
    if (distance === 0) return { ...anchor };
    const direction = { x: b.x - a.x, y: b.y - a.y },
      prev = points[(index + points.length - 1) % points.length]!,
      next = points[(index + 2) % points.length]!;
    const shifted = { x: a.x + normal.x * distance, y: a.y + normal.y * distance };
    const start = intersectLines(shifted, direction, prev, { x: a.x - prev.x, y: a.y - prev.y });
    const end = intersectLines(shifted, direction, b, { x: next.x - b.x, y: next.y - b.y });
    if (!start || !end) return { ...anchor };
    const motion = points.map(() => ({ x: 0, y: 0 }));
    motion[index] = { x: start.x - a.x, y: start.y - a.y };
    motion[(index + 1) % points.length] = { x: end.x - b.x, y: end.y - b.y };
    const at = (i: number, t: number) => ({
      x: points[i]!.x + motion[i]!.x * t,
      y: points[i]!.y + motion[i]!.y * t,
    });
    const cross = (a: Point2, b: Point2, c: Point2) =>
      (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const events = new Set<number>([1]);
    const add = (t: number) => {
      if (Number.isFinite(t) && t > 0 && t <= 1) events.add(t);
    };
    // Segment contacts can only change at an orientation zero. Include adjacent
    // edges and coordinate coincidences to catch collapse/collinear overlap.
    const roots = (f0: number, fhalf: number, f1: number) => {
      const qa = 2 * (f1 + f0 - 2 * fhalf),
        qb = f1 - f0 - qa;
      if (Math.abs(qa) <= Number.EPSILON * Math.max(1, Math.abs(qb))) {
        if (qb !== 0) add(-f0 / qb);
        return;
      }
      const disc = qb * qb - 4 * qa * f0;
      if (disc >= 0) {
        const q = -0.5 * (qb + Math.sign(qb || 1) * Math.sqrt(disc));
        add(q / qa);
        if (q !== 0) add(f0 / q);
      }
    };
    for (const [i, j] of pairs) {
      const ni = (i + 1) % points.length,
        nj = (j + 1) % points.length;
      for (const [u, v, w] of [
        [i, ni, j],
        [i, ni, nj],
        [j, nj, i],
        [j, nj, ni],
      ] as [number, number, number][]) {
        roots(
          cross(at(u, 0), at(v, 0), at(w, 0)),
          cross(at(u, 0.5), at(v, 0.5), at(w, 0.5)),
          cross(at(u, 1), at(v, 1), at(w, 1)),
        );
      }
      for (const key of ["x", "y"] as const) {
        const dv = motion[i]![key] - motion[j]![key];
        if (dv !== 0) add((points[j]![key] - points[i]![key]) / dv);
      }
    }
    const point = (t: number) => ({
      x: anchor.x + normal.x * distance * t,
      y: anchor.y + normal.y * distance * t,
    });
    const valid = (t: number) => {
      try {
        const after = validation.validate(moveContourEdge(points, index, "edge", anchor, point(t)));
        return after.valid && validation.signedArea * after.signedArea > 0;
      } catch {
        return false;
      }
    };
    let last = 0;
    for (const event of [...events].sort((a, b) => a - b)) {
      for (const t of [(last + event) / 2, event]) {
        if (valid(t)) {
          last = t;
          continue;
        }
        let lo = last,
          hi = t;
        for (let k = 0; k < 52; k++) {
          const mid = (lo + hi) / 2;
          if (valid(mid)) lo = mid;
          else hi = mid;
        }
        // Stay inside the valid interval, leaving a numerical margin at contact.
        return point(Math.max(0, lo - (hi - lo) * 4 - Number.EPSILON * 16));
      }
    }
    return point(1);
  };
}
