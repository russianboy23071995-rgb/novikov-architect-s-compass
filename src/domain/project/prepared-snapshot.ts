import { validateProject, type Project } from "./schema.ts";
import { createProjectSnapshot } from "./owned-snapshot.ts";
import { sameProjectContent } from "./model-equality.ts";

/** Validation owns the structure; immutable image handles remain shared.
 * Confirmation still validates arbitrary public inputs and detects in-place mutation.
 * Neither preparation nor confirmation serializes the unchanged image payloads.
 */
export function prepareProjectSnapshot(source: Project) {
  const base = createProjectSnapshot(source);
  return Object.freeze({
    base,
    assertCurrent(current: Project) {
      if (current !== source || !sameProjectContent(validateProject(current), base))
        throw new Error("Modell geändert. Bewegung erneut beginnen.");
    },
  });
}
