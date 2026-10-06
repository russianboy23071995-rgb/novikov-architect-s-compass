import type { Point2 } from "../primitives/point.ts";
import { validateSimplePolygon } from "./simple-polygon.ts";
import { MODEL_TOLERANCE_METRES } from "../tolerances/model.ts";

/** Parallel offset, not scaling. Positive is outward for either winding.
 * Preparation is session-scoped; pointer queries only traverse vertices/edges.
 * Inward motion stops before topology changes, retaining at least 1% per edge.
 */
export function prepareConvexOffset(input: readonly Point2[]) {
  const valid = validateSimplePolygon(input);
  if (!valid.valid) throw new Error("Offset benötigt eine einfache geschlossene Kontur.");
  const points = input.map((p) => ({ ...p }));
  const winding = Math.sign(valid.signedArea);
  const edges = points.map((a, i) => {
    const b = points[(i + 1) % points.length]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    return { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
  });
  const normals = edges.map((e) => ({ x: winding * e.y, y: -winding * e.x }));
  const shifts = normals.map((b, i) => {
    const a = normals[(i + normals.length - 1) % normals.length]!;
    const turn = winding * (a.x * b.y - a.y * b.x);
    const divisor = 1 + a.x * b.x + a.y * b.y;
    if (turn < -1e-12 || divisor <= 1e-12)
      throw new Error("Offset unterstützt zunächst nur konvexe Konturen ohne extrem spitze Ecken.");
    return { x: (a.x + b.x) / divisor, y: (a.y + b.y) / divisor };
  });
  const coordinates = (distance: number) =>
    points.map((p, i) => ({
      x: p.x + distance * shifts[i]!.x,
      y: p.y + distance * shifts[i]!.y,
    }));
  let minimum = -Infinity;
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    const length = Math.hypot(points[next]!.x - points[i]!.x, points[next]!.y - points[i]!.y);
    const rate =
      (shifts[next]!.x - shifts[i]!.x) * edges[i]!.x +
      (shifts[next]!.y - shifts[i]!.y) * edges[i]!.y;
    if (rate > 0) minimum = Math.max(minimum, (-0.99 * length) / rate);
  }
  // Keep the existing numerical validity floor too (tiny/large-coordinate rings).
  // Only preparation searches: pointer queries use one scalar clamp.
  for (let i = 0; i < 64 && !validateSimplePolygon(coordinates(minimum)).valid; i++) minimum /= 2;
  if (!Number.isFinite(minimum) || !validateSimplePolygon(coordinates(minimum)).valid) minimum = 0;
  const clamp = (distance: number) => {
    if (!Number.isFinite(distance)) throw new Error("Endlichen Offset-Abstand eingeben.");
    return Math.max(minimum, distance);
  };
  return {
    clamp,
    normal(index: number) {
      if (!Number.isInteger(index) || !normals[index]) throw new Error("Ungültige Konturkante.");
      return { ...normals[index]! };
    },
    at(distance: number): Point2[] {
      const result = coordinates(clamp(distance));
      for (let i = 0; i < result.length; i++) {
        const a = result[i]!,
          b = result[(i + 1) % result.length]!,
          e = edges[i]!;
        if (
          !Number.isFinite(a.x) ||
          !Number.isFinite(a.y) ||
          (b.x - a.x) * e.x + (b.y - a.y) * e.y <= MODEL_TOLERANCE_METRES
        )
          throw new Error("Offset zu groß nach innen: Eine Konturseite würde zusammenfallen.");
      }
      return result;
    },
  };
}
