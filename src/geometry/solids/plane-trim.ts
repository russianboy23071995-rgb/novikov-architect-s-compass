import type { Point2 } from "../primitives/point.ts";
import type { ProfileFace, Vertex3 } from "./profile-openings.ts";

/** Plane z = a + b·x + c·y in the solid's own coordinates. */
export type TrimPlane = { a: number; b: number; c: number };

const EPS = 1e-9;

function planeAt(plane: TrimPlane, x: number, y: number) {
  return plane.a + plane.b * x + plane.c * y;
}

/** Part of a convex planar polygon on or below the plane (Sutherland–Hodgman). */
function clipBelow(vertices: readonly Vertex3[], plane: TrimPlane): Vertex3[] {
  const d = vertices.map(([x, y, z]) => planeAt(plane, x, y) - z);
  const out: Vertex3[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const p = vertices[i]!,
      q = vertices[(i + 1) % vertices.length]!;
    const dp = d[i]!,
      dq = d[(i + 1) % vertices.length]!;
    if (dp >= -EPS) out.push(p);
    if ((dp > EPS && dq < -EPS) || (dp < -EPS && dq > EPS)) {
      const t = dp / (dp - dq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]);
    }
  }
  return out;
}

function area2(vertices: readonly Vertex3[]) {
  let x = 0,
    y = 0,
    z = 0;
  for (let i = 0; i < vertices.length; i++) {
    const p = vertices[i]!,
      q = vertices[(i + 1) % vertices.length]!;
    x += p[1] * q[2] - p[2] * q[1];
    y += p[2] * q[0] - p[0] * q[2];
    z += p[0] * q[1] - p[1] * q[0];
  }
  return Math.hypot(x, y, z);
}

/** Volume of a closed, outward-oriented polygon mesh (divergence theorem). */
function volume(faces: readonly ProfileFace[]) {
  let v = 0;
  for (const { vertices } of faces) {
    const o = vertices[0]!;
    for (let i = 1; i + 1 < vertices.length; i++) {
      const p = vertices[i]!,
        q = vertices[i + 1]!;
      v +=
        o[0] * (p[1] * q[2] - p[2] * q[1]) -
        o[1] * (p[0] * q[2] - p[2] * q[0]) +
        o[2] * (p[0] * q[1] - p[1] * q[0]);
    }
  }
  return v / 6;
}

/**
 * Cuts a vertical extrusion of a convex CCW profile (from z = 0 up, faces convex as produced by
 * extrudeProfileWithOpenings) at an inclined plane and keeps the part below it
 * (docs/TRIMMEN_L04B.md, L04b). Every face is clipped; the cut is closed by the profile lifted
 * onto the plane. Preconditions, checked by the caller: the plane stays above z = 0 over the
 * profile and above every opening, and the extrusion reaches the plane everywhere.
 */
export function trimExtrusionBelowPlane(
  solid: { faces: readonly ProfileFace[] },
  profile: readonly Point2[],
  plane: TrimPlane,
): { faces: ProfileFace[]; volume: number } {
  const faces: ProfileFace[] = [];
  for (const face of solid.faces) {
    const clipped = clipBelow(face.vertices, plane);
    if (clipped.length >= 3 && area2(clipped) > EPS)
      faces.push({ vertices: clipped, normal: face.normal });
  }
  const length = Math.hypot(plane.b, plane.c, 1);
  faces.push({
    vertices: profile.map((p) => [p.x, p.y, planeAt(plane, p.x, p.y)] as Vertex3),
    normal: [-plane.b / length, -plane.c / length, 1 / length],
  });
  return { faces, volume: volume(faces) };
}
