import type { Project } from "../../domain/project/schema.ts";
import type {
  createLayerVisibilityPolicy,
  LayerVisibilityContext,
} from "../../application/layers/visibility.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import type { Solid } from "../../lib/bim/geometry.ts";

/** Display surfaces deliberately have no volume: quantities belong to the complete model. */
export type DisplaySurfaces = Pick<Solid, "faces" | "min" | "max">;

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
  const walls = project.storey.walls.filter((wall) => allows(wall.id));
  const wallIds = new Set(walls.map((wall) => wall.id));
  const solid = buildSolid(project); // all real openings are subtracted before display filtering
  const surfaces: DisplaySurfaces = {
    faces: solid.faces.filter((face) => wallIds.has(face.wallId)),
    min: solid.min,
    max: solid.max,
  };
  return {
    plan: {
      walls,
      windows: project.storey.windows.filter((window) => allows(window.id)),
      lines: (project.storey.lines ?? []).filter((line) => allows(line.id)),
      // Physical voids in visible walls survive hidden window symbols; these are not pick targets.
      openings: project.storey.windows.filter((window) => wallIds.has(window.wallId)),
    },
    surfaces,
    /** Use for DOM/keyboard hits too; an old element event must not revive a hidden target. */
    canPick(current: Project, currentContext: LayerVisibilityContext, id: string) {
      return policy.evaluate(current, currentContext, id).eligible;
    },
  };
}
