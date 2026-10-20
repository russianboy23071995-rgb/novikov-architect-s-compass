import { wallDependencyClosure } from "../../domain/elements/wall/dependency-closure.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { GeometryPreview } from "../../domain/project/geometry-scope.ts";

/** Inputs are owned, fully validated snapshots; this only limits derived geometry.
 * Traverse the union graph so detached partners and newly reached groups survive.
 * Never use the reduced scope for confirmation or model validation.
 */
export function wallTransitionPatch(
  before: Project,
  after: Project,
  wallId: string,
): GeometryPreview {
  const old = storeyOf(before),
    next = storeyOf(after);
  const ids = wallDependencyClosure(
    {
      storey: {
        ...next,
        wallJoins: [...old.wallJoins, ...next.wallJoins],
        wallTJunctions: [...old.wallTJunctions, ...next.wallTJunctions],
      },
      assets: [],
    },
    [wallId],
  );
  const level = {
    ...next,
    walls: next.walls.filter((w) => ids.has(w.id)),
    windows: next.windows.filter((w) => ids.has(w.wallId)),
    wallJoins: next.wallJoins.filter((j) => ids.has(j.first.wallId)),
    wallTJunctions: next.wallTJunctions.filter((j) => ids.has(j.hostWallId)),
    lines: [],
    hatches: [],
    references: [],
  };
  for (const value of Object.values(level)) if (Array.isArray(value)) Object.freeze(value);
  Object.freeze(level);
  const geometry = { storey: level, assets: [] };
  Object.freeze(geometry.assets);
  Object.freeze(geometry);
  const replacedIds = Object.freeze([
    ...new Set(
      [old, next].flatMap((s) => [
        ...s.walls.filter((w) => ids.has(w.id)).map((w) => w.id),
        ...s.windows.filter((w) => ids.has(w.wallId)).map((w) => w.id),
      ]),
    ),
  ]);
  return Object.freeze({
    geometry,
    replacedIds,
    storeyPatches: Object.freeze([Object.freeze({ storeyId: next.id, geometry, replacedIds })]),
  });
}
