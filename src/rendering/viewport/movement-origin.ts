import { viewportModel, type PreparedViewportModel } from "./prepared-model.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { Vector3 } from "../../geometry/projections/orthographic.ts";
import { buildBuildingSolid, buildingFacePart } from "./building-solid.ts";
import { selectionEdges } from "./selection-outline.ts";
import { lazyAnchorVisibility } from "./anchor-visibility.ts";
import type { ProjectionState } from "./projection-state.ts";
import { visibleSurfaces } from "./layer-display.ts";

export type MovementCorner = { id: string; point: Vector3 };
const cache = new WeakMap<ReturnType<typeof buildBuildingSolid>, readonly MovementCorner[]>();
// Corners of one reusable storey part: unchanged storeys keep theirs after an edit
// (docs/performance/MOVE_START_ORIGIN.md). Weak: they leave with the part.
const partCorners = new WeakMap<object, readonly MovementCorner[]>();
type Faces = ReturnType<typeof buildBuildingSolid>["faces"];
/** Corners of the given faces, wall by wall in order of first appearance. */
function cornersOf(faces: Faces): MovementCorner[] {
  const grouped = new Map<string, Faces>();
  for (const f of faces) {
    // Wall corners only; slab corners follow with their snap points (B3).
    if (f.slab) continue;
    const list = grouped.get(f.wallId) ?? [];
    list.push(f);
    grouped.set(f.wallId, list);
  }
  const corners: MovementCorner[] = [];
  for (const [id, wallFaces] of grouped) {
    const points = new Map<string, Vector3>();
    for (const edge of selectionEdges(wallFaces))
      for (const point of edge) points.set(`${point[0]},${point[1]},${point[2]}`, point);
    for (const point of points.values()) corners.push(Object.freeze({ id, point }));
  }
  return corners;
}
/** Shared derived boundary corners, including upper edges and every storey. */
export function movementCorners(
  project: Project,
  prepared?: PreparedViewportModel,
): readonly MovementCorner[] {
  const solid = buildBuildingSolid(viewportModel(project, prepared));
  const cached = cache.get(solid);
  if (cached) return cached;
  // Faces of one wall lie in one storey part. Parts are contiguous runs of faces; faces
  // without a reusable part are computed together, as before.
  const runs: { part: object | undefined; faces: Faces }[] = [];
  for (const face of solid.faces) {
    const part = buildingFacePart(face);
    const last = runs[runs.length - 1];
    if (last && last.part === part) last.faces.push(face);
    else runs.push({ part, faces: [face] });
  }
  const parts = new Set(runs.map((r) => r.part));
  const contiguous = parts.size === runs.length && !parts.has(undefined);
  let corners: MovementCorner[];
  if (contiguous) {
    corners = [];
    for (const { part, faces } of runs) {
      let known = partCorners.get(part!);
      if (!known) partCorners.set(part!, (known = Object.freeze(cornersOf(faces))));
      corners.push(...known);
    }
  } else corners = cornersOf(solid.faces);
  Object.freeze(corners);
  cache.set(solid, corners);
  return corners;
}
/** Screen-distance acquisition uses the same displayed solid/depth policy as selection. */
export function createMovementOriginQuery(
  project: Project,
  projection: ProjectionState,
  allows: (id: string) => boolean,
  prepared?: PreparedViewportModel,
) {
  const model = viewportModel(project, prepared);
  const solid = visibleSurfaces(buildBuildingSolid(model), allows);
  // Indexed on the first visibility check, not when the move starts (as in PR474).
  const visibility = lazyAnchorVisibility(solid, projection);
  const projected = movementCorners(model)
    .filter((c) => allows(c.id))
    .map((c) => {
      const p = projection.project(c.point);
      return {
        ...c,
        screen: {
          x: projection.viewport.left + ((p[0] + 1) * projection.viewport.width) / 2,
          y: projection.viewport.top + ((1 - p[1]) * projection.viewport.height) / 2,
        },
      };
    });
  const index = createPointGrid(projected.map((c) => c.screen));
  const finiteBound = (n: number) => Math.max(-Number.MAX_VALUE, Math.min(Number.MAX_VALUE, n));
  return (client: Point, radius = 10, height?: number) => {
    if (![client.x, client.y, radius].every(Number.isFinite) || radius < 0) return null;
    return (
      index
        .query({
          minX: finiteBound(client.x - radius),
          maxX: finiteBound(client.x + radius),
          minY: finiteBound(client.y - radius),
          maxY: finiteBound(client.y + radius),
        })
        // Cell order is not the original stable tie-break order.
        .sort((a, b) => a - b)
        .map((i) => projected[i]!)
        .map((c) => ({ ...c, distance: Math.hypot(c.screen.x - client.x, c.screen.y - client.y) }))
        .filter(
          (c) =>
            c.distance <= radius && (height === undefined || Math.abs(c.point[2] - height) < 1e-8),
        )
        .sort((a, b) => a.distance - b.distance)
        .find((c) => visibility(c.point) === "visible") ?? null
    );
  };
}

/** Uniform screen grid over points: linear build instead of a tree over tens of thousands of
 * corners (docs/performance/MOVE_START_ORIGIN.md). A query returns exactly the indices of the
 * finite points inside the closed box, like the box index it replaces. */
function createPointGrid(points: readonly { x: number; y: number }[]) {
  const CELL = 32;
  const cells = new Map<string, number[]>();
  const finite: number[] = [];
  points.forEach((p, i) => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    finite.push(i);
    const key = `${Math.floor(p.x / CELL)},${Math.floor(p.y / CELL)}`;
    const list = cells.get(key);
    if (list) list.push(i);
    else cells.set(key, [i]);
  });
  const inside = (i: number, box: { minX: number; maxX: number; minY: number; maxY: number }) => {
    const p = points[i]!;
    return p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
  };
  return {
    query(box: { minX: number; maxX: number; minY: number; maxY: number }): number[] {
      const x0 = Math.floor(box.minX / CELL),
        x1 = Math.floor(box.maxX / CELL),
        y0 = Math.floor(box.minY / CELL),
        y1 = Math.floor(box.maxY / CELL);
      // A box over more cells than there are points, or with cell numbers beyond exact integer
      // steps (very large coordinates), is answered by a scan.
      if (
        ![x0, x1, y0, y1].every(Number.isSafeInteger) ||
        (x1 - x0 + 1) * (y1 - y0 + 1) > cells.size
      )
        return finite.filter((i) => inside(i, box));
      const result: number[] = [];
      for (let cx = x0; cx <= x1; cx++)
        for (let cy = y0; cy <= y1; cy++)
          for (const i of cells.get(`${cx},${cy}`) ?? []) if (inside(i, box)) result.push(i);
      return result;
    },
  };
}
