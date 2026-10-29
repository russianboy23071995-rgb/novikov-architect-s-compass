import { closedContour } from "@/application/direct-edit/contour";
import { useEffect, useRef, useState } from "react";
import type { Point, Project } from "../../domain/project/schema.ts";
import type { Selection } from "./bim-view.ts";
import { clampMenuPosition, selectionSummary } from "./demand-menu.ts";
import type { EditAction } from "@/application/direct-edit/session";

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
  onDeleteSelection,
  selectionCount = 0,
  solid = false,
}: {
  /** Opened from the 3D view: slab outlines are edited in the plan only. */
  solid?: boolean;
  calibrationControls?: import("react").ReactNode;
  onMoveSelection?: (() => void) | undefined;
  /** Shared delete operation for the current selection (single or multiple elements). */
  onDeleteSelection?: (() => void) | undefined;
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
  const [bounds, setBounds] = useState<Parameters<typeof clampMenuPosition>[1]>({
    width: 1024,
    height: 768,
    menuWidth: 240,
    menuHeight: 160,
  });
  useEffect(() => {
    // The command bar is an obstacle: the menu must never cover it (it grows with previews).
    const obstacles = () => [...document.querySelectorAll("[data-menu-obstacle]")];
    const measure = () => {
      const rect = panel.current?.getBoundingClientRect();
      setBounds({
        width: window.innerWidth,
        height: window.innerHeight,
        menuWidth: rect?.width ?? 240,
        menuHeight: rect?.height ?? 160,
        obstacles: obstacles().map((element) => {
          const { left, top, right, bottom } = element.getBoundingClientRect();
          return { left, top, right, bottom };
        }),
      });
    };
    const observer = new ResizeObserver(measure);
    if (panel.current) observer.observe(panel.current);
    for (const element of obstacles()) observer.observe(element);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const visible = clampMenuPosition(position, bounds);
  const summary = selectionSummary(project, selection);
  // Wall-hosted openings only move along their wall.
  const opening = selection?.kind === "window" || selection?.kind === "door";
  if (!summary && !onReferences && !onMoveSelection && !onDeleteSelection && !calibrationControls)
    return null;
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
            {selectionCount === 1 ? "Element frei bewegen" : "Auswahl frei bewegen"}
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
        {/* Roofs offer only deletion until the roof tool brings its actions (ROOF_ELEMENT.md, D3). */}
        {selection && selection.kind !== "reference" && selection.kind !== "roof" && summary && (
          <>
            {/* Slab outlines are edited in the plan only (docs/SLAB_ELEMENT.md, E1). */}
            {(selection.kind !== "slab" || !solid) && (
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
                {!opening && pointIndex !== null && (
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
              </>
            )}
            {!opening && (
              <button
                type="button"
                className="rounded border p-1 text-left hover:bg-muted"
                onClick={() => onAction("move")}
              >
                Element frei bewegen
              </button>
            )}
            {edgeIndex == null && selection.kind !== "slab" && (
              <button
                type="button"
                className="rounded border p-1 text-left hover:bg-muted"
                onClick={() => onAction("axis")}
              >
                {selection.kind === "window"
                  ? "Fenster entlang Wand"
                  : selection.kind === "door"
                    ? "Tür entlang Wand"
                    : "Element entlang Achse"}
              </button>
            )}
            {!opening && (
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
        {onDeleteSelection && (
          <button
            type="button"
            className="rounded border p-1 text-left text-destructive hover:bg-muted"
            onClick={onDeleteSelection}
          >
            {selectionCount > 1 ? "Auswahl löschen" : "Löschen"} (Entf)
          </button>
        )}
      </div>
    </div>
  );
}
