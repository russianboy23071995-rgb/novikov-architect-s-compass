import { triangulateSimplePolygon } from "../../../geometry/polygons/triangulate.ts";
import { roofFaceRings, roofFrame, roofTopAt, roofUndersideAt } from "./geometry.ts";
import type { Roof } from "./model.ts";

type Vec3 = [number, number, number];
/** One planar face of the roof body, counterclockwise seen from outside. */
export type RoofBodyFace = { vertices: Vec3[]; normal: Vec3 };

const unit = (v: Vec3): Vec3 => {
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
};

/** Newell normal of a planar polygon; counterclockwise seen from its outside. */
function newell(points: readonly Vec3[]): Vec3 {
  const n: Vec3 = [0, 0, 0];
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!,
      b = points[(i + 1) % points.length]!;
    n[0] += (a[1] - b[1]) * (a[2] + b[2]);
    n[1] += (a[2] - b[2]) * (a[0] + b[0]);
    n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return unit(n);
}

/**
 * Closed body of one inclined roof (docs/ROOF_ELEMENT.md, D2; in the domain since D5 so that 3D and IFC share it). Top and underside lie on their
 * inclined planes over the rings from roofFaceRings; one quad per outline edge joins them
 * (verges vertical, eaves and top edges as chosen). Heights are the storey elevation plus the
 * roof's own values, so the body depends on its storey only (A08).
 * Volume by the divergence theorem over the closed surface.
 */
export function roofBody(roof: Roof, elevation: number): { faces: RoofBodyFace[]; volume: number } {
  const { top, bottom } = roofFaceRings(roof);
  const { rise, sin, cos } = roofFrame(roof);
  const lift = (p: { x: number; y: number }, z: number): Vec3 => [p.x, p.y, elevation + z];
  const topPoints = top.map((p) => lift(p, roofTopAt(roof, p)));
  const bottomPoints = bottom.map((p) => lift(p, roofUndersideAt(roof, p)));
  const up = unit([-rise.x * sin, -rise.y * sin, cos]);
  const faces: RoofBodyFace[] = [];
  for (const [a, b, c] of triangulateSimplePolygon(top))
    faces.push({
      vertices: [topPoints[a]!, topPoints[b]!, topPoints[c]!],
      normal: up,
    });
  for (const [a, b, c] of triangulateSimplePolygon(bottom))
    faces.push({
      vertices: [bottomPoints[a]!, bottomPoints[c]!, bottomPoints[b]!],
      normal: [-up[0], -up[1], -up[2]],
    });
  for (let i = 0; i < top.length; i++) {
    const j = (i + 1) % top.length;
    const vertices: Vec3[] = [bottomPoints[i]!, bottomPoints[j]!, topPoints[j]!, topPoints[i]!];
    faces.push({ vertices, normal: newell(vertices) });
  }
  let volume = 0;
  for (const face of faces)
    for (let k = 1; k + 1 < face.vertices.length; k++) {
      const [p, q, r] = [face.vertices[0]!, face.vertices[k]!, face.vertices[k + 1]!];
      volume +=
        (p[0] * (q[1] * r[2] - q[2] * r[1]) -
          p[1] * (q[0] * r[2] - q[2] * r[0]) +
          p[2] * (q[0] * r[1] - q[1] * r[0])) /
        6;
    }
  return { faces, volume };
}
