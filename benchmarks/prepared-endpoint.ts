/** Isolated pilot, not connected to product interactions. */
import { validateProject, updateWall, type Project, type Point } from "../src/lib/bim/model.ts";
import { pointsCompatible } from "../src/geometry/tolerances/model.ts";
function freeze<T>(v: T): T {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    for (const c of Object.values(v)) freeze(c);
    Object.freeze(v);
  }
  return v;
}
export function prepareEndpoint(source: Project, id: string) {
  const base = freeze(validateProject(source)),
    s = base.storey,
    wall = s.walls.find((w) => w.id === id);
  if (!wall) throw Error("Unknown wall");
  const ids = new Set([id]);
  let changed = true;
  const pairs = [
    ...s.wallJoins.map((j) => [j.first.wallId, j.second.wallId]),
    ...s.wallTJunctions.map((j) => [j.hostWallId, j.incoming.wallId]),
  ];
  while (changed) {
    changed = false;
    for (const [a, b] of pairs)
      if (ids.has(a!) || ids.has(b!)) {
        for (const x of [a!, b!])
          if (!ids.has(x)) {
            ids.add(x);
            changed = true;
          }
      }
  }
  const supported =
    s.wallTJunctions.some((t) => t.hostWallId === id) &&
    !s.wallJoins.some((j) => ids.has(j.first.wallId) || ids.has(j.second.wallId));
  const local = freeze({
    ...base,
    assets: [],
    storey: {
      ...s,
      walls: s.walls.filter((w) => ids.has(w.id)),
      windows: s.windows.filter((w) => ids.has(w.wallId)),
      wallJoins: s.wallJoins.filter((j) => ids.has(j.first.wallId)),
      wallTJunctions: s.wallTJunctions.filter((j) => ids.has(j.hostWallId)),
      lines: [],
      hatches: [],
      references: [],
    },
  });
  const foreign = s.walls.filter((w) => !ids.has(w.id)).flatMap((w) => [w.start, w.end]);
  const dx = wall.end.x - wall.start.x,
    dy = wall.end.y - wall.start.y;
  return {
    affectedWalls: ids.size,
    evaluate(point: Point): { project: Project; path: "local" | "full" } {
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
      const next = updateWall(local, id, { end: point });
      if (
        JSON.stringify(next.storey.wallTJunctions) !==
          JSON.stringify(local.storey.wallTJunctions) ||
        JSON.stringify(next.storey.wallJoins) !== JSON.stringify(local.storey.wallJoins)
      )
        return { project: updateWall(base, id, { end: point }), path: "full" };
      const byId = new Map(next.storey.walls.map((w) => [w.id, w]));
      return {
        path: "local",
        project: freeze({
          ...base,
          storey: {
            ...s,
            walls: s.walls.map((w) => byId.get(w.id) ?? w),
            wallJoins: s.wallJoins,
            wallTJunctions: s.wallTJunctions,
          },
        }),
      };
    },
    // Confirmation explicitly uses the authoritative full operation.
    confirm(point: Point) {
      return updateWall(base, id, { end: point });
    },
  };
}
