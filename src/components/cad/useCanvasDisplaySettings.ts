import { useEffect, useState } from "react";
import { parseCutFill, defaultCutFill, type CutFill } from "./cut-fill";
const key = "novikov.canvas.wall-outline-px";
const cutKey = "novikov.canvas.cut-fill";
const renovationKey = "novikov.canvas.renovation";
const widths = [0.5, 0.75, 1, 1.25, 1.5, 2];
/** Presentation preference only; never a project mutation or model undo entry. */
export function useCanvasDisplaySettings() {
  const [wallWidth, setWidth] = useState(1);
  const [cutFill, setCut] = useState<CutFill>(defaultCutFill);
  const [showRenovation, setRenovation] = useState(false);
  useEffect(() => {
    try {
      const value = Number(localStorage.getItem(key));
      if (widths.includes(value)) setWidth(value);
      setCut(parseCutFill(JSON.parse(localStorage.getItem(cutKey) ?? "null")));
      setRenovation(localStorage.getItem(renovationKey) === "1");
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
  const setCutFill = (value: CutFill) => {
    const next = parseCutFill(value);
    setCut(next);
    try {
      localStorage.setItem(cutKey, JSON.stringify(next));
    } catch {
      /* Session preference remains usable. */
    }
  };
  const setShowRenovation = (value: boolean) => {
    setRenovation(value);
    try {
      localStorage.setItem(renovationKey, value ? "1" : "0");
    } catch {
      /* Session preference remains usable. */
    }
  };
  return { wallWidth, setWallWidth, cutFill, setCutFill, showRenovation, setShowRenovation };
}
