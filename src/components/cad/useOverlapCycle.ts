import { useEffect, useMemo, useState } from "react";
import type { Point } from "@/domain/project/schema";
import {
  cycleTarget,
  hoverCycle,
  stepCycle,
  type OverlapCycle,
} from "@/application/selection/cycle";
import type { ElementTarget } from "@/application/selection/target";
import { shapesAt, type SelectionShape } from "@/rendering/viewport/selection-shapes";

/** Pick distance around outlines and lines, in screen pixels. */
const PICK_PIXELS = 6;

/**
 * Tab cycling through overlapping elements under the cursor (docs/TAB_AUSWAHL.md): with two or
 * more elements under the pointer a hint appears, Tab / Shift+Tab pre-select the next one, a
 * left click then selects exactly the pre-selected element. Only while nothing is drawn,
 * placed or edited; text fields keep their own Tab.
 */
export function useOverlapCycle(
  enabled: boolean,
  shapes: readonly SelectionShape[],
  pixelsPerMetre: number,
) {
  const [state, setState] = useState<{ cycle: OverlapCycle; point: Point } | null>(null);
  // Bounding boxes once per shape list, so a pointer move tests only nearby elements.
  const boxed = useMemo(
    () =>
      shapes.map((shape) => {
        let x0 = Infinity,
          y0 = Infinity,
          x1 = -Infinity,
          y1 = -Infinity;
        for (const p of shape.points) {
          x0 = Math.min(x0, p.x);
          y0 = Math.min(y0, p.y);
          x1 = Math.max(x1, p.x);
          y1 = Math.max(y1, p.y);
        }
        return { shape, box: [x0, y0, x1, y1] as const };
      }),
    [shapes],
  );
  const active = enabled ? state : null;
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "Escape") return setState(null);
      if (event.key !== "Tab" || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      setState((s) => (s ? { ...s, cycle: stepCycle(s.cycle, event.shiftKey) } : s));
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [active]);
  const shapeOf = (target: ElementTarget) =>
    shapes.find((s) => s.target.kind === target.kind && s.target.id === target.id);
  return {
    /** Current pre-selection with the cursor point, or null (hint hidden). */
    state: active,
    preselected: active ? cycleTarget(active.cycle) : null,
    shapeOf,
    move(point: Point | null) {
      if (!enabled || !point) return setState((s) => (s ? null : s));
      const tolerance = PICK_PIXELS / pixelsPerMetre;
      const nearby = boxed
        .filter(
          ({ box }) =>
            point.x >= box[0] - tolerance &&
            point.x <= box[2] + tolerance &&
            point.y >= box[1] - tolerance &&
            point.y <= box[3] + tolerance,
        )
        .map(({ shape }) => shape);
      const targets = shapesAt(nearby, point, tolerance).map((s) => s.target);
      setState((s) => {
        const cycle = hoverCycle(s?.cycle ?? null, targets);
        return cycle ? { cycle, point } : s ? null : s;
      });
    },
    clear() {
      setState((s) => (s ? null : s));
    },
  };
}
