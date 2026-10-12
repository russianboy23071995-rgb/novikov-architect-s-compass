import { useEffect, useState } from "react";
const key = "novikov.canvas.wall-outline-px";
const widths = [0.5, 0.75, 1, 1.25, 1.5, 2];
/** Presentation preference only; never a project mutation or model undo entry. */
export function useCanvasDisplaySettings() {
  const [wallWidth, setWidth] = useState(1);
  useEffect(() => {
    try {
      const value = Number(localStorage.getItem(key));
      if (widths.includes(value)) setWidth(value);
    } catch {
      /* Storage unavailable: retain the session default. */
    }
  }, []);
  const setWallWidth = (value: number) => {
    if (!widths.includes(value)) return;
    setWidth(value);
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* Session preference remains usable. */
    }
  };
  return { wallWidth, setWallWidth };
}
