import {
  validateHatchPattern,
  type HatchPatternDefinition,
} from "../../domain/elements/hatch/pattern.ts";
import { samePattern, type PatternRevision } from "../../domain/elements/hatch/revision.ts";
import {
  loadPatternLibrary,
  writePatternLibrary,
  type HatchPatternStorage,
  type PatternLibrary,
} from "./pattern-library.ts";
export type PatternHistory = {
  past: PatternRevision[][];
  present: PatternLibrary;
  future: PatternRevision[][];
  token: string | null;
};
const HISTORY_LIMIT = 20;
const HISTORY_PAYLOAD_LIMIT = 4_000_000;
export function createPatternHistory(storage: HatchPatternStorage): PatternHistory {
  const token = storage.read();
  const present = loadPatternLibrary({
    read: () => token,
    write: () => {
      throw new Error("Read only");
    },
  });
  return { past: [], present, future: [], token };
}
function guard(storage: HatchPatternStorage, history: PatternHistory) {
  if (storage.read() !== history.token) throw new Error("Bibliothek wurde geändert. Neu laden.");
}
function bound(history: PatternHistory): PatternHistory {
  const past = history.past.slice(-HISTORY_LIMIT),
    future = history.future.slice(0, HISTORY_LIMIT);
  while (
    (past.length || future.length) &&
    JSON.stringify({ past, present: history.present, future }).length > HISTORY_PAYLOAD_LIMIT
  ) {
    if (past.length) past.shift();
    else future.pop();
  }
  return { ...history, past, future };
}
function publish(
  storage: HatchPatternStorage,
  history: PatternHistory,
  target: readonly PatternRevision[],
  direction: "edit" | "undo" | "redo",
): PatternHistory {
  const clock = history.present.clock + 1;
  const records = target.map((r) => {
    const current = history.present.records.find((c) => c.definition.id === r.definition.id);
    return {
      definition: validateHatchPattern(r.definition),
      revision: current && samePattern(current.definition, r.definition) ? current.revision : clock,
    };
  });
  // Build and bound everything before the only storage write. Failed writes return no new state.
  const next = bound({
    present: { clock, records },
    token: history.token,
    past:
      direction === "undo" ? history.past.slice(0, -1) : [...history.past, history.present.records],
    future:
      direction === "edit"
        ? []
        : direction === "redo"
          ? history.future.slice(1)
          : [history.present.records, ...history.future],
  });
  writePatternLibrary(storage, next.present);
  return { ...next, token: JSON.stringify({ version: 2, ...next.present }) };
}
export function editHatchPattern(
  storage: HatchPatternStorage,
  history: PatternHistory,
  id: string,
  expectedRevision: number,
  definition: HatchPatternDefinition,
): PatternHistory {
  guard(storage, history);
  const current = history.present.records.find((r) => r.definition.id === id);
  if (!current || current.revision !== expectedRevision || definition.id !== id)
    throw new Error("Musterziel oder Revision ist nicht mehr aktuell.");
  const owned = validateHatchPattern(definition);
  if (samePattern(current.definition, owned)) return history;
  return publish(
    storage,
    history,
    history.present.records.map((r) => (r.definition.id === id ? { ...r, definition: owned } : r)),
    "edit",
  );
}
/** Creation joins the same independent library history; used project copies remain portable on Undo. */
export function createLibraryHatchPattern(
  storage: HatchPatternStorage,
  history: PatternHistory,
  definition: HatchPatternDefinition,
): PatternHistory {
  guard(storage, history);
  const owned = validateHatchPattern(definition);
  if (history.present.records.some((r) => r.definition.id === owned.id))
    throw new Error("Doppelte Muster-ID.");
  return publish(
    storage,
    history,
    [...history.present.records, { definition: owned, revision: history.present.clock + 1 }],
    "edit",
  );
}
export function undoHatchPattern(
  storage: HatchPatternStorage,
  history: PatternHistory,
): PatternHistory {
  guard(storage, history);
  const target = history.past.at(-1);
  return target ? publish(storage, history, target, "undo") : history;
}
export function redoHatchPattern(
  storage: HatchPatternStorage,
  history: PatternHistory,
): PatternHistory {
  guard(storage, history);
  const target = history.future[0];
  return target ? publish(storage, history, target, "redo") : history;
}
