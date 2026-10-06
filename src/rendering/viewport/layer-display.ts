import { isLayerVisible, type LayerVisibilityPolicy } from "../../application/layers/visibility.ts";
import type { Project } from "../../domain/project/schema.ts";
import type {
  createLayerVisibilityPolicy,
  LayerVisibilityContext,
} from "../../application/layers/visibility.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import type { Solid } from "../../lib/bim/geometry.ts";

/** Display surfaces deliberately have no volume: quantities belong to the complete model. */
export type DisplaySurfaces = Pick<Solid, "min" | "max"> & {
  faces: {
    wallId: string;
    vertices: [number, number, number][];
    normal: [number, number, number];
  }[];
};

/** Shared renderer filters also accept disposable edit-preview geometry.
 * Eligibility always stays bound to the committed project, never the preview. */
export function visiblePlanGeometry(project: Project, allows: (id: string) => boolean) {
  const walls = project.storey.walls.filter((w) => allows(w.id));
  const wallIds = new Set(walls.map((w) => w.id));
  return {
    walls,
    hatches: project.storey.hatches.filter((h) => allows(h.id)),
    windows: project.storey.windows.filter((w) => allows(w.id)),
    lines: (project.storey.lines ?? []).filter((l) => allows(l.id)),
    openings: project.storey.windows.filter((w) => wallIds.has(w.wallId)),
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
  const existing = new Set(base.storey.walls.map((w) => w.id));
  const newWalls = new Map(
    draft.storey.walls.filter((w) => !existing.has(w.id)).map((w) => [w.id, w]),
  );
  const existingWindows = new Set(base.storey.windows.map((w) => w.id));
  const newWindows = new Map(
    draft.storey.windows.filter((w) => !existingWindows.has(w.id)).map((w) => [w.id, w]),
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
    const wall = newWalls.get(id);
    if (!wall) return isLayerVisible(base, policy, id);
    return (
      !policy ||
      (policy.isCurrent(base, policy.context) &&
        !policy.context.hiddenLayerIds.includes(wall.layerId))
    );
  };
}
