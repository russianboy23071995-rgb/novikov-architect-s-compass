import { useCallback, useEffect, useRef, useState } from "react";
import type { Point } from "@/domain/project/schema";
import { enclosedTargets, type SelectionShape } from "@/rendering/viewport/selection-shapes";
import type { SelectionSet } from "@/application/selection/state";
/** Shared gesture, independent of element kinds. Uses the displayed SVG transform. */
export function useSelectionMarquee(
  enabled: boolean,
  scope: object,
  shapes: readonly SelectionShape[],
  commit: ((targets: SelectionSet) => void) | undefined,
) {
  const [box, setBox] = useState<{ a: Point; b: Point } | null>(null);
  const drag = useRef<{
    id: number;
    a: Point;
    client: Point;
    svg: SVGSVGElement;
    scope: object;
  } | null>(null);
  const suppressed = useRef(false);
  const clear = useCallback(() => {
    const old = drag.current;
    drag.current = null;
    setBox(null);
    if (old?.svg.hasPointerCapture(old.id)) old.svg.releasePointerCapture(old.id);
  }, []);
  useEffect(() => {
    clear();
    return clear;
  }, [enabled, scope, clear]);
  const point = (e: React.PointerEvent<SVGSVGElement>) => {
    const m = e.currentTarget.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: -p.y };
  };
  return {
    box,
    down: (e: React.PointerEvent<SVGSVGElement>) => {
      suppressed.current = false;
      if (!enabled || !commit || e.button !== 0 || e.target !== e.currentTarget) return;
      const a = point(e);
      if (!a) return;
      e.preventDefault();
      e.currentTarget.focus();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = {
        id: e.pointerId,
        a,
        client: { x: e.clientX, y: e.clientY },
        svg: e.currentTarget,
        scope,
      };
    },
    move: (e: React.PointerEvent<SVGSVGElement>) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId || d.scope !== scope || !enabled) return;
      const b = point(e);
      if (!b) return;
      if (Math.hypot(e.clientX - d.client.x, e.clientY - d.client.y) >= 3 || suppressed.current) {
        suppressed.current = true;
        setBox({ a: d.a, b });
      }
    },
    up: (e: React.PointerEvent<SVGSVGElement>) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId || d.scope !== scope || !enabled) return;
      const b = point(e);
      if (b && suppressed.current) commit?.(enclosedTargets(shapes, d.a, b));
      clear();
    },
    cancel: () => {
      if (drag.current) suppressed.current = true;
      clear();
    },
    click: (e: React.MouseEvent) => {
      if (suppressed.current) {
        suppressed.current = false;
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
}
