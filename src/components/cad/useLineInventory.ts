import { useSyncExternalStore } from "react";
import { loadLineStyles, loadLineInventory } from "@/application/lines/style-library";
import type { LineStyleDefinition } from "@/application/lines/style-library";
import { browserLineStyleStorage as storage } from "@/interop/line-style-storage";
const empty = { styles: [] as LineStyleDefinition[], error: "" };
let key: string | null | undefined;
let snapshot = empty;
function getSnapshot() {
  try {
    const raw = storage.read();
    if (raw !== key || snapshot.error) {
      key = raw;
      const all = loadLineStyles(storage);
      const ids = loadLineInventory(storage, all);
      snapshot = { styles: ids.map((id) => all.find((s) => s.id === id)!), error: "" };
    }
  } catch {
    if (!snapshot.error)
      snapshot = { styles: [], error: "Linieninventar konnte nicht geladen werden." };
  }
  return snapshot;
}
function subscribe(notify: () => void) {
  window.addEventListener("novikov-line-styles-changed", notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener("novikov-line-styles-changed", notify);
    window.removeEventListener("storage", notify);
  };
}
export function useLineInventory() {
  return useSyncExternalStore(subscribe, getSnapshot, () => empty);
}
