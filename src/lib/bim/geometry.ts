import {
  createProjectionFrame,
  projectOrthographic,
} from "../../geometry/projections/orthographic.ts";
import type { OrthographicCamera } from "../../geometry/projections/orthographic.ts";
import { validateProject, wallLength } from "./model.ts";
import type { Project } from "./model.ts";

export type Vec3 = [number, number, number];
export type Face = { wallId: string; vertices: [Vec3, Vec3, Vec3, Vec3]; normal: Vec3 };
export type Solid = { faces: Face[]; volume: number; min: Vec3; max: Vec3 };

/** Partition the wall plane at opening edges, then extrude only occupied cells.
 * Emit boundary faces only: openings pass through the entire wall thickness.
 * Overlapping openings are subtracted as a union, not counted twice.
 */
export function buildSolid(input: Project): Solid {
  const project = validateProject(input);
  const solid: Solid = {
    faces: [],
    volume: 0,
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  };
  for (const wall of project.storey.walls) {
    const length = wallLength(wall);
    const ux = (wall.end.x - wall.start.x) / length;
    const uy = (wall.end.y - wall.start.y) / length;
    const openings = project.storey.windows
      .filter((w) => w.wallId === wall.id)
      .map((w) => ({
        left: w.position * length - w.width / 2,
        right: w.position * length + w.width / 2,
        bottom: w.sillHeight,
        top: w.sillHeight + w.height,
      }));
    const sorted = (values: number[]) => [...new Set(values)].sort((a, b) => a - b);
    const xs = sorted([0, length, ...openings.flatMap((w) => [w.left, w.right])]);
    const zs = sorted([0, wall.height, ...openings.flatMap((w) => [w.bottom, w.top])]);
    const occupied = xs.slice(1).map((right, i) =>
      zs.slice(1).map(
        (top, j) =>
          !openings.some((w) => {
            const x = (xs[i]! + right) / 2,
              z = (zs[j]! + top) / 2;
            return x > w.left && x < w.right && z > w.bottom && z < w.top;
          }),
      ),
    );
    const world = ([x, y, z]: Vec3): Vec3 => [
      wall.start.x + ux * x - uy * y,
      wall.start.y + uy * x + ux * y,
      z,
    ];
    const face = (points: [Vec3, Vec3, Vec3, Vec3], normal: Vec3) => {
      const vertices = points.map(world) as Face["vertices"];
      for (const p of vertices)
        for (const axis of [0, 1, 2] as const) {
          solid.min[axis] = Math.min(solid.min[axis], p[axis]);
          solid.max[axis] = Math.max(solid.max[axis], p[axis]);
        }
      solid.faces.push({
        wallId: wall.id,
        vertices,
        normal: [ux * normal[0] - uy * normal[1], uy * normal[0] + ux * normal[1], normal[2]],
      });
    };
    const a = -wall.thickness / 2,
      b = wall.thickness / 2;
    for (let i = 0; i < xs.length - 1; i++)
      for (let j = 0; j < zs.length - 1; j++) {
        if (!occupied[i]?.[j]) continue;
        const l = xs[i]!,
          r = xs[i + 1]!,
          d = zs[j]!,
          u = zs[j + 1]!;
        solid.volume += (r - l) * (u - d) * wall.thickness;
        face(
          [
            [l, a, d],
            [r, a, d],
            [r, a, u],
            [l, a, u],
          ],
          [0, -1, 0],
        );
        face(
          [
            [r, b, d],
            [l, b, d],
            [l, b, u],
            [r, b, u],
          ],
          [0, 1, 0],
        );
        if (!occupied[i - 1]?.[j])
          face(
            [
              [l, b, d],
              [l, a, d],
              [l, a, u],
              [l, b, u],
            ],
            [-1, 0, 0],
          );
        if (!occupied[i + 1]?.[j])
          face(
            [
              [r, a, d],
              [r, b, d],
              [r, b, u],
              [r, a, u],
            ],
            [1, 0, 0],
          );
        if (!occupied[i]?.[j - 1])
          face(
            [
              [l, b, d],
              [r, b, d],
              [r, a, d],
              [l, a, d],
            ],
            [0, 0, -1],
          );
        if (!occupied[i]?.[j + 1])
          face(
            [
              [l, a, u],
              [r, a, u],
              [r, b, u],
              [l, b, u],
            ],
            [0, 0, 1],
          );
      }
  }
  if (!solid.faces.length) {
    solid.min = [0, 0, 0];
    solid.max = [1, 1, 1];
  }
  return solid;
}

export type Camera = OrthographicCamera;
export const initialCamera: Camera = { yaw: -0.45, pitch: 0.3, zoom: 1, panX: 0, panY: 0 };

/** Orthographic camera in a Z-up world; depth is preserved for WebGL occlusion. */
export function projectPoint(point: Vec3, solid: Solid, camera: Camera, aspect: number): Vec3 {
  return projectOrthographic(point, createProjectionFrame(solid), camera, aspect);
}
