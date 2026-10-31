import { storeyOf } from "../../domain/storeys/access.ts";
import type { ModelGeometry } from "../../domain/project/geometry-scope.ts";
import { isLayerVisible, type LayerVisibilityPolicy } from "../../application/layers/visibility.ts";
import type { Project } from "../../domain/project/schema.ts";
import type {
  createLayerVisibilityPolicy,
  LayerVisibilityContext,
} from "../../application/layers/visibility.ts";
import { buildSolid } from "./storey-solid.ts";
import type { Solid } from "./storey-solid.ts";

/** Display surfaces deliberately have no volume: quantities belong to the complete model. */
export type DisplaySurfaces = Pick<Solid, "min" | "max"> & {
  faces: {
    wallId: string;
    vertices: [number, number, number][];
    normal: [number, number, number];
    /** Ceiling slab face; absent on walls (docs/SLAB_ELEMENT.md, Teil B). */
    slab?: true;
    /** Roof face; absent on walls (docs/ROOF_ELEMENT.md, D2). */
    roof?: true;
    /** Column face; absent on walls (docs/STUETZEN.md). */
    column?: true;
  }[];
};

/** Shared renderer filters also accept disposable edit-preview geometry.
 * Eligibility always stays bound to the committed project, never the preview. */
export function visiblePlanGeometry(project: ModelGeometry, allows: (id: string) => boolean) {
  const walls = storeyOf(project).walls.filter((w) => allows(w.id));
  const wallIds = new Set(walls.map((w) => w.id));
  return {
    walls,
    references: storeyOf(project).references.filter((r) => allows(r.id)),
    slabs: (storeyOf(project).slabs ?? []).filter((s) => allows(s.id)),
    roofs: (storeyOf(project).roofs ?? []).filter((r) => allows(r.id)),
    rooms: (storeyOf(project).rooms ?? []).filter((r) => allows(r.id)),
    columns: (storeyOf(project).columns ?? []).filter((c) => allows(c.id)),
    dimensions: (storeyOf(project).dimensions ?? []).filter((d) => allows(d.id)),
    hatches: storeyOf(project).hatches.filter((h) => allows(h.id)),
    windows: storeyOf(project).windows.filter((w) => allows(w.id)),
    lines: (storeyOf(project).lines ?? []).filter((l) => allows(l.id)),
    openings: storeyOf(project).windows.filter((w) => wallIds.has(w.wallId)),
    // Like window openings: present on visible host walls; the symbol itself follows allows().
    doors: (storeyOf(project).doors ?? []).filter((d) => wallIds.has(d.wallId)),
  };
}
export function visibleSurfaces(
  solid: DisplaySurfaces,
  allows: (id: string) => boolean,
): DisplaySurfaces {
  return { faces: solid.faces.filter((f) => allows(f.wallId)), min: solid.min, max: solid.max };
}

/** One disposable display snapshot for plan primitives, normal picking and solid occlusion.
 * No filtered Project is created. Callers must rebuild on model/context changes.
 * Bounds remain those of the full model so hiding a layer does not refit the camera.
 */
export function createLayerDisplay(
  project: Project,
  policy: ReturnType<typeof createLayerVisibilityPolicy>,
  context: LayerVisibilityContext,
) {
  if (!policy.isCurrent(project, context)) throw new Error("Stale display visibility context");
  const allows = (id: string) => policy.evaluate(project, context, id).eligible;
  const plan = visiblePlanGeometry(project, allows);
  const surfaces = visibleSurfaces(buildSolid(project), allows);
  return {
    plan,
    surfaces,
    /** Use for DOM/keyboard hits too; an old element event must not revive a hidden target. */
    canPick(current: Project, currentContext: LayerVisibilityContext, id: string) {
      return policy.evaluate(current, currentContext, id).eligible;
    },
  };
}

/** New draft walls are display-only and inherit their actual layer, not committed picking eligibility. */
export function drawingWallVisibility(
  base: Project,
  draft: Project,
  policy?: LayerVisibilityPolicy,
) {
  const existing = new Set(storeyOf(base).walls.map((w) => w.id));
  const newWalls = new Map(
    storeyOf(draft)
      .walls.filter((w) => !existing.has(w.id))
      .map((w) => [w.id, w]),
  );
  // New hosted openings (windows, doors) follow their host wall and their own layer.
  const hosted = (p: Project) => [...storeyOf(p).windows, ...(storeyOf(p).doors ?? [])];
  const existingWindows = new Set(hosted(base).map((w) => w.id));
  const newWindows = new Map(
    hosted(draft)
      .filter((w) => !existingWindows.has(w.id))
      .map((w) => [w.id, w]),
  );
  return (id: string) => {
    const opening = newWindows.get(id);
    if (opening)
      return (
        isLayerVisible(base, policy, opening.wallId) &&
        (!policy ||
          (policy.isCurrent(base, policy.context) &&
            !policy.context.hiddenLayerIds.includes(opening.layerId)))
      );
    const reference = storeyOf(draft).references.find(
      (r) => r.id === id && !storeyOf(base).references.some((b) => b.id === id),
    );
    if (reference)
      return (
        !policy ||
        (policy.isCurrent(base, policy.context) &&
          !policy.context.hiddenLayerIds.includes(reference.layerId))
      );
    const wall = newWalls.get(id);
    if (!wall) return isLayerVisible(base, policy, id);
    return (
      !policy ||
      (policy.isCurrent(base, policy.context) &&
        !policy.context.hiddenLayerIds.includes(wall.layerId))
    );
  };
}
