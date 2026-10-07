import { closedContour } from "@/application/direct-edit/contour";
import { useEffect, useRef, useState } from "react";
import type { Point, Project } from "../../lib/bim/model.ts";
import type { Selection } from "./bim-view.ts";
import { clampMenuPosition, selectionSummary } from "./demand-menu.ts";
import type { EditAction } from "@/lib/bim/direct-edit";

export function DemandMenu({
  calibrationControls,
  project,
  selection,
  position,
  onPosition,
  onInfo,
  pointIndex,
  edgeIndex,
  onAction,
  onReferences,
  onMoveSelection,
  selectionCount = 0,
}: {
  calibrationControls?: import("react").ReactNode;
  onMoveSelection?: (() => void) | undefined;
  selectionCount?: number;
  project: Project;
  selection: Selection;
  position: Point;
  onPosition: (point: Point) => void;
  onInfo: () => void;
  pointIndex: number | null;
  edgeIndex?: number | null;
  onAction: (action: EditAction) => void;
  onReferences?: (() => void) | undefined;
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
  if (!summary && !onReferences && !onMoveSelection && !calibrationControls) return null;
  return (
    <div
      ref={panel}
      id="Demand_menu"
      role="region"
      aria-label="Elementmenü"
      data-testid="demand-menu"
      className="glass-panel-strong fixed z-50 w-44 max-w-[calc(100vw-16px)] overflow-auto rounded-lg border p-2 text-xs shadow-lg"
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
        ⠿ {selectionCount > 1 ? `${selectionCount} Elemente` : (summary?.title ?? "Fanghilfen")}
        {summary && edgeIndex != null ? ` · Seite ${edgeIndex + 1}` : ""}
        {summary && pointIndex !== null ? ` · Punkt ${pointIndex + 1}` : ""}
      </button>

      <div className="grid gap-1">
        {calibrationControls}
        {onMoveSelection && (
          <button
            type="button"
            className="rounded border p-1 text-left hover:bg-muted"
            onClick={onMoveSelection}
          >
            Auswahl frei bewegen
          </button>
        )}
        {onReferences && (
          <button
            type="button"
            className="rounded border p-1 text-left hover:bg-muted"
            onClick={onReferences}
          >
            Referenzen auswählen
          </button>
        )}
        {selection && selection.kind !== "reference" && summary && (
          <>
            {closedContour(project, selection) && (
              <button
                type="button"
                className="rounded border p-1 text-left hover:bg-muted"
                onClick={() => onAction("offset")}
              >
                Kontur versetzen (Offset)
              </button>
            )}
            {edgeIndex != null && (
              <>
                <button
                  type="button"
                  className="rounded border p-1 text-left hover:bg-muted"
                  onClick={() => onAction("insert")}
                >
                  Knicken
                </button>
                <button
                  type="button"
                  className="rounded border p-1 text-left hover:bg-muted"
                  onClick={() => onAction("edge")}
                >
                  Seite strecken
                </button>
              </>
            )}
            {selection.kind !== "window" && pointIndex !== null && (
              <>
                <button
                  type="button"
                  className="rounded border p-1 text-left hover:bg-muted"
                  onClick={() => onAction("point")}
                >
                  Punkt frei bewegen
                </button>
                <button
                  type="button"
                  className="rounded border p-1 text-left hover:bg-muted"
                  onClick={() => onAction("stretch")}
                >
                  Punkt in Flucht strecken
                </button>
              </>
            )}
            {selection.kind !== "window" && (
              <button
                type="button"
                className="rounded border p-1 text-left hover:bg-muted"
                onClick={() => onAction("move")}
              >
                Element frei bewegen
              </button>
            )}
            {edgeIndex == null && (
              <button
                type="button"
                className="rounded border p-1 text-left hover:bg-muted"
                onClick={() => onAction("axis")}
              >
                {selection.kind === "window" ? "Fenster entlang Wand" : "Element entlang Achse"}
              </button>
            )}
            {selection.kind !== "window" && (
              <>
                <button
                  type="button"
                  className="rounded border p-1 text-left hover:bg-muted"
                  onClick={() => onAction("x")}
                >
                  Element auf X-Achse
                </button>
                <button
                  type="button"
                  className="rounded border p-1 text-left hover:bg-muted"
                  onClick={() => onAction("y")}
                >
                  Element auf Y-Achse
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onInfo}
              className="rounded border p-1 text-left hover:bg-muted"
            >
              Werkzeugeigenschaften
            </button>
          </>
        )}
      </div>
    </div>
  );
}
