import { useEffect, useRef, useState } from "react";
import type { Point2 } from "@/geometry/primitives/point";
import { clampMenuPosition } from "./demand-menu";

/** Reusable presentation for polar tool input. It never changes model geometry. */
export function PrecisionInput({
  focusLengthToken,
  position,
  onPosition,
  onResetPosition,
  angle,
  length,
  angleHint,
  lengthHint,
  axisLabel,
  scalar = false,
  mouseHint = "Mausrichtung · Tab: Länge ↔ Winkel",
  onChange,
  onCaptureDirection,
  onConfirm,
  onCancel,
  error,
  canConfirm,
}: {
  focusLengthToken: Point2 | null;
  position: Point2;
  onPosition: (p: Point2) => void;
  /** Forget the remembered position, so the input follows the cursor again. */
  onResetPosition?: (() => void) | undefined;
  angle: string;
  length: string;
  angleHint: string;
  lengthHint: string;
  axisLabel: string | null;
  scalar?: boolean;
  mouseHint?: string;
  onChange: (angle: string, length: string) => void;
  onCaptureDirection: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  error: string;
  canConfirm: boolean;
}) {
  const angleField = useRef<HTMLInputElement>(null);
  const lengthField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (focusLengthToken) lengthField.current?.focus();
  }, [focusLengthToken]);
  const panel = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const tab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.ctrlKey || event.metaKey || event.altKey) return;
      const active = document.activeElement;
      // Modal workflows own the keyboard while the drawing/edit draft remains suspended.
      if (
        active instanceof Element &&
        active.closest('[role="dialog"], [role="alertdialog"]') &&
        !panel.current?.contains(active)
      )
        return;
      if (
        active instanceof Element &&
        active.matches("input, textarea, select, [contenteditable=true]") &&
        !panel.current?.contains(active)
      )
        return;
      event.preventDefault();
      const inside = active === lengthField.current || active === angleField.current;
      if (!inside && !angle.trim() && !axisLabel) onCaptureDirection();
      const target =
        !scalar && active === lengthField.current ? angleField.current : lengthField.current;
      target?.focus();
      target?.select();
    };
    window.addEventListener("keydown", tab, true);
    return () => window.removeEventListener("keydown", tab, true);
  }, [angle, axisLabel, onCaptureDirection, scalar]);
  const drag = useRef<{ pointer: Point2; origin: Point2; id: number } | null>(null);
  const [bounds, setBounds] = useState({
    width: 1024,
    height: 768,
    menuWidth: 170,
    menuHeight: 150,
  });
  useEffect(() => {
    const measure = () => {
      const r = panel.current?.getBoundingClientRect();
      setBounds({
        width: window.innerWidth,
        height: window.innerHeight,
        menuWidth: r?.width ?? 170,
        menuHeight: r?.height ?? 150,
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
  const field = "w-full min-w-0 rounded border bg-background px-1.5 py-0.5 text-[11px]";
  // Hints live in the title tooltip (user decision 31.10.2026): the window keeps only the fields.
  const hint = [
    axisLabel ?? (angle.trim() ? "Winkel fixiert · leeren löst" : mouseHint),
    "Enter: übernehmen · Esc: abbrechen",
    "Ziehen: Position merken · Doppelklick: wieder am Mauszeiger",
  ].join("\n");
  return (
    <form
      ref={panel}
      aria-label="Hilfseingabefenster"
      className="glass-panel-strong fixed z-40 w-[170px] max-w-[calc(100vw-16px)] rounded-lg border p-1 text-[11px] leading-tight shadow-lg"
      style={{ left: visible.x, top: visible.y, maxHeight: "calc(100vh - 16px)", overflow: "auto" }}
      onSubmit={(e) => {
        e.preventDefault();
        if (canConfirm) onConfirm();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onCancel();
        }
        // Enter confirms (there is no button any more; Enter, Tab and Esc replace them).
        if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
          e.preventDefault();
          if (canConfirm) onConfirm();
        }
      }}
    >
      <button
        type="button"
        aria-label="Hilfseingabe verschieben"
        title={hint}
        onDoubleClick={() => onResetPosition?.()}
        className="mb-1 w-full touch-none cursor-move truncate rounded bg-muted px-1.5 py-0.5 text-left text-[10px]"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = {
            pointer: { x: e.clientX, y: e.clientY },
            origin: visible,
            id: e.pointerId,
          };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d?.id === e.pointerId)
            onPosition(
              clampMenuPosition(
                {
                  x: d.origin.x + e.clientX - d.pointer.x,
                  y: d.origin.y + e.clientY - d.pointer.y,
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
        onKeyDown={(e) => {
          const offset = {
            ArrowLeft: [-10, 0],
            ArrowRight: [10, 0],
            ArrowUp: [0, -10],
            ArrowDown: [0, 10],
          }[e.key];
          if (offset) {
            e.preventDefault();
            e.stopPropagation();
            onPosition(
              clampMenuPosition({ x: visible.x + offset[0]!, y: visible.y + offset[1]! }, bounds),
            );
          }
        }}
      >
        ⠿ Eingabe
      </button>
      <div className={scalar ? "grid gap-1" : "grid grid-cols-2 gap-1"}>
        {!scalar && (
          <label>
            Winkel °
            <input
              ref={angleField}
              aria-label="Bewegungswinkel (Grad)"
              className={field}
              inputMode="decimal"
              value={angle}
              placeholder={angleHint}
              readOnly={!!axisLabel}
              title={axisLabel ?? "Leer: Maus · Zahl: feste Richtung"}
              onChange={(e) => onChange(e.target.value, length)}
            />
          </label>
        )}
        <label>
          {scalar ? "Z-Versatz m" : "Länge m"}
          <input
            ref={lengthField}
            aria-label="Bewegungslänge (m)"
            className={field}
            inputMode="decimal"
            value={length}
            placeholder={lengthHint}
            onChange={(e) => onChange(angle, e.target.value)}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
