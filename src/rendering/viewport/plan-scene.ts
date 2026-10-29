import { roofPlanView } from "./roof-plan.ts";
import type { HatchPatternDefinition } from "../../domain/elements/hatch/pattern.ts";
import type { ModelGeometry } from "../../domain/project/geometry-scope.ts";
import { connectedWallSolids } from "../../domain/elements/wall/connections.ts";
import { visiblePlanGeometry } from "./layer-display.ts";
import { wallPlanOutlines } from "./wall-plan-outline.ts";
import { openingOverlaps } from "../../domain/elements/wall/opening-overlaps.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { roomHeightField, storeyCeilingSources } from "../../domain/elements/room/heights.ts";

export function derivePlanScene(
  geometry: ModelGeometry,
  allows: (id: string) => boolean,
  patterns: readonly HatchPatternDefinition[] = [],
) {
  const plan = visiblePlanGeometry(geometry, allows);
  const openings = new Map<string, typeof plan.openings>();
  for (const opening of plan.openings) {
    if (!openings.has(opening.wallId)) openings.set(opening.wallId, []);
    openings.get(opening.wallId)!.push(opening);
  }
  const doors = new Map<string, typeof plan.doors>();
  for (const door of plan.doors) {
    if (!doors.has(door.wallId)) doors.set(door.wallId, []);
    doors.get(door.wallId)!.push(door);
  }
  // Overlaps stay allowed; the plan marks every involved window or door as a hint.
  const storey = "storeys" in geometry ? storeyOf(geometry) : geometry.storey;
  const ceilings = plan.rooms.length ? storeyCeilingSources(storey) : [];
  const overlapping = new Set(openingOverlaps(storey).flatMap((o) => [o.first, o.second]));
  return {
    plan,
    doors,
    overlapping,
    hatchPatterns: new Map(patterns.map((p) => [p.id, p])),
    openings,
    assets: new Map(geometry.assets.map((a) => [a.id, a])),
    solids: new Map(connectedWallSolids(geometry).map((s) => [s.wallId, s])),
    outlines: wallPlanOutlines(geometry, new Set(plan.walls.map((w) => w.id))),
    walls: new Map(plan.walls.map((w) => [w.id, w])),
    slabs: new Map(plan.slabs.map((s) => [s.id, s])),
    roofs: new Map(plan.roofs.map((r) => [r.id, r])),
    rooms: new Map(plan.rooms.map((r) => [r.id, r])),
    // Clear heights from the storey's slabs and roofs, whatever their display (R3).
    roomHeights: new Map(plan.rooms.map((r) => [r.id, roomHeightField(r, ceilings)] as const)),
    // Cut at 1 m, outline below and above it (docs/ROOF_ELEMENT.md, D4).
    roofViews: new Map(plan.roofs.map((r) => [r.id, roofPlanView(r)])),
    hatches: new Map(plan.hatches.map((h) => [h.id, h])),
    lines: new Map(plan.lines.map((l) => [l.id, l])),
    references: new Map(plan.references.map((r) => [r.id, r])),
  };
}
export type PlanScene = ReturnType<typeof derivePlanScene>;
export type PlanRun = {
  kind: "reference" | "room" | "slab" | "roof" | "hatch" | "wall" | "line";
  ids: string[];
  affected: boolean;
};
/** Partition once per base/selection. Preserve exact drawing order, including overlapping images. */
export function planSceneRuns(scene: PlanScene, replacedIds: readonly string[]): PlanRun[] {
  const replaced = new Set(replacedIds),
    runs: PlanRun[] = [];
  for (const [kind, elements] of [
    ["reference", scene.plan.references],
    // Rooms lie beneath every building element; clicks on walls keep reaching the wall.
    ["room", scene.plan.rooms],
    // The storey's ceiling slab lies outside the cut plane: drawn first, beneath 2D content.
    ["slab", scene.plan.slabs],
    // Roof outline as seen from below the roof (docs/ROOF_ELEMENT.md, D3; cut view in D4).
    ["roof", scene.plan.roofs],
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
