import { useSyncExternalStore } from "react";
import { loadHatchPatterns } from "@/application/hatches/pattern-library";
import type { HatchPatternDefinition } from "@/domain/elements/hatch/pattern";
import { browserHatchPatternStorage as storage } from "@/interop/hatch-pattern-storage";
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
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("novikov-hatch-patterns-changed", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("novikov-hatch-patterns-changed", notify);
  };
}
export function useHatchPatterns() {
  return useSyncExternalStore(subscribe, getSnapshot, () => empty);
}
