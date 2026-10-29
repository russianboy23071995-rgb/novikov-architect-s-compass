import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";
import type { Point2 } from "../../../geometry/primitives/point.ts";

/**
 * Geometry of a single inclined roof surface (docs/ROOF_ELEMENT.md, Teil D1).
 *
 * Reference line P1 → P2 in plan; the roof rises perpendicular to it towards `rise`
 * (left or right of P1 → P2). The roof UNDERSIDE passes through the reference line at
 * referenceHeight above the storey floor (user decision 29.10.2026). Thickness d is measured
 * perpendicular to the roof surface, so the top lies d / cos(pitch) above the underside.
 *
 * End cuts: edges parallel to the reference line are eaves (interior uphill) or top edges
 * (interior downhill); all other edges are verges and always cut vertically. The drawn outline
 * is the outer roof edge seen from above (user decision 29.10.2026); a non-vertical cut moves
 * the inner edge of that end face inwards:
 * - eave, perpendicular: underside inset d·sin(pitch); horizontal: underside inset d/sin(pitch)
 * - top,  perpendicular: top inset d·sin(pitch);       horizontal: top inset d/sin(pitch)
 */
export type RoofCut = "vertical" | "perpendicular" | "horizontal";
export type RoofEdgeRole = "eave" | "top" | "verge";
export type RoofGeometryInput = {
  points: readonly Point2[];
  referenceLine: { start: Point2; end: Point2 };
  rise: "left" | "right";
  referenceHeight: number;
  pitch: number;
  thickness: number;
  eaveCut: RoofCut;
  topCut: RoofCut;
};

/** Angular tolerance (radians) for an edge to count as parallel to the reference line. */
const PARALLEL = 1e-6;
/** Shortest reference line and shortest remaining edge after insetting, in metres. */
const MIN_LENGTH = 1e-6;

/** Unit direction of the reference line and unit rise direction (horizontal). */
export function roofFrame(roof: Pick<RoofGeometryInput, "referenceLine" | "rise" | "pitch">) {
  const { start, end } = roof.referenceLine;
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  if (!(length > MIN_LENGTH)) throw new Error("Die Bezugslinie braucht zwei verschiedene Punkte.");
  const along = { x: (end.x - start.x) / length, y: (end.y - start.y) / length };
  const left = { x: -along.y, y: along.x };
  const rise = roof.rise === "left" ? left : { x: -left.x, y: -left.y };
  const angle = (roof.pitch * Math.PI) / 180;
  return {
    origin: start,
    along,
    rise,
    tan: Math.tan(angle),
    sin: Math.sin(angle),
    cos: Math.cos(angle),
  };
}

/** Signed horizontal distance of a plan point from the reference line, positive uphill. */
export function roofRun(
  roof: Pick<RoofGeometryInput, "referenceLine" | "rise" | "pitch">,
  p: Point2,
) {
  const f = roofFrame(roof);
  return (p.x - f.origin.x) * f.rise.x + (p.y - f.origin.y) * f.rise.y;
}

/** Underside height above the storey floor at a plan point. */
export function roofUndersideAt(roof: RoofGeometryInput, p: Point2): number {
  return roof.referenceHeight + roofFrame(roof).tan * roofRun(roof, p);
}

/** Top height above the storey floor at a plan point (thickness perpendicular to the surface). */
export function roofTopAt(roof: RoofGeometryInput, p: Point2): number {
  return roofUndersideAt(roof, p) + roof.thickness / roofFrame(roof).cos;
}

/** Counterclockwise copy of a simple outline. */
function counterclockwise(points: readonly Point2[]): Point2[] {
  const result = validateSimplePolygon(points);
  if (!result.valid) throw new Error(`Ungültiger Dachumriss: ${result.reason}`);
  return result.signedArea < 0 ? [...points].reverse() : [...points];
}

/** Role of every edge i (ring[i] → ring[i + 1]) of the counterclockwise outline. */
function edgeRoles(ring: readonly Point2[], roof: RoofGeometryInput): RoofEdgeRole[] {
  const f = roofFrame(roof);
  return ring.map((a, i) => {
    const b = ring[(i + 1) % ring.length]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const d = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
    if (Math.abs(d.x * f.along.y - d.y * f.along.x) > PARALLEL) return "verge";
    // Interior lies left of a counterclockwise edge.
    const inward = { x: -d.y, y: d.x };
    return inward.x * f.rise.x + inward.y * f.rise.y > 0 ? "eave" : "top";
  });
}

/** Inset of the top and the underside edge line from the outline for one edge role. */
function insets(role: RoofEdgeRole, roof: RoofGeometryInput): { top: number; bottom: number } {
  const { sin } = roofFrame(roof);
  const cut = role === "eave" ? roof.eaveCut : role === "top" ? roof.topCut : "vertical";
  const depth =
    cut === "perpendicular"
      ? roof.thickness * sin
      : cut === "horizontal"
        ? roof.thickness / sin
        : 0;
  return role === "eave" ? { top: 0, bottom: depth } : { top: depth, bottom: 0 };
}

/** Ring whose edge i is the outline edge i moved inwards by distances[i]. */
function insetRing(ring: readonly Point2[], distances: readonly number[]): Point2[] {
  const n = ring.length;
  const lines = ring.map((a, i) => {
    const b = ring[(i + 1) % n]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const d = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
    const inward = { x: -d.y, y: d.x };
    return {
      p: { x: a.x + inward.x * distances[i]!, y: a.y + inward.y * distances[i]! },
      d,
      inward,
    };
  });
  return ring.map((vertex, i) => {
    const a = lines[(i + n - 1) % n]!,
      b = lines[i]!;
    const cross = a.d.x * b.d.y - a.d.y * b.d.x;
    if (Math.abs(cross) <= PARALLEL) {
      // Collinear neighbours share one line; equal roles give equal insets.
      if (Math.abs(distances[(i + n - 1) % n]! - distances[i]!) > MIN_LENGTH)
        throw new Error(
          "Ungültiger Dachumriss: gerade fortlaufende Kanten mit verschiedenen Abschlüssen.",
        );
      return { x: vertex.x + b.inward.x * distances[i]!, y: vertex.y + b.inward.y * distances[i]! };
    }
    const t = ((b.p.x - a.p.x) * b.d.y - (b.p.y - a.p.y) * b.d.x) / cross;
    return { x: a.p.x + a.d.x * t, y: a.p.y + a.d.y * t };
  });
}

/** Inset ring keeps every edge direction, a positive length and a simple counterclockwise shape. */
function checkInset(ring: readonly Point2[], inset: readonly Point2[]): boolean {
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i]!,
      b = ring[(i + 1) % n]!,
      c = inset[i]!,
      d = inset[(i + 1) % n]!;
    const dot = (b.x - a.x) * (d.x - c.x) + (b.y - a.y) * (d.y - c.y);
    if (!(dot > 0) || !(Math.hypot(d.x - c.x, d.y - c.y) > MIN_LENGTH)) return false;
  }
  const result = validateSimplePolygon(inset);
  return result.valid && result.signedArea > 0;
}

/**
 * Plan rings of the roof's top and underside faces (counterclockwise, same vertex order as the
 * counterclockwise outline) and the role of every edge. Throws a readable German message when
 * the outline, the reference line or the chosen cuts give no valid closed body.
 */
export function roofFaceRings(roof: RoofGeometryInput): {
  outline: Point2[];
  top: Point2[];
  bottom: Point2[];
  roles: RoofEdgeRole[];
} {
  if (!(roof.thickness > 0) || !Number.isFinite(roof.thickness))
    throw new Error("Die Dachstärke muss größer als null sein.");
  roofFrame(roof);
  const outline = counterclockwise(roof.points);
  const roles = edgeRoles(outline, roof);
  const distances = roles.map((role) => insets(role, roof));
  const top = insetRing(
    outline,
    distances.map((d) => d.top),
  );
  const bottom = insetRing(
    outline,
    distances.map((d) => d.bottom),
  );
  if (!checkInset(outline, top) || !checkInset(outline, bottom))
    throw new Error(
      "Das Dach ist für die gewählten Abschlüsse zu schmal. Abschluss „vertikal“ wählen, die Stärke verringern oder den Umriss vergrößern.",
    );
  return { outline, top, bottom, roles };
}
