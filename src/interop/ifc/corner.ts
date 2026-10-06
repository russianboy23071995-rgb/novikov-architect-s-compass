import { validateProject, type Project } from "../../domain/project/schema.ts";
import { deriveCornerSolids } from "../../domain/elements/wall/corner-solid.ts";
import type { CornerTarget } from "../../domain/elements/wall/corner-openings.ts";
import { writeIfc } from "./writer.ts";

/** Isolated acceptance export. Explicit temporary pair only; no model connection
 * is saved and the ordinary UI exporter never invokes this path.
 */
export async function exportCornerIfc(
  input: Project,
  first: CornerTarget,
  second: CornerTarget,
  timestamp = new Date(),
) {
  const project = validateProject(input);
  const solids = deriveCornerSolids(project, first, second);
  return writeIfc(project, timestamp, new Map(solids.walls.map((w) => [w.wallId, w.localProfile])));
}
