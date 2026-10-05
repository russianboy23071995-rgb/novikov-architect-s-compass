import { validateProject, type Project } from "../../project/schema.ts";
import { inspectCornerOpenings, type CornerTarget } from "./corner-openings.ts";
import { wallContourSolid } from "./contour-solid.ts";
/** Disposable geometry for the explicit pair only. No persistent joins, renderer
 * replacement or eligibility policy. End-contact cases remain unsupported here.
 */
export function deriveCornerSolids(input: Project, first: CornerTarget, second: CornerTarget) {
  const project = validateProject(input),
    inspection = inspectCornerOpenings(project, first, second);
  for (const opening of inspection.openings)
    if (opening.status !== "contained")
      throw new Error(
        `Öffnung ${opening.windowId}: ${opening.status} am Wandabschluss wird noch nicht unterstützt.`,
      );
  const walls = inspection.corner.walls.map((contour) => {
    const wall = project.storey.walls.find((w) => w.id === contour.wallId)!;
    return wallContourSolid(wall, contour.points, project.storey.windows);
  });
  const volume = walls.reduce((sum, w) => sum + w.volume, 0);
  if (!Number.isFinite(volume)) throw new Error("Anschlussvolumen nicht darstellbar.");
  return { walls, volume };
}
