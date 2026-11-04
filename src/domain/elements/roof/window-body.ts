import { roofTopAt, roofUndersideAt, type RoofGeometryInput } from "./geometry.ts";
import { roofWindowRings, type RoofWindow } from "./window.ts";

type Vec3 = [number, number, number];
/** One face of a roof window element; `glass` marks the pane. */
export type RoofWindowBodyFace = { vertices: Vec3[]; normal: Vec3; glass?: true };
/** One closed part: the four frame members or the pane. */
export type RoofWindowPart = { kind: "frame" | "glass"; faces: RoofWindowBodyFace[] };

/** Pane thickness and its depth below the roof top, as shares of the roof thickness. */
const GLASS = { from: 0.45, to: 0.55 } as const;

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const crossV = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
function normalOf(points: readonly Vec3[]): Vec3 {
  const n = crossV(sub(points[1]!, points[0]!), sub(points[2]!, points[0]!));
  const length = Math.hypot(n[0], n[1], n[2]) || 1;
  return [n[0] / length, n[1] / length, n[2] / length];
}

/**
 * Closed box between two quads `upper` and `lower` (same corner order, counterclockwise seen
 * from above): upper face, lower face and four sides.
 */
function quadPrism(upper: readonly Vec3[], lower: readonly Vec3[], glass?: true) {
  const faces: RoofWindowBodyFace[] = [];
  const push = (vertices: Vec3[]) =>
    faces.push({ vertices, normal: normalOf(vertices), ...(glass ? { glass } : {}) });
  push([...upper]);
  push([...lower].reverse());
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    push([lower[i]!, lower[j]!, upper[j]!, upper[i]!]);
  }
  return faces;
}

/**
 * The window element in its opening (docs/DACHFLAECHENFENSTER.md, D1): four frame members of
 * `frame` width through the whole roof thickness and a pane in the middle of it, all
 * perpendicular to the roof surface. Heights relative to the storey floor at `elevation`.
 */
export function roofWindowBody(
  roof: RoofGeometryInput,
  window: Pick<RoofWindow, "along" | "slope" | "width" | "length" | "frame">,
  elevation: number,
): { parts: RoofWindowPart[]; volume: number } {
  const outer = roofWindowRings(roof, window),
    inner = roofWindowRings(roof, window, window.frame);
  // A point at depth t (0 = roof top, 1 = underside) between a top and an underside corner.
  const at = (top: { x: number; y: number }, bottom: { x: number; y: number }, t: number): Vec3 => {
    const a: Vec3 = [top.x, top.y, elevation + roofTopAt(roof, top)];
    const b: Vec3 = [bottom.x, bottom.y, elevation + roofUndersideAt(roof, bottom)];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  };
  const ring = (
    r: { top: { x: number; y: number }[]; bottom: { x: number; y: number }[] },
    t: number,
  ) => r.top.map((p, i) => at(p, r.bottom[i]!, t));
  const o0 = ring(outer, 0),
    o1 = ring(outer, 1),
    i0 = ring(inner, 0),
    i1 = ring(inner, 1);
  const frame: RoofWindowBodyFace[] = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    // Member along side i: outer edge i→j and inner edge i→j, counterclockwise from above.
    frame.push(...quadPrism([o0[i]!, o0[j]!, i0[j]!, i0[i]!], [o1[i]!, o1[j]!, i1[j]!, i1[i]!]));
  }
  const glass = quadPrism(ring(inner, GLASS.from), ring(inner, GLASS.to), true);
  // Volume: frame ring and pane as plan area times depth along the normal (exact for prisms).
  const area = (w: number, l: number) => w * l;
  const thickness = roof.thickness;
  const volume =
    (area(window.width, window.length) -
      area(window.width - 2 * window.frame, window.length - 2 * window.frame)) *
      thickness +
    area(window.width - 2 * window.frame, window.length - 2 * window.frame) *
      thickness *
      (GLASS.to - GLASS.from);
  return {
    parts: [
      { kind: "frame", faces: frame },
      { kind: "glass", faces: glass },
    ],
    volume,
  };
}
