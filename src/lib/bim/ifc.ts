import type { Project } from "../../domain/project/schema.ts";
import { writeIfc } from "../../interop/ifc/writer.ts";
export { ifcGuid, stepString, stepReal } from "../../interop/ifc/writer.ts";

/** Existing project export: independent rectangular wall bodies, unchanged. */
export async function exportIfc(input: Project, timestamp = new Date()): Promise<string> {
  return writeIfc(input, timestamp);
}
