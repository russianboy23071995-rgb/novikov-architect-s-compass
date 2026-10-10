import type { Project } from "../../domain/project/schema.ts";
import { readProjectRecovery, type RecoveryCatalog } from "./recovery-catalog.ts";

export type RecoveryStatus =
  | { kind: "checking" }
  | { kind: "missing" }
  | { kind: "current" | "changed"; savedAt: string }
  | { kind: "unavailable"; message: string };

// Compare all persisted content, including view settings excluded from model Undo.
// Project values are validated plain immutable data. Object property order is irrelevant.
function sameContent(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v, i) => sameContent(v, b[i]))
    );
  const left = a as Record<string, unknown>,
    right = b as Record<string, unknown>;
  const keys = Object.keys(left).filter((k) => left[k] !== undefined);
  return (
    keys.length === Object.keys(right).filter((k) => right[k] !== undefined).length &&
    keys.every((k) => Object.hasOwn(right, k) && sameContent(left[k], right[k]))
  );
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
  function publish() {
    if (!project || disposed) return;
    const status: RecoveryStatus = pending
      ? { kind: "checking" }
      : failure
        ? { kind: "unavailable", message: failure }
        : !baseline
          ? { kind: "missing" }
          : {
              kind: sameContent(project, baseline.project) ? "current" : "changed",
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
    } catch (error) {
      if (disposed || request !== generation) return;
      baseline = null;
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
        void refresh();
      } else publish();
    },
    refresh,
    dispose() {
      disposed = true;
      generation++;
    },
  };
}
