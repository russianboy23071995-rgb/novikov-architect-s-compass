import { validateProject, type Project } from "./schema.ts";
import { resolveStoreyLevels } from "../storeys/heights.ts";
import type { WallSolidReuse } from "../elements/wall/connections.ts";

export type ProjectResultMode = "mutable" | "owned";

// Provenance is private: caller freezing, casting or copying cannot grant trust.
const owned = new WeakSet<object>();
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

const hasId = (value: unknown): value is { id: string } =>
  !!value && typeof value === "object" && typeof (value as { id?: unknown }).id === "string";

/** Reuse previous owned subtrees whose serialized content is identical; key order included.
 * Frozen parts of the fresh result (verified asset handles) are never rebuilt.
 */
function share(next: unknown, previous: unknown): unknown {
  if (next === previous) return previous;
  if (!next || typeof next !== "object" || !previous || typeof previous !== "object") return next;
  if (Object.isFrozen(next)) return next;
  if (Array.isArray(next)) {
    if (!Array.isArray(previous)) return next;
    const byId = new Map(previous.filter(hasId).map((item) => [item.id, item]));
    let same = next.length === previous.length;
    const result = next.map((item, i) => {
      const shared = share(item, hasId(item) ? byId.get(item.id) : previous[i]);
      if (shared !== previous[i]) same = false;
      return shared;
    });
    return same ? previous : result;
  }
  if (Array.isArray(previous)) return next;
  const left = next as Record<string, unknown>,
    right = previous as Record<string, unknown>;
  const keys = Object.keys(left).filter((k) => left[k] !== undefined);
  const other = Object.keys(right).filter((k) => right[k] !== undefined);
  let same = keys.length === other.length && keys.every((k, i) => k === other[i]);
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(left)) {
    result[key] = share(left[key], right[key]);
    if (result[key] !== right[key]) same = false;
  }
  return same ? previous : result;
}

/** Own a validated immutable structure without freezing caller data.
 * Already verified immutable image handles may remain shared.
 * With an owned base, unchanged subtrees keep the base's object identity.
 * Keep validateProject's public mutable-copy contract unchanged.
 */
export function createProjectSnapshot(
  source: Project,
  reuse?: WallSolidReuse,
  base?: Project,
): Project {
  if (owned.has(source)) return source;
  const validated = validateProject(source, reuse);
  const snapshot = freeze(
    base && owned.has(base) ? (share(validated, base) as Project) : validated,
  );
  owned.add(snapshot);
  return snapshot;
}

/** Commands keep their input's ownership: an owned input yields an owned result sharing its
 * unchanged parts, so a following commit need not validate again. Any other input keeps
 * validateProject's mutable copy. Both paths run the same full validation.
 */
export function validateLike(input: Project, proposed: Project, reuse?: WallSolidReuse): Project {
  return owned.has(input)
    ? createProjectSnapshot(proposed, reuse, input)
    : validateProject(proposed, reuse);
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
