import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import {
  createWallSolidReuse,
  connectedWallSolids,
} from "../../domain/elements/wall/connections.ts";
import { wallDependencyClosure } from "../../domain/elements/wall/dependency-closure.ts";
import type { GeometryPreview } from "../../domain/project/geometry-scope.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import { editAtPointer, type EditSession } from "../../lib/bim/direct-edit.ts";
import { createCompatiblePointIndex } from "../../geometry/spatial/compatible-point-index.ts";

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
/** Retain original relation order in the legacy materialized project view. */
function replaceRelations<T>(all: T[], before: T[], after: T[]): T[] {
  const oldKeys = new Set(before.map((r) => JSON.stringify(r)));
  const newKeys = new Set(after.map((r) => JSON.stringify(r)));
  const allKeys = new Set(all.map((r) => JSON.stringify(r)));
  return [
    ...all.filter((r) => !oldKeys.has(JSON.stringify(r)) || newKeys.has(JSON.stringify(r))),
    ...after.filter((r) => !allKeys.has(JSON.stringify(r))),
  ];
}

/** Complete original join/T component, including partners whose joins may detach. */
export function prepareEndpoint(
  source: Project,
  id: string,
  index: 0 | 1 = 1,
  gesture?: { anchor: Point; action?: "point" | "stretch" },
) {
  const base = createProjectSnapshot(source),
    s = storeyOf(base);
  const wall = s.walls.find((w) => w.id === id);
  if (!wall) throw Error("Unknown wall");
  const ids = wallDependencyClosure(base, [id]);
  const solidReuse = createWallSolidReuse([...ids]);
  const scoped = freeze({
    ...base,
    assets: [],
    storeys: base.storeys.map((level) => ({
      ...level,
      walls: level.id === s.id ? level.walls.filter((w) => ids.has(w.id)) : [],
      windows: level.id === s.id ? level.windows.filter((w) => ids.has(w.wallId)) : [],
      ...(level.doors
        ? { doors: level.id === s.id ? level.doors.filter((d) => ids.has(d.wallId)) : [] }
        : {}),
      wallJoins: level.id === s.id ? level.wallJoins.filter((j) => ids.has(j.first.wallId)) : [],
      wallTJunctions:
        level.id === s.id ? level.wallTJunctions.filter((j) => ids.has(j.hostWallId)) : [],
      lines: [],
      hatches: [],
      references: [],
    })),
  });
  const localIds = Object.freeze(
    [...storeyOf(scoped).walls, ...storeyOf(scoped).windows, ...(storeyOf(scoped).doors ?? [])].map(
      (e) => e.id,
    ),
  );
  const fullIds = Object.freeze([...s.walls, ...s.windows, ...(s.doors ?? [])].map((e) => e.id));
  const foreign = createCompatiblePointIndex(
    s.walls.filter((w) => !ids.has(w.id)).flatMap((w) => [w.start, w.end]),
  );
  const session: EditSession = Object.freeze({
    base,
    target: { kind: "wall" as const, id },
    action: gesture ? (gesture.action ?? "stretch") : "point",
    index,
    anchor: gesture ? Object.freeze({ ...gesture.anchor }) : index === 0 ? wall.start : wall.end,
  });
  const localSession: EditSession = Object.freeze({ ...session, base: scoped });
  const full = (point: Point) => ({
    project: editAtPointer(session, base, point),
    path: "full" as const,
  });
  const calculate = (point: Point): { project: Project; path: "local" | "full" } => {
    let next: Project;
    try {
      next = editAtPointer(localSession, scoped, point, solidReuse);
    } catch {
      return full(point);
    }
    const moved = storeyOf(next).walls.find((w) => w.id === id)!;
    // New contacts may affect another component or an occupied node. Never hide that context.
    if (foreign.has(moved.start) || foreign.has(moved.end)) return full(point);
    return { project: next, path: "local" };
  };
  return {
    affectedWalls: ids.size,
    evaluateGeometry(point: Point): { patch: GeometryPreview; path: "local" | "full" } {
      const result = calculate(point);
      const geometry = freeze({ storey: storeyOf(result.project), assets: [] });
      // Publish the same derived solids under the exact display scope identity.
      // Full fallback/confirmation remain independent of this session cache.
      if (result.path === "local") connectedWallSolids(geometry, solidReuse);
      const replacedIds = result.path === "local" ? localIds : fullIds;
      return {
        path: result.path,
        patch: {
          geometry,
          replacedIds,
          storeyPatches: [{ storeyId: s.id, geometry, replacedIds }],
        },
      };
    },
    evaluate(point: Point): { project: Project; path: "local" | "full" } {
      const result = calculate(point);
      if (result.path === "full") return result;
      const next = storeyOf(result.project),
        local = storeyOf(scoped);
      const byId = new Map(next.walls.map((w) => [w.id, w]));
      return {
        path: "local",
        project: freeze(
          replaceStorey(base, {
            ...s,
            walls: s.walls.map((w) => byId.get(w.id) ?? w),
            wallJoins: replaceRelations(s.wallJoins, local.wallJoins, next.wallJoins),
            wallTJunctions: replaceRelations(
              s.wallTJunctions,
              local.wallTJunctions,
              next.wallTJunctions,
            ),
          }),
        ),
      };
    },
    // Confirmation explicitly uses the complete authoritative operation.
    confirm(point: Point) {
      return full(point).project;
    },
  };
}
