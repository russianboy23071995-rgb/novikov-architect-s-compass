import { validateProject, type Project } from "./schema.ts";

// Provenance is private: caller freezing, casting or copying cannot grant trust.
const owned = new WeakSet<object>();
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Own a validated immutable structure without freezing caller data.
 * Already verified immutable image handles may remain shared.
 * Keep validateProject's public mutable-copy contract unchanged.
 */
export function createProjectSnapshot(source: Project): Project {
  if (owned.has(source)) return source;
  const snapshot = freeze(validateProject(source));
  owned.add(snapshot);
  return snapshot;
}

/** Only factory-owned, deeply immutable and fully validated projects qualify. */
export function isOwnedProjectSnapshot(source: Project): boolean {
  return owned.has(source);
}
