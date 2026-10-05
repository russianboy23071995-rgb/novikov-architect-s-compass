import type { Point2 } from "../primitives/point.ts";
import { validateSimplePolygon } from "../polygons/simple-polygon.ts";
import { coordinatesCompatible, pointsCompatible } from "../tolerances/model.ts";
import { measureHalfPlane } from "../projections/half-plane.ts";

export type Vertex3 = [number, number, number];
export type ProfileFace = { vertices: Vertex3[]; normal: Vertex3 };
export type ThroughOpening = { left: number; right: number; bottom: number; top: number };

/** Convex CCW XY profile extruded along Z, minus rectangular X/Z openings
 * through the whole Y thickness. A geometric kernel, not a BIM/clearance policy.
 * Cell interfaces are omitted; coplanar boundary faces may remain subdivided.
 */
export function extrudeProfileWithOpenings(
  profile: readonly Point2[],
  height: number,
  openings: readonly ThroughOpening[],
) {
  const valid = validateSimplePolygon(profile);
  if (!valid.valid || valid.signedArea <= 0 || !Number.isFinite(height) || height <= 0)
    throw new Error("Ungültiges Extrusionsprofil.");
  for (let i = 0; i < profile.length; i++)
    if (
      measureHalfPlane(profile, profile[i]!, profile[(i + 1) % profile.length]!).relation ===
      "outside"
    )
      throw new Error("Extrusionsprofil muss konvex sein.");
  const ymin = Math.min(...profile.map((p) => p.y)),
    ymax = Math.max(...profile.map((p) => p.y));
  for (const o of openings) {
    if (
      !Object.values(o).every(Number.isFinite) ||
      o.left >= o.right ||
      o.bottom < 0 ||
      o.bottom >= o.top ||
      o.top > height
    )
      throw new Error("Ungültige Durchgangsöffnung.");
    const footprint = [
      { x: o.left, y: ymin },
      { x: o.right, y: ymin },
      { x: o.right, y: ymax },
      { x: o.left, y: ymax },
    ];
    for (let i = 0; i < profile.length; i++)
      if (
        measureHalfPlane(footprint, profile[i]!, profile[(i + 1) % profile.length]!).relation ===
        "outside"
      )
        throw new Error("Durchgangsöffnung liegt außerhalb des Profils.");
  }
  const cuts = (values: number[]) => {
    const result: number[] = [];
    for (const v of values.sort((a, b) => a - b)) {
      const last = result.at(-1);
      if (last === undefined || !coordinatesCompatible(last, v)) result.push(v);
      else if (last !== v) throw new Error("Geometriegrenzen numerisch nicht trennbar.");
    }
    return result;
  };
  const xs = cuts([...profile.map((p) => p.x), ...openings.flatMap((o) => [o.left, o.right])]);
  const zs = cuts([0, height, ...openings.flatMap((o) => [o.bottom, o.top])]);
  // Intersections always use the ORIGINAL edge: neighbouring slabs therefore
  // share bit-identical vertices instead of accumulating clipping roundoff.
  const slice = (left: number, right: number) => {
    const candidates: Point2[] = profile
      .filter((p) => p.x >= left && p.x <= right)
      .map((p) => ({ ...p }));
    for (let i = 0; i < profile.length; i++) {
      const a = profile[i]!,
        b = profile[(i + 1) % profile.length]!;
      for (const x of [left, right])
        if (x > Math.min(a.x, b.x) && x < Math.max(a.x, b.x))
          candidates.push({ x, y: a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x) });
    }
    const points = candidates.filter(
      (p, i) => !candidates.slice(0, i).some((q) => pointsCompatible(p, q)),
    );
    const center = {
      x: points.reduce((v, p) => v + p.x, 0) / points.length,
      y: points.reduce((v, p) => v + p.y, 0) / points.length,
    };
    return points.sort(
      (a, b) =>
        Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x),
    );
  };
  const cells = xs.slice(1).map((right, i) => slice(xs[i]!, right));
  const areas = cells.map((p) => {
    const v = validateSimplePolygon(p);
    if (!v.valid || v.signedArea <= 0) throw new Error("Ungültige Extrusionszelle.");
    return v.signedArea;
  });
  const occupied = cells.map((_, i) =>
    zs.slice(1).map((top, j) => {
      const x = (xs[i]! + xs[i + 1]!) / 2,
        z = (zs[j]! + top) / 2;
      return !openings.some((o) => x > o.left && x < o.right && z > o.bottom && z < o.top);
    }),
  );
  const faces: ProfileFace[] = [];
  let volume = 0;
  for (let i = 0; i < cells.length; i++)
    for (let j = 0; j < zs.length - 1; j++) {
      if (!occupied[i]![j]) continue;
      const p = cells[i]!,
        bottom = zs[j]!,
        top = zs[j + 1]!;
      volume += areas[i]! * (top - bottom);
      if (!occupied[i]![j - 1])
        faces.push({
          vertices: [...p].reverse().map((q) => [q.x, q.y, bottom]),
          normal: [0, 0, -1],
        });
      if (!occupied[i]![j + 1])
        faces.push({ vertices: p.map((q) => [q.x, q.y, top]), normal: [0, 0, 1] });
      for (let k = 0; k < p.length; k++) {
        const a = p[k]!,
          b = p[(k + 1) % p.length]!;
        if (a.x === xs[i] && b.x === xs[i] && occupied[i - 1]?.[j]) continue;
        if (a.x === xs[i + 1] && b.x === xs[i + 1] && occupied[i + 1]?.[j]) continue;
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        faces.push({
          vertices: [
            [a.x, a.y, bottom],
            [b.x, b.y, bottom],
            [b.x, b.y, top],
            [a.x, a.y, top],
          ],
          normal: [(b.y - a.y) / length, -(b.x - a.x) / length, 0],
        });
      }
    }
  if (
    !Number.isFinite(volume) ||
    volume < 0 ||
    !faces.every((f) => [...f.vertices.flat(), ...f.normal].every(Number.isFinite))
  )
    throw new Error("Extrusion numerisch nicht darstellbar.");
  // Reject edge-only/point-only opening contacts that produce a non-manifold shell.
  // This is a representability limit, not a new project-wide opening policy.
  const edges = new Map<string, { count: number; balance: number }>();
  for (const face of faces)
    for (let i = 0; i < face.vertices.length; i++) {
      const a = JSON.stringify(face.vertices[i]),
        b = JSON.stringify(face.vertices[(i + 1) % face.vertices.length]);
      const key = a < b ? a + "|" + b : b + "|" + a;
      const previous = edges.get(key) ?? { count: 0, balance: 0 };
      edges.set(key, { count: previous.count + 1, balance: previous.balance + (a < b ? 1 : -1) });
    }
  if ([...edges.values()].some((e) => e.count !== 2 || e.balance !== 0))
    throw new Error("Öffnungskontakt erzeugt keine geschlossene reguläre Hülle.");
  return { faces, volume };
}
