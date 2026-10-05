import type { SnapReference } from "../../constraints/snapping/engine.ts";
/** Coordinates validate a source snapshot; this key names a segment within its model. */
export const segmentKey = (r: SnapReference) => JSON.stringify([r.entityId, r.feature]);
export type ReferenceSelection = {
  confirmed: readonly string[] | null;
  draft: readonly string[] | null;
};
export const emptyReferenceSelection = (): ReferenceSelection => ({ confirmed: null, draft: null });
export type ReferenceSelectionEvent =
  | { type: "begin" }
  | { type: "toggle"; key: string }
  | { type: "apply"; allowed: ReadonlySet<string> }
  | { type: "cancel" }
  | { type: "clear" };
export function reduceReferenceSelection(
  state: ReferenceSelection,
  event: ReferenceSelectionEvent,
): ReferenceSelection {
  switch (event.type) {
    case "begin":
      return { ...state, draft: [...(state.confirmed ?? [])] };
    case "toggle":
      return state.draft === null
        ? state
        : {
            ...state,
            draft: state.draft.includes(event.key)
              ? state.draft.filter((k) => k !== event.key)
              : [...state.draft, event.key],
          };
    case "apply": {
      const valid = state.draft?.filter((k) => event.allowed.has(k));
      return valid?.length ? { confirmed: valid, draft: null } : state;
    }
    case "cancel":
      return { ...state, draft: null };
    case "clear":
      return emptyReferenceSelection();
  }
}
