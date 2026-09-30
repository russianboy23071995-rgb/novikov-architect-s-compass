import { useEffect, useRef, useState } from "react";
import type { Point, Project } from "../../lib/bim/model.ts";
import type { Selection } from "./bim-view.ts";
import { clampMenuPosition, selectionSummary } from "./demand-menu.ts";

export function DemandMenu({
  project,
  selection,
  position,
  onPosition,
  onInfo,
}: {
  project: Project;
  selection: NonNullable<Selection>;
  position: Point;
  onPosition: (point: Point) => void;
  onInfo: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; pointer: Point; origin: Point } | null>(null);
  const [bounds, setBounds] = useState({
    width: 1024,
    height: 768,
    menuWidth: 240,
    menuHeight: 160,
  });
  useEffect(() => {
    const measure = () => {
      const rect = panel.current?.getBoundingClientRect();
      setBounds({
        width: window.innerWidth,
        height: window.innerHeight,
        menuWidth: rect?.width ?? 240,
        menuHeight: rect?.height ?? 160,
      });
    };
    const observer = new ResizeObserver(measure);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const visible = clampMenuPosition(position, bounds);
  const summary = selectionSummary(project, selection);
  if (!summary) return null;
  return (
    <div
      ref={panel}
      id="Demand_menu"
      role="region"
      aria-label="Elementmenü"
      data-testid="demand-menu"
      className="glass-panel-strong fixed z-50 w-60 max-w-[calc(100vw-16px)] overflow-auto rounded-lg border p-2 text-xs shadow-lg"
      style={{ left: visible.x, top: visible.y, maxHeight: "calc(100vh - 16px)" }}
    >
      <button
        type="button"
        aria-label="Menü verschieben"
        title="Ziehen oder mit Pfeiltasten verschieben"
        className="mb-2 w-full touch-none cursor-move rounded bg-muted px-2 py-1 text-left font-semibold"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            id: event.pointerId,
            pointer: { x: event.clientX, y: event.clientY },
            origin: visible,
          };
        }}
        onPointerMove={(event) => {
          const active = drag.current;
          if (!active || active.id !== event.pointerId) return;
          onPosition(
            clampMenuPosition(
              {
                x: active.origin.x + event.clientX - active.pointer.x,
                y: active.origin.y + event.clientY - active.pointer.y,
              },
              bounds,
            ),
          );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
        onKeyDown={(event) => {
          const offset = {
            ArrowLeft: [-10, 0],
            ArrowRight: [10, 0],
            ArrowUp: [0, -10],
            ArrowDown: [0, 10],
          }[event.key];
          if (!offset) return;
          event.preventDefault();
          event.stopPropagation();
          onPosition(
            clampMenuPosition({ x: visible.x + offset[0]!, y: visible.y + offset[1]! }, bounds),
          );
        }}
      >
        ⠿ {summary.title}
      </button>
      <p className="break-all font-mono">{selection.id}</p>
      <p className="my-2">{summary.details}</p>
      <button type="button" onClick={onInfo} className="rounded border px-3 py-1 hover:bg-muted">
        Info anzeigen
      </button>
    </div>
  );
}
