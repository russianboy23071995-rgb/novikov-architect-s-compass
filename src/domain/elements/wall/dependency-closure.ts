import type { WallGeometry } from "../../project/geometry-scope.ts";
import { storeyOf } from "../../storeys/access.ts";
/** Conservative complete join/T component; stationary partners remain dependencies. */
export function wallDependencyClosure(
  project: WallGeometry,
  seeds: readonly string[],
): Set<string> {
  const s = storeyOf(project),
    neighbours = new Map<string, Set<string>>();
  for (const [a, b] of [
    ...s.wallJoins.map((j) => [j.first.wallId, j.second.wallId] as const),
    ...s.wallTJunctions.map((j) => [j.hostWallId, j.incoming.wallId] as const),
  ]) {
    for (const [from, to] of [
      [a, b],
      [b, a],
    ] as const) {
      if (!neighbours.has(from)) neighbours.set(from, new Set());
      neighbours.get(from)!.add(to);
    }
  }
  const ids = new Set(seeds);
  for (const id of ids) for (const neighbour of neighbours.get(id) ?? []) ids.add(neighbour);
  return ids;
}
