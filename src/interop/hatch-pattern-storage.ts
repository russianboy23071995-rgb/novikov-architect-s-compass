import type { HatchPatternStorage } from "../application/hatches/pattern-library";
const key = "novikov.hatch-patterns.v1";
const changed = "novikov-hatch-patterns-changed";
/** Project-independent within this browser profile/origin. Replaceable platform adapter. */
export const browserHatchPatternStorage: HatchPatternStorage = {
  read: () => window.localStorage.getItem(key),
  write: (value) => {
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new Event(changed));
  },
};

/** Notifications only; optimistic guards remain in Application actions. */
export function subscribeHatchPatterns(notify: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if ((event.key === key || event.key === null) && event.storageArea === window.localStorage)
      notify();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changed, notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changed, notify);
  };
}
