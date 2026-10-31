// Moved from lib/bim/geometry.ts without behaviour change (27.10.2026, Stage B0 of
// docs/plans/WALLWISE_REBUILD_CHANGE_MAP.md); camera helpers stay there.
import { isOwnedProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { sameProjectModel } from "../../domain/project/model-equality.ts";
import { wallBase } from "../../domain/elements/wall/heights.ts";
import type { ModelGeometry } from "../../domain/project/geometry-scope.ts";
import { workingStoreyElevation } from "../../domain/storeys/elevation.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { connectedWallSolids } from "../../domain/elements/wall/connections.ts";
import { wallContourSolid } from "../../domain/elements/wall/contour-solid.ts";
import { storeyOpenings, type WallOpening } from "../../domain/elements/wall/openings.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { validateProject, wallLength } from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
import { slabBody } from "./slab-solid.ts";
import { roofBody } from "./roof-solid.ts";
import { columnBody } from "./column-solid.ts";

export type Vec3 = [number, number, number];
/** wallId names the element; slab faces carry `slab` (docs/SLAB_ELEMENT.md, Teil B),
 * roof faces `roof` (docs/ROOF_ELEMENT.md, D2). */
export type Face = {
  wallId: string;
  vertices: Vec3[];
  normal: Vec3;
  slab?: true;
  roof?: true;
  /** Column face (docs/STUETZEN.md). */
  column?: true;
};
export type Solid = { faces: Face[]; volume: number; min: Vec3; max: Vec3 };

/** Partition the wall plane at opening edges, then extrude only occupied cells.
 * Emit boundary faces only: openings pass through the entire wall thickness.
 * Overlapping openings are subtracted as a union, not counted twice.
 */
export function buildSolid(input: Project): Solid {
  const project = validateProject(input);
  return buildPreviewSolid(project, workingStoreyElevation(project));
}

/** Derived geometry from a validated project or a validated prepared preview scope. */
export function buildPreviewSolid(project: ModelGeometry, elevation: number): Solid {
  const solid: Solid = {
    faces: [],
    volume: 0,
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  };
  const joined = new Map(connectedWallSolids(project).map((w) => [w.wallId, w]));
  // Derivation-local index: preserve window order and objects, never retain a
  // stale host assignment across model/preview changes.
  const windowsByHost = new Map<string, WallOpening[]>();
  for (const window of storeyOpenings(storeyOf(project))) {
    const group = windowsByHost.get(window.wallId);
    if (group) group.push(window);
    else windowsByHost.set(window.wallId, [window]);
  }
  for (const wall of storeyOf(project).walls) {
    // A free wall trimmed at a roof (L04b) uses the contour body with its plane cut.
    const connection =
      joined.get(wall.id) ??
      (wall.trimPlane
        ? wallContourSolid(wall, wallBody(wall).corners, storeyOpenings(storeyOf(project)))
        : undefined);
    if (connection) {
      solid.faces.push(...connection.faces);
      solid.volume += connection.volume;
      for (const face of connection.faces)
        for (const p of face.vertices)
          for (const axis of [0, 1, 2] as const) {
            solid.min[axis] = Math.min(solid.min[axis], p[axis]);
            solid.max[axis] = Math.max(solid.max[axis], p[axis]);
          }
      continue;
    }
    const length = wallLength(wall);
    const body = wallBody(wall);
    const ux = (wall.end.x - wall.start.x) / length;
    const uy = (wall.end.y - wall.start.y) / length;
    const openings = (windowsByHost.get(wall.id) ?? []).map((w) => ({
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
      body.start.x + ux * x - uy * y,
      body.start.y + uy * x + ux * y,
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
  const bases = new Map(storeyOf(project).walls.map((w) => [w.id, wallBase(w, elevation)]));
  if (solid.faces.length && [...bases.values()].some((z) => z !== 0)) {
    solid.faces = solid.faces.map((f) => ({
      ...f,
      vertices: f.vertices.map(([x, y, z]): Vec3 => [x, y, z + bases.get(f.wallId)!]),
    }));
    solid.min[2] = Infinity;
    solid.max[2] = -Infinity;
    for (const face of solid.faces)
      for (const p of face.vertices) {
        solid.min[2] = Math.min(solid.min[2], p[2]);
        solid.max[2] = Math.max(solid.max[2], p[2]);
      }
  }
  // Ceiling slabs of this storey: top on the next raw floor (elevation + storey height).
  // Both come from this storey and its elevation, which every storey cache already keys on.
  const storey = storeyOf(project);
  // Disposable scopes may omit the height; their slabs then stay out, like an unknown height.
  const height = "height" in storey && typeof storey.height === "number" ? storey.height : null;
  const bodies: { faces: Face[]; volume: number }[] = (storey.slabs ?? []).flatMap((slab) => {
    const body = slabBody(slab, height === null ? null : elevation + height);
    return body ? [body] : [];
  });
  // Roofs of this storey: relative to the storey floor only (docs/ROOF_ELEMENT.md, D2).
  for (const roof of "roofs" in storey ? (storey.roofs ?? []) : [])
    bodies.push(roofBody(roof, elevation));
  // Columns of this storey from foot to top (docs/STUETZEN.md); a bound top needs the height.
  for (const column of "columns" in storey ? (storey.columns ?? []) : []) {
    const body = columnBody(column, elevation, height);
    if (body) bodies.push(body);
  }
  if (bodies.length) {
    if (!solid.faces.length) {
      solid.min = [Infinity, Infinity, Infinity];
      solid.max = [-Infinity, -Infinity, -Infinity];
    }
    for (const body of bodies) {
      solid.volume += body.volume;
      for (const face of body.faces) {
        solid.faces.push(face);
        for (const p of face.vertices)
          for (const axis of [0, 1, 2] as const) {
            solid.min[axis] = Math.min(solid.min[axis], p[axis]);
            solid.max[axis] = Math.max(solid.max[axis], p[axis]);
          }
      }
    }
  }
  return solid;
}
