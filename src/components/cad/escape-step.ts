/**
 * What Escape does in the workspace (docs/AUSWAHL_ESCAPE.md, user decision 03.11.2026: two
 * steps). A press another part already used (a marquee, a mask drag, the overlap menu, a
 * dialog) does nothing more. Otherwise the first press ends what is running – a drawing tool,
 * an edit or move, a draft – and keeps the selection; when nothing runs, it clears the
 * selection. The on-demand menu opens with every selection and closes with it.
 */
export type EscapeStep = "none" | "cancel" | "deselect";
export function escapeStep(state: {
  consumed: boolean;
  running: boolean;
  selected: boolean;
}): EscapeStep {
  if (state.consumed) return "none";
  if (state.running) return "cancel";
  return state.selected ? "deselect" : "none";
}
