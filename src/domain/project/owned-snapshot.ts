import { validateProject, type Project } from "./schema.ts";
import { resolveStoreyLevels } from "../storeys/heights.ts";

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

/** Narrow view-only transition. No caller-provided model patch can acquire provenance.
 * Untrusted/mutable inputs still pass full validation before anything is shared.
 */
export function snapshotWithWorkingStorey(source: Project, storeyId: string): Project {
  const base = createProjectSnapshot(source);
  const level = resolveStoreyLevels(base.storeys, base.groundStoreyId).find(
    (entry) => entry.storeyId === storeyId,
  );
  if (!level) throw new Error("Unbekanntes Arbeitsgeschoss.");
  if (level.elevation === null)
    throw new Error("Zunächst die Geschosshöhen bis zu diesem Geschoss festlegen.");
  if ((base.workingStoreyId ?? base.groundStoreyId) === storeyId) return base;
  const next = Object.freeze({ ...base, workingStoreyId: storeyId });
  owned.add(next);
  return next;
}
