import { useSyncExternalStore } from "react";
import { loadHatchPatterns } from "@/application/hatches/pattern-library";
import type { HatchPatternDefinition } from "@/domain/elements/hatch/pattern";
import {
  browserHatchPatternStorage as storage,
  subscribeHatchPatterns,
} from "@/interop/hatch-pattern-storage";
const empty = { patterns: [] as HatchPatternDefinition[], error: "" };
let key: string | null | undefined;
let snapshot = empty;
function getSnapshot() {
  try {
    const raw = storage.read();
    if (raw !== key || snapshot.error) {
      key = raw;
      snapshot = { patterns: loadHatchPatterns(storage), error: "" };
    }
  } catch {
    if (!snapshot.error)
      snapshot = { patterns: [], error: "Musterbibliothek konnte nicht geladen werden." };
  }
  return snapshot;
}
export function useHatchPatterns() {
  return useSyncExternalStore(subscribeHatchPatterns, getSnapshot, () => empty);
}
