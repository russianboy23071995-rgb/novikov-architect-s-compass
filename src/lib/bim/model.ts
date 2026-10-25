import { projectStorageData } from "../../domain/project/storage-data.ts";
import { assertValidatedProjectSize } from "../../interop/project-file/size.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
export { deserializeProject } from "../../interop/project-file/load.ts";

/** Transitional file-format bridge (user decision 25.10.2026): project actions live in
 * application; saving and loading stay here until the application layer may reach interop.
 */
export function serializeProject(project: Project): string {
  const checked = validateProject(project);
  assertValidatedProjectSize(checked);
  return JSON.stringify(projectStorageData(checked));
}
