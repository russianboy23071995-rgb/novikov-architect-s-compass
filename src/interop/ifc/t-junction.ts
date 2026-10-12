import { validateProject, type Project } from "../../domain/project/schema.ts";
import { deriveTSolids } from "../../domain/elements/wall/t-solid.ts";
import type { CornerTarget } from "../../domain/elements/wall/corner-openings.ts";
import { writeIfc } from "./writer.ts";

/** Explicit acceptance export only. Ordinary project export remains unchanged. */
export async function exportTJunctionIfc(
  input: Project,
  hostId: string,
  incoming: CornerTarget,
  timestamp = new Date(),
) {
  const project = validateProject(input);
  const solids = deriveTSolids(project, hostId, incoming);
  return writeIfc(project, timestamp, new Map(solids.walls.map((w) => [w.wallId, w.localProfile])));
}
