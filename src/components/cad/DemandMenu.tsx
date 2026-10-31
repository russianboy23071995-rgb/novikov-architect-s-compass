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
  onResetPosition,
  onInfo,
  pointIndex,
  edgeIndex,
  onAction,
  onReferences,
  onChainAction,
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
  /** Forget the remembered position, so the menu follows the cursor again. */
  onResetPosition?: (() => void) | undefined;
  onInfo: () => void;
  pointIndex: number | null;
  edgeIndex?: number | null;
  onAction: (action: EditAction) => void;
  onReferences?: (() => void) | undefined;
  /** Chain edits of a selected dimension chain (docs/MASSKETTE.md, M2–M4). */
  onChainAction?: ((action: "add" | "remove" | "line") => void) | undefined;
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
      className="glass-panel-strong fixed z-50 w-36 max-w-[calc(100vw-16px)] overflow-auto rounded-lg border p-1 text-[11px] leading-tight shadow-lg"
      style={{ left: visible.x, top: visible.y, maxHeight: "calc(100vh - 16px)" }}
    >
      <button
        type="button"
        aria-label="Menü verschieben"
        title="Ziehen oder Pfeiltasten: Position merken · Doppelklick: wieder am Mauszeiger"
        onDoubleClick={() => onResetPosition?.()}
        className="mb-1 w-full touch-none cursor-move truncate rounded bg-muted px-1.5 py-0.5 text-left text-[10px] font-semibold"
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

      <div className="grid gap-px">
        {calibrationControls}
        {onMoveSelection && (
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
            data-command="move-selection"
            onClick={onMoveSelection}
          >
            {selectionCount === 1 ? "Element frei bewegen" : "Auswahl frei bewegen"}
          </button>
        )}
        {onReferences && selection?.kind !== "dimension" && (
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
            data-command="references"
            onClick={onReferences}
          >
            Referenzen auswählen
          </button>
        )}
        {selection?.kind === "dimension" && summary && onChainAction && (
          <>
            {(
              [
                ["add", "chain-add", "Punkt hinzufügen"],
                ["remove", "chain-remove", "Punkt entfernen"],
                ["line", "chain-line", "Maßlinie verschieben"],
              ] as const
            ).map(([action, command, label]) => (
              <button
                key={action}
                type="button"
                className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
                data-command={command}
                onClick={() => onChainAction(action)}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
              data-command="move"
              onClick={() => onAction("move")}
            >
              Ganze Kette verschieben
            </button>
            <button
              type="button"
              data-command="tool-settings"
              onClick={onInfo}
              className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
            >
              Werkzeugeigenschaften
            </button>
          </>
        )}
        {selection &&
          selection.kind !== "reference" &&
          selection.kind !== "dimension" &&
          summary && (
            <>
              {/* Slab outlines are edited in the plan only (docs/SLAB_ELEMENT.md, E1). */}
              {/* Roof outlines likewise (docs/ROOF_ELEMENT.md, D3). */}
              {((selection.kind !== "slab" && selection.kind !== "roof") || !solid) && (
                <>
                  {closedContour(project, selection) && (
                    <button
                      type="button"
                      className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
                      data-command="offset"
                      onClick={() => onAction("offset")}
                    >
                      Kontur versetzen (Offset)
                    </button>
                  )}
                  {edgeIndex != null && (
                    <>
                      <button
                        type="button"
                        className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
                        data-command="insert"
                        onClick={() => onAction("insert")}
                      >
                        Knicken
                      </button>
                      <button
                        type="button"
                        className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
                        data-command="edge"
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
                        className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
                        data-command="point"
                        onClick={() => onAction("point")}
                      >
                        Punkt frei bewegen
                      </button>
                      <button
                        type="button"
                        className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
                        data-command="stretch"
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
                  className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
                  data-command="move"
                  onClick={() => onAction("move")}
                >
                  Element frei bewegen
                </button>
              )}
              {edgeIndex == null &&
                selection.kind !== "slab" &&
                selection.kind !== "roof" &&
                selection.kind !== "column" &&
                selection.kind !== "text" && (
                  <button
                    type="button"
                    className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
                    data-command="axis"
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
                    className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
                    data-command="x"
                    onClick={() => onAction("x")}
                  >
                    Element auf X-Achse
                  </button>
                  <button
                    type="button"
                    className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
                    data-command="y"
                    onClick={() => onAction("y")}
                  >
                    Element auf Y-Achse
                  </button>
                </>
              )}
              <button
                type="button"
                data-command="tool-settings"
                onClick={onInfo}
                className="rounded px-1.5 py-0.5 text-left hover:bg-muted"
              >
                Werkzeugeigenschaften
              </button>
            </>
          )}
        {onDeleteSelection && (
          <button
            type="button"
            data-command="delete"
            className="rounded px-1.5 py-0.5 text-left text-destructive hover:bg-muted"
            onClick={onDeleteSelection}
          >
            {selectionCount > 1 ? "Auswahl löschen" : "Löschen"} (Entf)
          </button>
        )}
      </div>
    </div>
  );
}
