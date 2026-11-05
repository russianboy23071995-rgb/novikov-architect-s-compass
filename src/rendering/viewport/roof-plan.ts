import type { Point2 } from "../../geometry/primitives/point.ts";
import { roofFaceRings, roofFrame, roofRun } from "../../domain/elements/roof/geometry.ts";
import type { Roof } from "../../domain/elements/roof/model.ts";
import { roofBody } from "./roof-solid.ts";

/**
 * Fixed plan cut height above the storey floor (docs/ROOF_ELEMENT.md, D4; user decision
 * 29.10.2026). Only roofs are drawn as cut; walls keep their full plan display.
 */
export const PLAN_CUT_HEIGHT = 1;

type Vec3 = [number, number, number];
type Segment = [Point2, Point2];

/** Crossing of edge a–b with the plane z = h, computed in a fixed edge order so that both
 * faces sharing the edge produce the identical point. */
function crossing(a: Vec3, b: Vec3, h: number): Point2 {
  const [p, q] =
    a[0] < b[0] || (a[0] === b[0] && (a[1] < b[1] || (a[1] === b[1] && a[2] < b[2])))
      ? [a, b]
      : [b, a];
  const t = (h - p[2]) / (q[2] - p[2]);
  return { x: p[0] + (q[0] - p[0]) * t, y: p[1] + (q[1] - p[1]) * t };
}

const key = (p: Point2) => `${p.x.toFixed(9)},${p.y.toFixed(9)}`;

/** Closed loops where the plane z = h cuts a closed surface of planar convex faces. A vertex on
 * the plane counts as above it, so every crossing is found exactly once per face. */
export function sectionLoops(
  faces: readonly { vertices: readonly Vec3[] }[],
  h: number,
): Point2[][] {
  const segments: Segment[] = [];
  for (const face of faces) {
    const points: Point2[] = [];
    const n = face.vertices.length;
    for (let i = 0; i < n; i++) {
      const a = face.vertices[i]!,
        b = face.vertices[(i + 1) % n]!;
      if (a[2] >= h !== b[2] >= h) points.push(crossing(a, b, h));
    }
    if (points.length === 2 && key(points[0]!) !== key(points[1]!))
      segments.push([points[0]!, points[1]!]);
  }
  const byPoint = new Map<string, Segment[]>();
  for (const s of segments)
    for (const p of s) {
      const list = byPoint.get(key(p)) ?? [];
      list.push(s);
      byPoint.set(key(p), list);
    }
  const used = new Set<Segment>();
  const loops: Point2[][] = [];
  for (const start of segments) {
    if (used.has(start)) continue;
    used.add(start);
    const loop = [start[0], start[1]];
    for (;;) {
      const last = loop[loop.length - 1]!;
      const next = (byPoint.get(key(last)) ?? []).find((s) => !used.has(s));
      if (!next) break;
      used.add(next);
      const other = key(next[0]) === key(last) ? next[1] : next[0];
      if (key(other) === key(loop[0]!)) break;
      loop.push(other);
    }
    const clean = withoutCollinear(loop);
    if (clean.length >= 3) loops.push(clean);
  }
  return loops;
}

/** Drops vertices on a straight run (left by the face triangulation). */
function withoutCollinear(loop: Point2[]): Point2[] {
  return loop.filter((p, i) => {
    const a = loop[(i + loop.length - 1) % loop.length]!,
      b = loop[(i + 1) % loop.length]!;
    const cross = (p.x - a.x) * (b.y - p.y) - (p.y - a.y) * (b.x - p.x);
    return Math.abs(cross) > 1e-12 * (1 + Math.hypot(b.x - a.x, b.y - a.y) ** 2);
  });
}

/**
 * Plan view of a roof in its own storey: the area cut at PLAN_CUT_HEIGHT (drawn like a cut
 * wall), outline parts entirely below the cut (seen from above, thin) and above it (seen from
 * below as underside, dashed). Heights are relative to the storey floor, so the view changes
 * with the roof's own values only, never with storey heights.
 * Not yet: inner edges of non-vertical end cuts, other storeys (guest display, N62).
 */
export function roofPlanView(roof: Roof, cutHeight = PLAN_CUT_HEIGHT) {
  const { outline } = roofFaceRings(roof);
  const { tan, cos } = roofFrame(roof);
  const cut = sectionLoops(roofBody(roof, 0).faces, cutHeight);
  // Run along the rise where the top resp. the underside reaches the cut height.
  const topReaches = (cutHeight - roof.referenceHeight - roof.thickness / cos) / tan;
  const undersideReaches = (cutHeight - roof.referenceHeight) / tan;
  const below: Segment[] = [],
    above: Segment[] = [];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i]!,
      b = outline[(i + 1) % outline.length]!;
    const ta = roofRun(roof, a),
      tb = roofRun(roof, b);
    const splits = [0, 1];
    for (const t of [topReaches, undersideReaches])
      if ((t - ta) * (t - tb) < 0) splits.push((t - ta) / (tb - ta));
    splits.sort((x, y) => x - y);
    for (let k = 0; k + 1 < splits.length; k++) {
      const at = (s: number) => ({ x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s });
      const piece: Segment = [at(splits[k]!), at(splits[k + 1]!)];
      const mid = ta + (tb - ta) * ((splits[k]! + splits[k + 1]!) / 2);
      if (mid <= topReaches) below.push(piece);
      else if (mid >= undersideReaches) above.push(piece);
    }
  }
  return { cut, below, above };
}
