/** Isolated pilot: reuse existing translation after preparing a detached chain end. */
import { validateProject, type Project, type Point } from "../src/lib/bim/model.ts";
import { prepareTranslation } from "../src/domain/project/prepared-translation.ts";
function freeze<T>(v: T): T {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    for (const x of Object.values(v)) freeze(x);
    Object.freeze(v);
  }
  return v;
}
export function prepareChainMove(source: Project, id: string) {
  const base = freeze(validateProject(source)),
    full = prepareTranslation(base, [id]),
    s = base.storey;
  const degree = new Map<string, number>();
  for (const j of s.wallJoins)
    for (const w of [j.first.wallId, j.second.wallId]) degree.set(w, (degree.get(w) ?? 0) + 1);
  const supported =
    s.walls.some((w) => w.id === id) &&
    !s.wallTJunctions.length &&
    degree.get(id) === 1 &&
    [...degree.values()].every((n) => n <= 2);
  const detached = supported
    ? freeze(
        validateProject({
          ...base,
          storey: {
            ...s,
            wallJoins: s.wallJoins.filter((j) => j.first.wallId !== id && j.second.wallId !== id),
          },
        }),
      )
    : null;
  const local = detached ? prepareTranslation(detached, [id]) : null;
  return {
    affectedWalls: local?.evaluate({ x: 0, y: 0 }).geometry.storey.walls.length ?? s.walls.length,
    evaluate(delta: Point) {
      if (!local || !detached || (delta.x === 0 && delta.y === 0))
        return { path: "full" as const, project: full.materialize(base, delta) };
      const patch = local.evaluate(delta),
        byId = new Map(patch.geometry.storey.walls.map((w) => [w.id, w]));
      return {
        path: "local" as const,
        project: freeze({
          ...detached,
          storey: {
            ...detached.storey,
            walls: detached.storey.walls.map((w) => byId.get(w.id) ?? w),
          },
        }),
      };
    },
    confirm(delta: Point) {
      return full.materialize(base, delta);
    },
  };
}
