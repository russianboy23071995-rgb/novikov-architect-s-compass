import type { EditingState } from "../src/application/direct-edit/controller.ts";
import type { Project } from "../src/lib/bim/model.ts";

/** Committed history snapshots are frozen and cannot be corrupted in place. Model a foreign
 * invalid present by a mutable copy with a session bound to it, so confirmation must take the
 * full validation fallback instead of failing on a stale session.
 */
export function tamperedState(state: EditingState, mutate: (project: Project) => void) {
  const present = structuredClone(state.history.present);
  mutate(present);
  const session = { ...state.session!, base: present };
  return { state: { ...state, history: { ...state.history, present }, session }, session };
}
