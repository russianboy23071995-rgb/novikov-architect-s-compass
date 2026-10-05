import { validateProject } from "../../domain/project/schema.ts";
import { connectedWallSolids } from "../../domain/elements/wall/connections.ts";
import type { Project } from "../../domain/project/schema.ts";
import { writeIfc } from "../../interop/ifc/writer.ts";
export { ifcGuid, stepString, stepReal } from "../../interop/ifc/writer.ts";

/** Uses the same domain profiles as plan and solid rendering. */
export async function exportIfc(input: Project, timestamp = new Date()): Promise<string> {
  const project = validateProject(input);
  return writeIfc(
    project,
    timestamp,
    new Map(connectedWallSolids(project).map((w) => [w.wallId, w.localProfile])),
  );
}
