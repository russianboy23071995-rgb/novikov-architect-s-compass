import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { wallDependencyClosure } from "../../domain/elements/wall/dependency-closure.ts";
import type { GeometryPreview } from "../../domain/project/geometry-scope.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
/** Owned calculation scope for the bounded axial T-host endpoint preview. */
import { updateWall, type Project, type Point } from "../../lib/bim/model.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
function freeze<T>(v: T): T {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    for (const c of Object.values(v)) freeze(c);
    Object.freeze(v);
  }
  return v;
}
export function prepareEndpoint(source: Project, id: string) {
  const base = createProjectSnapshot(source),
    s = storeyOf(base),
    wall = s.walls.find((w) => w.id === id);
  if (!wall) throw Error("Unknown wall");
  const ids = wallDependencyClosure(base, [id]);
  const supported =
    s.wallTJunctions.some((t) => t.hostWallId === id) &&
    !s.wallJoins.some((j) => ids.has(j.first.wallId) || ids.has(j.second.wallId));
  const local = freeze({
    ...replaceStorey(base, {
      ...s,
      walls: s.walls.filter((w) => ids.has(w.id)),
      windows: s.windows.filter((w) => ids.has(w.wallId)),
      wallJoins: s.wallJoins.filter((j) => ids.has(j.first.wallId)),
      wallTJunctions: s.wallTJunctions.filter((j) => ids.has(j.hostWallId)),
      lines: [],
      hatches: [],
      references: [],
    }),
    assets: [],
  });
  const scoped = {
    ...local,
    storeys: local.storeys.map((level) =>
      level.id === s.id
        ? level
        : {
            ...level,
            walls: [],
            windows: [],
            wallJoins: [],
            wallTJunctions: [],
            lines: [],
            hatches: [],
            references: [],
          },
    ),
  };
  const patch = (project: Project, path: "local" | "full"): GeometryPreview => {
    const level = storeyOf(project);
    const replacedIds =
      path === "local"
        ? [...storeyOf(local).walls, ...storeyOf(local).windows].map((e) => e.id)
        : [...s.walls, ...s.windows].map((e) => e.id);
    const geometry = { storey: level, assets: [] };
    return { geometry, replacedIds, storeyPatches: [{ storeyId: s.id, geometry, replacedIds }] };
  };
  const foreign = s.walls.filter((w) => !ids.has(w.id)).flatMap((w) => [w.start, w.end]);
  const dx = wall.end.x - wall.start.x,
    dy = wall.end.y - wall.start.y;
  const calculate = (point: Point): { project: Project; path: "local" | "full" } => {
    const x = point.x - wall.start.x,
      y = point.y - wall.start.y;
    const axial =
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      x * dy - y * dx === 0 &&
      x * dx + y * dy >= dx * dx + dy * dy;
    // Foreign endpoints can create a corner or invalidate an unrelated occupied node.
    if (
      !supported ||
      !axial ||
      foreign.some((p) => pointsCompatible(p, point) || pointsCompatible(p, wall.start))
    )
      return { project: updateWall(base, id, { end: point }), path: "full" };
    const next = updateWall(scoped, id, { end: point });
    if (
      JSON.stringify(storeyOf(next).wallTJunctions) !==
        JSON.stringify(storeyOf(local).wallTJunctions) ||
      JSON.stringify(storeyOf(next).wallJoins) !== JSON.stringify(storeyOf(local).wallJoins)
    )
      return { project: updateWall(base, id, { end: point }), path: "full" };
    return { project: next, path: "local" };
  };
  return {
    affectedWalls: ids.size,
    evaluateGeometry(point: Point) {
      const result = calculate(point);
      return { patch: patch(result.project, result.path), path: result.path };
    },
    evaluate(point: Point): { project: Project; path: "local" | "full" } {
      const result = calculate(point);
      if (result.path === "full") return result;
      const byId = new Map(storeyOf(result.project).walls.map((w) => [w.id, w]));
      return {
        path: "local",
        project: freeze(
          replaceStorey(base, {
            ...s,
            walls: s.walls.map((w) => byId.get(w.id) ?? w),
          }),
        ),
      };
    },
    // Confirmation explicitly uses the authoritative full operation.
    confirm(point: Point) {
      return updateWall(base, id, { end: point });
    },
  };
}
