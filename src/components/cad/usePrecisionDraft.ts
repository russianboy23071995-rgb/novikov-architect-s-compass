import { useState } from "react";
import type { Point2 } from "@/geometry/primitives/point";
import { precisionTarget } from "@/application/input/precision";

/** One transient input lifecycle shared by editing and drawing tools. */
export function usePrecisionDraft(context: object | null) {
  const [saved, setSaved] = useState<{
    context: object;
    angle: string;
    length: string;
    aim: Point2 | null;
    focus: Point2 | null;
  } | null>(null);
  const current = saved?.context === context ? saved : null;
  const draft = current ?? { angle: "", length: "", aim: null, focus: null };
  const change = (angle: string, length: string) => {
    if (context) setSaved({ ...draft, context, angle, length });
  };
  const move = (aim: Point2) => {
    if (context) setSaved({ ...draft, context, aim });
  };
  const fix = (origin: Point2, aim: Point2) => {
    if (!context) return;
    try {
      const { degrees } = precisionTarget(origin, aim, "", "0");
      setSaved({ context, angle: String(degrees), length: "", aim, focus: aim });
    } catch {
      /* Coincident points cannot define a direction. */
    }
  };
  return { ...draft, hasInput: !!(draft.angle.trim() || draft.length.trim()), change, move, fix };
}
