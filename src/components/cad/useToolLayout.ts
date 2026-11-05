import { useState } from "react";
import { DEFAULT_TOOL_LAYOUT, normalizeToolLayout, type ToolLayout } from "./tool-layout";

const key = "novikov.toolrail.layout";

/** Arrangement of the tool rail, remembered in this browser (docs/WERKZEUGLEISTE.md, WL1). */
export function useToolLayout() {
  const [toolLayout, setLayout] = useState<ToolLayout>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? DEFAULT_TOOL_LAYOUT : normalizeToolLayout(JSON.parse(stored));
    } catch {
      return DEFAULT_TOOL_LAYOUT;
    }
  });
  const setToolLayout = (layout: ToolLayout) => {
    const next = normalizeToolLayout(layout);
    setLayout(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* Session preference remains usable. */
    }
  };
  return { toolLayout, setToolLayout };
}
