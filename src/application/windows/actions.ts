import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { BimWindow, Project } from "../../domain/project/schema.ts";

/** Shared window edit for commands and future adapters: same rule as the former lib/bim
 * action (whole-project validation, own snapshot), without a dependency on lib/bim.
 */
export function updateWindow(
  project: Project,
  windowId: string,
  changes: Partial<Omit<BimWindow, "id">>,
): Project {
  const storey = storeyOf(project);
  if (!storey.windows.some((opening) => opening.id === windowId))
    throw new Error(`Unknown window: ${windowId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storey,
      windows: storey.windows.map((opening) =>
        opening.id === windowId ? { ...opening, ...changes, id: opening.id } : opening,
      ),
    }),
  });
}
