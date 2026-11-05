import { validateProject, type Project } from "./schema.ts";
import { createProjectSnapshot, isOwnedProjectSnapshot } from "./owned-snapshot.ts";
import { sameProjectContent } from "./model-equality.ts";

let fullConfirmations = 0;
/** Diagnostic count of confirmations that validated the whole project, for tests. */
export const fullConfirmationCount = () => fullConfirmations;

/** Validation owns the structure; immutable image handles remain shared.
 * Confirmation still validates arbitrary public inputs and detects in-place mutation.
 * Neither preparation nor confirmation serializes the unchanged image payloads.
 */
export function prepareProjectSnapshot(source: Project) {
  const base = createProjectSnapshot(source);
  // An owned snapshot is validated and deeply frozen: the same object cannot have changed
  // (docs/performance/OWNED_MOVE_CONFIRMATION.md). Any other input is checked in full.
  const owned = isOwnedProjectSnapshot(source);
  return Object.freeze({
    base,
    assertCurrent(current: Project) {
      if (current !== source) throw new Error("Modell geändert. Bewegung erneut beginnen.");
      if (owned) return;
      fullConfirmations++;
      if (!sameProjectContent(validateProject(current), base))
        throw new Error("Modell geändert. Bewegung erneut beginnen.");
    },
  });
}
