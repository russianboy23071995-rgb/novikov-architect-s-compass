import { validateProject, type Project } from "./schema.ts";
import { sameProjectContent } from "./model-equality.ts";

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Validation owns the structure; immutable image handles remain shared.
 * Confirmation still validates arbitrary public inputs and detects in-place mutation.
 * Neither preparation nor confirmation serializes the unchanged image payloads.
 */
export function prepareProjectSnapshot(source: Project) {
  const base = freeze(validateProject(source));
  return Object.freeze({
    base,
    assertCurrent(current: Project) {
      if (current !== source || !sameProjectContent(validateProject(current), base))
        throw new Error("Modell geändert. Bewegung erneut beginnen.");
    },
  });
}
