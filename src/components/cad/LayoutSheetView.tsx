import { useMemo, useRef, useState } from "react";
import type { Project } from "@/domain/project/schema";
import {
  layoutSheet,
  projectLayouts,
  projectMasterLayouts,
  sheetSize,
  PAPER_FORMAT_LABELS,
} from "@/domain/views/layouts";

type Box = { x: number; y: number; w: number; h: number };
const text = (v: number) => String(v).replace(".", ",");

/**
 * A layout or master layout open as a canvas tab (docs/LAYOUTS.md, LA4): the sheet to scale in
 * millimetres with its margin frame. Wheel zooms, dragging pans, „Einpassen“ fits the sheet.
 * Empty for now; the drawing of the master and placed drawings follow in later steps.
 */
export function LayoutSheetView({
  project,
  layoutId,
  onSettings,
}: {
  project: Project;
  layoutId: string;
  onSettings: () => void;
}) {
  const layout = projectLayouts(project).find((l) => l.id === layoutId);
  const masters = projectMasterLayouts(project);
  const master = layout
    ? masters.find((m) => m.id === layout.masterId)
    : masters.find((m) => m.id === layoutId);
  const sheet = layout ? layoutSheet(project, layout) : master!.sheet;
  const { width, height } = sheetSize(sheet);
  const fit = useMemo(
    (): Box => ({
      x: -0.08 * width,
      y: -0.08 * height,
      w: width * 1.16,
      h: height * 1.16,
    }),
    [width, height],
  );
  const [box, setBox] = useState<{ fit: Box; box: Box } | null>(null);
  // A changed sheet size starts from the fitted view again.
  const view = box && box.fit === fit ? box.box : fit;
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; box: Box } | null>(null);
  const toSheet = (clientX: number, clientY: number) => {
    const m = svg.current?.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  const m = sheet.margins;
  const kind = layout ? "Layout" : "Masterlayout";
  const name = layout?.name ?? master!.name;
  return (
    <div className="flex h-full flex-col bg-muted">
      <div className="flex items-center gap-3 px-3 pb-1 pt-12 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">
          {kind} {name}
        </span>
        <span>
          {sheet.format === "custom" ? "Frei" : PAPER_FORMAT_LABELS[sheet.format]}{" "}
          {sheet.orientation === "landscape" ? "quer" : "hoch"} · {text(width)} × {text(height)} mm
          · Ränder {text(m.top)}/{text(m.right)}/{text(m.bottom)}/{text(m.left)} mm
        </span>
        {layout && (
          <span>{master ? `folgt Masterlayout „${master.name}“` : "ohne Masterlayout"}</span>
        )}
        <span className="ml-auto flex gap-2">
          <button
            type="button"
            className="rounded border bg-background px-2 py-0.5"
            onClick={() => setBox(null)}
          >
            Einpassen
          </button>
          <button
            type="button"
            className="rounded border bg-background px-2 py-0.5"
            onClick={onSettings}
          >
            Einstellungen …
          </button>
        </span>
      </div>
      <svg
        ref={svg}
        role="img"
        aria-label={`Blatt ${name}`}
        className="min-h-0 flex-1 touch-none select-none"
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        preserveAspectRatio="xMidYMid meet"
        onWheel={(event) => {
          const at = toSheet(event.clientX, event.clientY);
          if (!at) return;
          const f = event.deltaY > 0 ? 1.15 : 1 / 1.15;
          setBox({
            fit,
            box: {
              x: at.x - (at.x - view.x) * f,
              y: at.y - (at.y - view.y) * f,
              w: view.w * f,
              h: view.h * f,
            },
          });
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, box: view };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          const ctm = svg.current?.getScreenCTM();
          if (!start || !ctm) return;
          setBox({
            fit,
            box: {
              ...start.box,
              x: start.box.x - (event.clientX - start.x) / ctm.a,
              y: start.box.y - (event.clientY - start.y) / ctm.d,
            },
          });
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <rect
          x={width * 0.006}
          y={height * 0.008}
          width={width}
          height={height}
          fill="black"
          fillOpacity={0.12}
        />
        <rect
          aria-label="Blatt"
          width={width}
          height={height}
          fill="white"
          stroke="#94a3b8"
          vectorEffect="non-scaling-stroke"
        />
        <rect
          aria-label="Randrahmen"
          x={m.left}
          y={m.top}
          width={width - m.left - m.right}
          height={height - m.top - m.bottom}
          fill="none"
          stroke="#64748b"
          strokeDasharray="6 4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
