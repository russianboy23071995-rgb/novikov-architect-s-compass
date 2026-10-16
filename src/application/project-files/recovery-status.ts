import type { Project } from "../../domain/project/schema.ts";
import { readProjectRecovery, type RecoveryCatalog } from "./recovery-catalog.ts";
import {
  createProjectSnapshot,
  isOwnedProjectSnapshot,
} from "../../domain/project/owned-snapshot.ts";

export type RecoveryStatus =
  | { kind: "checking" }
  | { kind: "missing" }
  | { kind: "current" | "changed"; savedAt: string }
  | { kind: "unavailable"; message: string };

// Compare all persisted content, including view settings excluded from model Undo.
// Project values are validated plain immutable data. Object property order is irrelevant.
export function sameRecoveryContent(a: unknown, b: unknown): boolean {
  return compareContent(a, b);
}

type ComparisonCache = WeakMap<object, WeakMap<object, boolean>>;
function compareContent(a: unknown, b: unknown, cache?: ComparisonCache): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const known = cache?.get(a)?.get(b);
  if (known !== undefined) return known;
  let equal: boolean;
  if (Array.isArray(a) || Array.isArray(b)) {
    equal =
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v, i) => compareContent(v, b[i], cache));
  } else {
    const left = a as Record<string, unknown>,
      right = b as Record<string, unknown>;
    const keys = Object.keys(left).filter((k) => left[k] !== undefined);
    equal =
      keys.length === Object.keys(right).filter((k) => right[k] !== undefined).length &&
      keys.every((k) => Object.hasOwn(right, k) && compareContent(left[k], right[k], cache));
  }
  if (cache) {
    let pairs = cache.get(a);
    if (!pairs) {
      pairs = new WeakMap();
      cache.set(a, pairs);
    }
    pairs.set(b, equal);
  }
  return equal;
}

/** Exact comparison, memoized only for factory-owned deeply immutable snapshots.
 * One baseline/session; weak keys cannot retain obsolete undo snapshots. No hashes,
 * ignored view fields or trust in caller-applied shallow Object.freeze.
 */
export function createRecoveryContentComparator(saved: Project) {
  const baseline = createProjectSnapshot(saved);
  const cache: ComparisonCache = new WeakMap();
  return (current: Project) =>
    compareContent(current, baseline, isOwnedProjectSnapshot(current) ? cache : undefined);
}

/** Session-local query tracker, never writes or changes the project/history. */
export function createRecoveryStatusTracker(
  catalog: RecoveryCatalog,
  notify: (status: RecoveryStatus, project: Project, context: unknown) => void,
) {
  let project: Project | undefined;
  let context: unknown;
  let baseline: Awaited<ReturnType<typeof readProjectRecovery>>;
  let pending = false;
  let failure: string | undefined;
  let generation = 0;
  let disposed = false;
  let compare: ReturnType<typeof createRecoveryContentComparator> | undefined;
  function publish() {
    if (!project || disposed) return;
    const status: RecoveryStatus = pending
      ? { kind: "checking" }
      : failure
        ? { kind: "unavailable", message: failure }
        : !baseline
          ? { kind: "missing" }
          : {
              kind: compare!(project) ? "current" : "changed",
              savedAt: baseline.savedAt,
            };
    notify(status, project, context);
  }
  async function refresh() {
    if (!project || disposed) return;
    const request = ++generation;
    const id = project.id;
    pending = true;
    failure = undefined;
    publish();
    try {
      const result = await readProjectRecovery(catalog, id);
      if (disposed || request !== generation) return;
      baseline = result;
      compare = result ? createRecoveryContentComparator(result.project) : undefined;
    } catch (error) {
      if (disposed || request !== generation) return;
      baseline = null;
      compare = undefined;
      failure = error instanceof Error ? error.message : "Speicher nicht verfügbar.";
    }
    if (disposed || request !== generation) return;
    pending = false;
    publish();
  }
  return {
    update(next: Project, nextContext: unknown) {
      if (disposed) return;
      const changedContext = !project || next.id !== project.id || nextContext !== context;
      if (!changedContext && next === project) return;
      project = next;
      context = nextContext;
      if (changedContext) {
        baseline = null;
        compare = undefined;
        void refresh();
      } else publish();
    },
    refresh,
    dispose() {
      disposed = true;
      generation++;
      compare = undefined;
      baseline = null;
    },
  };
}
