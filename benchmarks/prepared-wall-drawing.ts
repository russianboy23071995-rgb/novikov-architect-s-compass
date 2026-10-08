/** Isolated first-segment experiment. Not imported by production code. */
import { validateProject, type Project, type Point } from "../src/lib/bim/model.ts";
import { beginWallChain, appendWallChain } from "../src/application/drawing/wall-chain.ts";
import type { SnapCandidate } from "../src/constraints/snapping/engine.ts";
import { pointsCompatible } from "../src/geometry/tolerances/model.ts";
function freeze<T>(v: T): T {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    for (const x of Object.values(v)) freeze(x);
    Object.freeze(v);
  }
  return v;
}
export function prepareWallDrawing(source: Project, origin: Point, id: string) {
  const base = freeze(validateProject(source));
  const chain = freeze(beginWallChain(base, origin));
  const s = base.storey;
  const ids = new Set(
    [
      base,
      s,
      ...base.layers,
      ...base.assets,
      ...s.walls,
      ...s.windows,
      ...(s.lines ?? []),
      ...s.hatches,
      ...s.references,
    ].map((e) => e.id),
  );
  const endpoints = s.walls.flatMap((w) => [w.start, w.end]);
  const empty = freeze({
    ...base,
    assets: [],
    storey: {
      ...s,
      walls: [],
      windows: [],
      lines: [],
      hatches: [],
      references: [],
      wallJoins: [],
      wallTJunctions: [],
    },
  });
  const local = freeze(beginWallChain(empty, chain.points[0]!));
  const full = (point: Point, candidate?: SnapCandidate | null) =>
    appendWallChain(chain, base, id, point, candidate).preview;
  return {
    evaluate(
      point: Point,
      candidate?: SnapCandidate | null,
    ): { project: Project; path: "local" | "full" } {
      if (
        candidate ||
        ids.has(id.trim()) ||
        endpoints.some((p) => pointsCompatible(p, chain.points[0]!) || pointsCompatible(p, point))
      )
        return { project: full(point, candidate), path: "full" };
      const added = appendWallChain(local, empty, id, point).preview.storey.walls;
      return {
        path: "local",
        project: freeze({ ...base, storey: { ...s, walls: [...s.walls, ...added] } }),
      };
    },
    confirm: full,
  };
}
