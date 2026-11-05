import { useState } from "react";
import { clampNavigatorWidth, NAVIGATOR_WIDTH } from "./palette-layout";

const key = "novikov.navigator.width";

/** Width of the floating navigator palette, remembered in this browser (docs/GLAS_PALETTEN.md). */
export function useNavigatorWidth() {
  const [navigatorWidth, setWidth] = useState<number>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? NAVIGATOR_WIDTH.initial : clampNavigatorWidth(Number(stored));
    } catch {
      return NAVIGATOR_WIDTH.initial;
    }
  });
  const setNavigatorWidth = (width: number) => {
    const next = clampNavigatorWidth(width);
    setWidth(next);
    try {
      window.localStorage.setItem(key, String(next));
    } catch {
      /* Session preference remains usable. */
    }
  };
  return { navigatorWidth, setNavigatorWidth };
}
