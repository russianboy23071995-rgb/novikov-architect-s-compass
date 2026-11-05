import { PLAN_CUT_HEIGHT, roofPlanView } from "./roof-plan.ts";
import { columnLevels, columnOutline } from "../../domain/elements/column/model.ts";
import { stairGeometry, stairPlan } from "../../domain/elements/stair/model.ts";
import { railingMembers } from "../../domain/elements/railing/model.ts";
import { railingMemberCorners } from "./railing-solid.ts";
import { roofWindowRings } from "../../domain/elements/roof/window.ts";
import {
  objectOutline,
  objectPickRings,
  objectSymbol,
} from "../../domain/elements/object/model.ts";
import { slabOpeningSymbol } from "../../domain/elements/slab/opening.ts";
import type { HatchPatternDefinition } from "../../domain/elements/hatch/pattern.ts";
import type { ModelGeometry } from "../../domain/project/geometry-scope.ts";
import { connectedWallSolids } from "../../domain/elements/wall/connections.ts";
import { visiblePlanGeometry } from "./layer-display.ts";
import { wallPlanOutlines } from "./wall-plan-outline.ts";
import {
  assemblyLibraryOf,
  tJunctionLayerJoints,
  wallLayerBands,
  type AssemblyLibrary,
} from "./wall-layers.ts";
import { openingOverlaps } from "../../domain/elements/wall/opening-overlaps.ts";
import { storeyAbove, storeyOf } from "../../domain/storeys/access.ts";
import {
  roomClearHeights,
  roomHeightLineResults,
  storeyCeilingSources,
} from "../../domain/elements/room/heights.ts";

export function derivePlanScene(
  geometry: ModelGeometry,
  allows: (id: string) => boolean,
  patterns: readonly HatchPatternDefinition[] = [],
  /** Wall build-ups (docs/WANDAUFBAU.md); a storey preview passes its project's library. */
  library: AssemblyLibrary = assemblyLibraryOf("storeys" in geometry ? geometry : {}),
) {
  const plan = visiblePlanGeometry(geometry, allows);
  const displayBands = storeyOf(geometry).displayBands;
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
  // Room ceilings: own roofs and the floor slabs of the storey above (docs/SLAB_ELEMENT.md).
  const above = "storeys" in geometry ? storeyAbove(geometry, storeyOf(geometry).id) : undefined;
  const ceilings = plan.rooms.length ? storeyCeilingSources(storey, above) : [];
  const overlapping = new Set(openingOverlaps(storey).flatMap((o) => [o.first, o.second]));
  // Layers of walls with a build-up, across the thickness (docs/WANDAUFBAU.md, SA2).
  const wallLayers = new Map(
    plan.walls.flatMap((w) => {
      const bands = wallLayerBands(w, library);
      return bands ? [[w.id, bands] as const] : [];
    }),
  );
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
    wallLayers,
    // Incoming cores carried through the host's cover layers at T joints (L09 U2).
    layerJoints: tJunctionLayerJoints(plan.walls, storey.wallTJunctions, wallLayers),
    slabs: new Map(plan.slabs.map((s) => [s.id, s])),
    // Deckendurchbruch: outline with a symmetric black corner wedge, a circle half black
    // (template of the user, docs/DECKENDURCHBRUCH.md).
    slabOpenings: new Map(
      plan.slabOpenings.map((o) => [o.id, { opening: o, symbol: slabOpeningSymbol(o) }]),
    ),
    roofs: new Map(plan.roofs.map((r) => [r.id, r])),
    rooms: new Map(plan.rooms.map((r) => [r.id, r])),
    columns: new Map(plan.columns.map((c) => [c.id, c])),
    stairs: new Map(plan.stairs.map((s) => [s.id, s])),
    // Stairs: steps, walking line and the 1 m cut (docs/TREPPE.md, TR2). Unknown height: outline
    // from the width only, so the stair stays visible and pickable.
    stairViews: new Map(
      plan.stairs.map((s) => {
        const g = stairGeometry(s, "height" in storey ? (storey.height ?? null) : null);
        return [
          s.id,
          g
            ? stairPlan(s, g, PLAN_CUT_HEIGHT - s.baseOffset)
            : stairPlan(
                { ...s, shape: "straight" },
                { riserCount: 2, riser: 0.01, tread: s.width, flights: [2], landing: null },
              ),
        ] as const;
      }),
    ),
    railings: new Map(plan.railings.map((r) => [r.id, r])),
    // Railings: the handrail along the line and the posts in true size (docs/GELAENDER.md, G2).
    railingViews: new Map(
      plan.railings.map(
        (r) =>
          [
            r.id,
            {
              posts: railingMembers(r)
                .filter((m) => m.kind === "post")
                .map(railingMemberCorners),
            },
          ] as const,
      ),
    ),
    dimensions: new Map(plan.dimensions.map((d) => [d.id, d])),
    texts: new Map(plan.texts.map((t) => [t.id, t])),
    // Columns: outline in plan; filled like a cut wall where the 1 m cut plane meets them
    // (docs/STUETZEN.md, P2). Unknown storey height keeps a bound column uncut.
    columnViews: new Map(
      plan.columns.map((c) => {
        const levels = columnLevels(c, "height" in storey ? (storey.height ?? null) : null);
        const cut = !!levels && levels.bottom <= PLAN_CUT_HEIGHT && levels.top >= PLAN_CUT_HEIGHT;
        return [c.id, { outline: columnOutline(c), cut }] as const;
      }),
    ),
    // Clear heights from the storey's slabs and roofs, whatever their display (R3).
    roomHeights: new Map(
      plan.rooms.map(
        (r) =>
          [
            r.id,
            {
              clear: roomClearHeights(r, ceilings),
              lines: roomHeightLineResults(r, ceilings),
            },
          ] as const,
      ),
    ),
    // Cut at 1 m, outline below and above it (docs/ROOF_ELEMENT.md, D4).
    roofViews: new Map(
      plan.roofs.map((r) => [
        r.id,
        roofPlanView(
          r,
          undefined,
          ("roofWindows" in storey ? (storey.roofWindows ?? []) : []).filter(
            (w) => w.roofId === r.id,
          ),
        ),
      ]),
    ),
    // Roof windows: their opening on the roof top, seen from below the roof like its outline
    // above the cut (docs/DACHFLAECHENFENSTER.md, D2). A window whose roof is hidden is not drawn.
    roofWindows: new Map(plan.roofWindows.map((w) => [w.id, w])),
    // Objects: outline and catalogue symbol in thin lines, seen from above
    // (docs/OBJEKTBIBLIOTHEK.md, O1).
    displayBands,
    objects: new Map(plan.objects.map((o) => [o.id, o])),
    objectViews: new Map(
      plan.objects.map(
        (o) =>
          [
            o.id,
            { outline: objectOutline(o), symbol: objectSymbol(o), pick: objectPickRings(o) },
          ] as const,
      ),
    ),
    roofWindowViews: new Map(
      plan.roofWindows.flatMap((w) => {
        const roof = plan.roofs.find((r) => r.id === w.roofId);
        return roof ? [[w.id, roofWindowRings(roof, w).top] as const] : [];
      }),
    ),
    hatches: new Map(plan.hatches.map((h) => [h.id, h])),
    lines: new Map(plan.lines.map((l) => [l.id, l])),
    references: new Map(plan.references.map((r) => [r.id, r])),
  };
}
export type PlanScene = ReturnType<typeof derivePlanScene>;
export type PlanRun = {
  kind:
    | "reference"
    | "room"
    | "slab"
    | "slabOpening"
    | "roof"
    | "hatch"
    | "wall"
    | "column"
    | "stair"
    | "railing"
    | "roofWindow"
    | "object"
    | "line"
    | "dimension"
    | "text";
  ids: string[];
  affected: boolean;
  /** Drawn below or above all kinds (docs/DARSTELLUNGSREIHENFOLGE.md, K3). */
  band?: "front" | "back";
};
/** The T joints a wall run draws (L09 U2): each joint once, in the run that holds whichever of its
 * two walls paints later, so it lies above both walls (docs/TABS.md, Rest beim Auswählen). */
export function planRunJoints(scene: PlanScene, ids: readonly string[]) {
  if (!scene.layerJoints.length) return [];
  const run = new Set(ids);
  const order = new Map(scene.plan.walls.map((w, i) => [w.id, i]));
  return scene.layerJoints.filter((j) =>
    run.has(
      (order.get(j.wallId) ?? -1) >= (order.get(j.hostWallId) ?? -1) ? j.wallId : j.hostWallId,
    ),
  );
}
/** Partition once per base/selection. Preserve exact drawing order, including overlapping images. */
export function planSceneRuns(scene: PlanScene, replacedIds: readonly string[]): PlanRun[] {
  const replaced = new Set(replacedIds),
    runs: PlanRun[] = [];
  const front = scene.displayBands?.front ?? [],
    back = scene.displayBands?.back ?? [];
  const lifted = new Set([...front, ...back]);
  const kinds = new Map<string, PlanRun["kind"]>();
  let run: PlanRun | undefined;
  const add = (kind: PlanRun["kind"], id: string, band?: "front" | "back") => {
    const affected = replaced.has(id);
    if (!run || run.kind !== kind || run.affected !== affected || run.band !== band) {
      run = { kind, ids: [], affected, ...(band ? { band } : {}) };
      runs.push(run);
    }
    run.ids.push(id);
  };
  const order = [
    ["reference", scene.plan.references],
    // Rooms lie beneath every building element; clicks on walls keep reaching the wall.
    ["room", scene.plan.rooms],
    // The storey's ceiling slab lies outside the cut plane: drawn first, beneath 2D content.
    ["slab", scene.plan.slabs],
    ["slabOpening", scene.plan.slabOpenings],
    // Roof outline as seen from below the roof (docs/ROOF_ELEMENT.md, D3; cut view in D4).
    ["roof", scene.plan.roofs],
    ["roofWindow", scene.plan.roofWindows],
    ["hatch", scene.plan.hatches],
    // Furniture lies beneath the walls that bound it (docs/OBJEKTBIBLIOTHEK.md).
    ["object", scene.plan.objects],
    ["wall", scene.plan.walls],
    ["column", scene.plan.columns],
    ["stair", scene.plan.stairs],
    ["railing", scene.plan.railings],
    ["line", scene.plan.lines],
    // Dimension chains annotate everything below them (docs/MASSKETTE.md).
    ["dimension", scene.plan.dimensions],
    ["text", scene.plan.texts],
  ] as const;
  for (const [kind, elements] of order) for (const e of elements) kinds.set(e.id, kind);
  for (const id of back) if (kinds.has(id)) add(kinds.get(id)!, id, "back");
  for (const [kind, elements] of order) {
    run = undefined;
    for (const element of elements) if (!lifted.has(element.id)) add(kind, element.id);
  }
  run = undefined;
  for (const id of front) if (kinds.has(id)) add(kinds.get(id)!, id, "front");
  return runs;
}
