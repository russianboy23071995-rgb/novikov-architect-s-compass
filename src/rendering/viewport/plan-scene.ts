import type { ModelGeometry } from "../../domain/project/geometry-scope.ts";
import { connectedWallSolids } from "../../domain/elements/wall/connections.ts";
import { visiblePlanGeometry } from "./layer-display.ts";
import { wallPlanOutlines } from "./wall-plan-outline.ts";

export function derivePlanScene(geometry: ModelGeometry, allows: (id: string) => boolean) {
  const plan = visiblePlanGeometry(geometry, allows);
  const openings = new Map<string, typeof plan.openings>();
  for (const opening of plan.openings) {
    if (!openings.has(opening.wallId)) openings.set(opening.wallId, []);
    openings.get(opening.wallId)!.push(opening);
  }
  return {
    plan,
    openings,
    assets: new Map(geometry.assets.map((a) => [a.id, a])),
    solids: new Map(connectedWallSolids(geometry).map((s) => [s.wallId, s])),
    outlines: wallPlanOutlines(geometry, new Set(plan.walls.map((w) => w.id))),
    walls: new Map(plan.walls.map((w) => [w.id, w])),
    hatches: new Map(plan.hatches.map((h) => [h.id, h])),
    lines: new Map(plan.lines.map((l) => [l.id, l])),
    references: new Map(plan.references.map((r) => [r.id, r])),
  };
}
export type PlanScene = ReturnType<typeof derivePlanScene>;
export type PlanRun = {
  kind: "reference" | "hatch" | "wall" | "line";
  ids: string[];
  affected: boolean;
};
/** Partition once per base/selection. Preserve exact drawing order, including overlapping images. */
export function planSceneRuns(scene: PlanScene, replacedIds: readonly string[]): PlanRun[] {
  const replaced = new Set(replacedIds),
    runs: PlanRun[] = [];
  for (const [kind, elements] of [
    ["reference", scene.plan.references],
    ["hatch", scene.plan.hatches],
    ["wall", scene.plan.walls],
    ["line", scene.plan.lines],
  ] as const) {
    let run: PlanRun | undefined;
    for (const element of elements) {
      const affected = replaced.has(element.id);
      if (!run || run.affected !== affected) {
        run = { kind, ids: [], affected };
        runs.push(run);
      }
      run.ids.push(element.id);
    }
  }
  return runs;
}
