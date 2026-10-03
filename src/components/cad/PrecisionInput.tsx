import { useEffect, useRef, useState } from "react";
import type { Point2 } from "@/geometry/primitives/point";
import { clampMenuPosition } from "./demand-menu";

/** Reusable presentation for polar tool input. It never changes model geometry. */
export function PrecisionInput({
  focusLengthToken,
  position,
  onPosition,
  angle,
  length,
  angleHint,
  lengthHint,
  axisLabel,
  mouseHint = "Mausrichtung · Klick fixiert · 90° oben",
  onChange,
  onConfirm,
  onCancel,
  error,
  canConfirm,
}: {
  focusLengthToken: Point2 | null;
  position: Point2;
  onPosition: (p: Point2) => void;
  angle: string;
  length: string;
  angleHint: string;
  lengthHint: string;
  axisLabel: string | null;
  mouseHint?: string;
  onChange: (angle: string, length: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  error: string;
  canConfirm: boolean;
}) {
  const lengthField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (focusLengthToken) lengthField.current?.focus();
  }, [focusLengthToken]);
  const panel = useRef<HTMLFormElement>(null);
  const drag = useRef<{ pointer: Point2; origin: Point2; id: number } | null>(null);
  const [bounds, setBounds] = useState({
    width: 1024,
    height: 768,
    menuWidth: 230,
    menuHeight: 150,
  });
  useEffect(() => {
    const measure = () => {
      const r = panel.current?.getBoundingClientRect();
      setBounds({
        width: window.innerWidth,
        height: window.innerHeight,
        menuWidth: r?.width ?? 230,
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
  const field = "w-full min-w-0 rounded border bg-background px-2 py-1 text-xs";
  return (
    <form
      ref={panel}
      aria-label="Hilfseingabefenster"
      className="glass-panel-strong fixed z-50 w-[230px] max-w-[calc(100vw-16px)] rounded-lg border p-2 text-[11px] shadow-lg"
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
      }}
    >
      <button
        type="button"
        aria-label="Hilfseingabe verschieben"
        className="mb-1 w-full touch-none cursor-move rounded bg-muted px-1 py-1 text-left"
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
        ⠿ Hilfseingabe · Rasterengine
      </button>
      <div className="grid grid-cols-2 gap-2">
        <label>
          Winkel °
          <input
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
        <label>
          Länge m
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
      <p className="my-1 text-muted-foreground">
        {axisLabel ?? (angle.trim() ? "Winkel fixiert · leeren löst" : mouseHint)}
      </p>
      {error && (
        <p role="alert" className="mb-1 text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!canConfirm}
          className="rounded border px-2 py-1 disabled:opacity-40"
        >
          Übernehmen
        </button>
        <button type="button" onClick={() => onChange("", "")}>
          Maus
        </button>
        <button type="button" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}
