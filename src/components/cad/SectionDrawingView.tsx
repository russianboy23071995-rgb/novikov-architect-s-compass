import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { Section, SectionHeightMarks } from "@/domain/views/sections";
import type { HeightMarkKind } from "@/domain/views/height-mark";
import {
  sectionCorners,
  snapSectionPoint,
  type SectionSnap,
} from "@/rendering/viewport/section-snap";
import { sectionDrawing, type SectionPoint } from "@/rendering/viewport/section-drawing";
import { Button } from "@/components/ui/button";
import { cutPaint, type CutFill } from "./cut-fill";
import { HeightMark } from "./HeightMark";

type Box = { x: number; y: number; w: number; h: number };

const svgPoints = (points: readonly SectionPoint[]) =>
  points.map((p) => `${p.x},${-p.y}`).join(" ");
const loopPath = (loops: readonly SectionPoint[][]) =>
  loops.map((loop) => `M${svgPoints(loop).replaceAll(" ", " L")} Z`).join(" ");
/** Line weights of cut outlines: building parts heavy, frames medium, glass thin. */
const stroke = { part: 1.75, frame: 1.1, glass: 0.6 } as const;
/** Storey marks outside the border (BS1): triangle 2,5 mm on paper like the section symbol. */
const MARK_PAPER = 0.0025;

/**
 * Section drawing in its canvas tab (docs/SCHNITT.md, SC3): derived from the model on every
 * change; cut parts in the cut fill of the display settings, parts beyond as a view, storey
 * levels with heights. A border at both ends of the line bounds the drawing; the storey heights
 * stand outside it as height marks (BS1). Wheel zooms, dragging pans, „Einpassen“ fits it.
 *
 * Height marks (BS2): with the dimension tool set to „Höhenkote“ the first click places the
 * column of marks, every further click a measured point (snaps to corners and storey levels), a
 * double click or Enter creates them, Esc cancels; the middle button still pans. Without the
 * tool a click on marks selects them, dragging moves them sideways, Entf deletes them.
 */
type Draft = { x: number | null; points: SectionPoint[]; lastAt: number };
export function SectionDrawingView({
  project,
  section,
  cutFill,
  denominator,
  onSettings,
  heightTool,
  onAddHeightMarks,
  onUpdateHeightMarks,
  onRemoveHeightMarks,
}: {
  project: Project;
  section: Section;
  cutFill: CutFill;
  /** Plan scale; sizes the height marks like the other paper sizes. */
  denominator: number;
  onSettings: () => void;
  /** Dimension tool set to height marks; null: no drawing tool in the section. */
  heightTool?: { kind: HeightMarkKind } | null | undefined;
  onAddHeightMarks?: ((marks: SectionHeightMarks) => void) | undefined;
  onUpdateHeightMarks?:
    ((id: string, changes: Partial<Pick<SectionHeightMarks, "x" | "kind">>) => void) | undefined;
  onRemoveHeightMarks?: ((id: string) => void) | undefined;
}) {
  const drawing = useMemo(() => sectionDrawing(project, section), [project, section]);
  const fit = useMemo((): Box => {
    const b = drawing.bounds ?? { minX: 0, maxX: drawing.width, minY: 0, maxY: 3 };
    const margin = MARK_PAPER * denominator * 8;
    const minX = Math.min(b.minX, 0) - margin,
      maxX = Math.max(b.maxX, drawing.width) + margin;
    const levels = drawing.levels.map((l) => l.elevation);
    const minY = Math.min(b.minY, ...levels) - 1,
      maxY = Math.max(b.maxY, ...levels) + 1;
    return { x: minX, y: -maxY, w: maxX - minX, h: maxY - minY };
  }, [drawing, denominator]);
  const [box, setBox] = useState<Box | null>(null);
  const view = box ?? fit;
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; box: Box } | null>(null);
  const toModel = (clientX: number, clientY: number) => {
    const m = svg.current?.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  const paint = cutPaint(cutFill);
  const corners = useMemo(() => sectionCorners(drawing), [drawing]);
  const levels = useMemo(() => drawing.levels.map((l) => l.elevation), [drawing]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [hover, setHover] = useState<SectionSnap | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [moveX, setMoveX] = useState<{ id: string; x: number } | null>(null);
  const moving = useRef<{ id: string; from: number; startX: number } | null>(null);
  const drawingMarks = !!heightTool;
  useEffect(() => {
    setDraft(null);
    setHover(null);
    if (drawingMarks) setSelected(null);
  }, [drawingMarks, section.id]);
  const marks = section.heightMarks ?? [];
  const selectedMarks = marks.find((m) => m.id === selected) ?? null;
  /** Drawing point (z up) of the pointer, snapped within 10 screen pixels. */
  const snapAt = (clientX: number, clientY: number): SectionSnap | null => {
    const p = toModel(clientX, clientY);
    const m = svg.current?.getScreenCTM();
    if (!p || !m) return null;
    return snapSectionPoint(corners, levels, { x: p.x, y: -p.y }, 10 / m.a);
  };
  const finish = (doubleClick: boolean) => {
    if (!draft || draft.x === null || !heightTool) return;
    // The first click of the finishing double click is no point.
    const points =
      doubleClick && draft.points.length && Date.now() - draft.lastAt < 600
        ? draft.points.slice(0, -1)
        : draft.points;
    setDraft(null);
    if (!points.length) return;
    onAddHeightMarks?.({
      id: `heights-${crypto.randomUUID()}`,
      x: draft.x,
      kind: heightTool.kind,
      points: points.map((p) => ({ x: p.x, z: p.y })),
    });
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => {
    if (!draft && !selectedMarks) return;
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (draft && event.key === "Enter") {
        event.preventDefault();
        finishRef.current(false);
      } else if (draft && event.key === "Escape") setDraft(null);
      else if (!draft && selectedMarks && (event.key === "Delete" || event.key === "Backspace")) {
        // The marks are deleted, not whatever the plan has selected.
        event.preventDefault();
        event.stopImmediatePropagation();
        onRemoveHeightMarks?.(selectedMarks.id);
        setSelected(null);
      }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [draft, selectedMarks, onRemoveHeightMarks]);
  const mark = MARK_PAPER * denominator;
  const markGap = mark * 1.5;
  return (
    <div className="absolute inset-0 flex flex-col bg-workspace">
      <div className="flex items-center gap-2 px-3 pb-1 pt-12 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{section.name}</span>
        <span>Kennung {section.mark}</span>
        <span>· aus dem Modell erzeugt, folgt jeder Änderung</span>
        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setBox(null)}>
          Einpassen
        </Button>
        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={onSettings}>
          Schnitt-Fenster
        </Button>
        {selectedMarks && !drawingMarks && (
          <span role="group" aria-label="Gewählte Höhenkoten" className="flex items-center gap-2">
            <span className="text-foreground">Höhenkoten ({selectedMarks.points.length})</span>
            <select
              aria-label="Art der gewählten Höhenkoten"
              value={selectedMarks.kind}
              onChange={(e) =>
                onUpdateHeightMarks?.(selectedMarks.id, { kind: e.target.value as HeightMarkKind })
              }
              className="rounded border bg-background p-0.5"
            >
              <option value="shell">Rohbau (gefüllt)</option>
              <option value="finish">Fertig (offen)</option>
            </select>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-destructive"
              onClick={() => {
                onRemoveHeightMarks?.(selectedMarks.id);
                setSelected(null);
              }}
            >
              Löschen
            </Button>
          </span>
        )}
      </div>
      {drawing.cuts.length === 0 && drawing.views.length === 0 ? (
        <p role="status" className="m-auto text-sm text-muted-foreground">
          {section.kind === "elevation"
            ? "Diese Ansicht sieht keine Bauteile. Linie vor das Gebäude legen und zum Gebäude blicken."
            : "Die Schnittlinie trifft keine Bauteile. Linie im Grundriss über das Gebäude legen."}
        </p>
      ) : (
        <svg
          ref={svg}
          role="img"
          aria-label={`Schnittzeichnung ${section.name}`}
          className={`min-h-0 flex-1 touch-none select-none ${drawingMarks ? "cursor-crosshair" : ""}`}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          preserveAspectRatio="xMidYMid meet"
          onWheel={(event) => {
            const at = toModel(event.clientX, event.clientY);
            if (!at) return;
            const f = event.deltaY > 0 ? 1.15 : 1 / 1.15;
            setBox({
              x: at.x - (at.x - view.x) * f,
              y: at.y - (at.y - view.y) * f,
              w: view.w * f,
              h: view.h * f,
            });
          }}
          onClick={(event) => {
            if (!drawingMarks) return;
            // The second click of a double click adds nothing; the double click finishes.
            if (event.detail > 1) return;
            const at = snapAt(event.clientX, event.clientY);
            if (!at) return;
            setDraft((now) =>
              !now || now.x === null
                ? { x: at.point.x, points: [], lastAt: Date.now() }
                : { ...now, points: [...now.points, at.point], lastAt: Date.now() },
            );
          }}
          onPointerDown={(event) => {
            // With the height mark tool the left button sets points (click), it never pans.
            if (drawingMarks && event.button === 0) return;
            if (event.button === 0) setSelected(null);
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, box: view };
          }}
          onDoubleClick={() => finish(true)}
          onPointerMove={(event) => {
            const move = moving.current;
            if (move) {
              const p = toModel(event.clientX, event.clientY);
              if (p) setMoveX({ id: move.id, x: move.startX + p.x - move.from });
              return;
            }
            const start = drag.current;
            const m = svg.current?.getScreenCTM();
            if (!start || !m) {
              if (drawingMarks) setHover(snapAt(event.clientX, event.clientY));
              return;
            }
            setBox({
              ...start.box,
              x: start.box.x - (event.clientX - start.x) / m.a,
              y: start.box.y - (event.clientY - start.y) / m.d,
            });
          }}
          onPointerUp={() => {
            const move = moving.current;
            moving.current = null;
            if (move && moveX && Math.abs(moveX.x - move.startX) > 1e-6)
              onUpdateHeightMarks?.(move.id, { x: moveX.x });
            setMoveX(null);
            drag.current = null;
          }}
          onPointerLeave={() => setHover(null)}
        >
          <g aria-label="Ansicht">
            {drawing.views.map((v, i) => (
              <g key={i}>
                <polygon points={svgPoints(v.points)} fill="var(--background)" />
                {v.edges.map(([a, b], j) => (
                  <line
                    key={j}
                    x1={a.x}
                    y1={-a.y}
                    x2={b.x}
                    y2={-b.y}
                    stroke="var(--foreground)"
                    strokeWidth={0.75}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {v.marks?.segments.map(([a, b], j) => (
                  <line
                    key={`m${j}`}
                    x1={a.x}
                    y1={-a.y}
                    x2={b.x}
                    y2={-b.y}
                    stroke="var(--foreground)"
                    strokeWidth={0.6}
                    strokeDasharray={v.marks!.dashed ? "6 4" : undefined}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
            ))}
          </g>
          <g aria-label="Geschosse">
            {drawing.levels.map((level) => (
              <g key={level.storeyId}>
                <line
                  x1={0}
                  y1={-level.elevation}
                  x2={drawing.width}
                  y2={-level.elevation}
                  stroke="var(--muted-foreground)"
                  strokeWidth={0.75}
                  strokeDasharray="8 4"
                  vectorEffect="non-scaling-stroke"
                />
                <HeightMark
                  x={-markGap}
                  z={level.elevation}
                  side="left"
                  kind="shell"
                  size={mark}
                  name={level.name}
                  reach={0}
                />
                <HeightMark
                  x={drawing.width + markGap}
                  z={level.elevation}
                  side="right"
                  kind="shell"
                  size={mark}
                  name={level.name}
                  reach={drawing.width}
                />
              </g>
            ))}
          </g>
          <g aria-label="Geschnittene Bauteile">
            {drawing.cuts.map((cut) => (
              <g key={cut.id}>
                {cut.loops.length > 0 && (
                  <path
                    d={loopPath(cut.loops)}
                    fillRule="evenodd"
                    // Building parts in the cut fill; window and door frames and glass are
                    // outlines over the background (docs/FENSTER_TUEREN.md, FT2).
                    fill={cut.kind === "part" ? paint.fill : "var(--background)"}
                    fillOpacity={cut.kind === "part" ? paint.fillOpacity : 1}
                    stroke="var(--foreground)"
                    strokeWidth={stroke[cut.kind]}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                {cut.open.map((piece, i) => (
                  <polyline
                    key={i}
                    points={svgPoints(piece)}
                    fill="none"
                    stroke="var(--foreground)"
                    strokeWidth={stroke[cut.kind]}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
            ))}
          </g>
          <g aria-label="Rand">
            {[0, drawing.width].map((x) => (
              <line
                key={x}
                x1={x}
                y1={fit.y + 0.5}
                x2={x}
                y2={fit.y + fit.h - 0.5}
                stroke="var(--foreground)"
                strokeWidth={0.75}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
          <g aria-label="Höhenkoten">
            {marks.map((set) => {
              const x = moveX?.id === set.id ? moveX.x : set.x;
              const zs = set.points.map((p) => p.z);
              return (
                <g
                  key={set.id}
                  role="button"
                  aria-label={`Höhenkoten ${set.points.length}`}
                  aria-pressed={selected === set.id}
                  className={drawingMarks ? "" : "cursor-move"}
                  onPointerDown={(event) => {
                    if (drawingMarks || event.button !== 0) return;
                    event.stopPropagation();
                    const p = toModel(event.clientX, event.clientY);
                    if (!p) return;
                    setSelected(set.id);
                    svg.current?.setPointerCapture(event.pointerId);
                    moving.current = { id: set.id, from: p.x, startX: set.x };
                  }}
                >
                  {selected === set.id && (
                    <rect
                      x={x - mark * 2}
                      y={-Math.max(...zs) - mark * 1.5}
                      width={mark * 4}
                      height={Math.max(...zs) - Math.min(...zs) + mark * 3}
                      fill="var(--primary)"
                      fillOpacity={0.12}
                      stroke="var(--primary)"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {set.points.map((p, i) => (
                    <HeightMark
                      key={i}
                      x={x}
                      z={p.z}
                      side={p.x <= x ? "right" : "left"}
                      kind={set.kind}
                      size={mark}
                      reach={p.x}
                    />
                  ))}
                </g>
              );
            })}
          </g>
          {drawingMarks && (
            <g aria-label="Höhenkoten-Vorschau" pointerEvents="none" opacity={0.8}>
              {(draft?.x ?? hover?.point.x) !== undefined && (
                <line
                  x1={draft?.x ?? hover!.point.x}
                  y1={view.y}
                  x2={draft?.x ?? hover!.point.x}
                  y2={view.y + view.h}
                  stroke="var(--primary)"
                  strokeWidth={0.75}
                  strokeDasharray="6 4"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {draft?.x !== null &&
                draft !== null &&
                [...draft.points, ...(hover ? [hover.point] : [])].map((p, i) => (
                  <HeightMark
                    key={i}
                    x={draft.x!}
                    z={p.y}
                    side={p.x <= draft.x! ? "right" : "left"}
                    kind={heightTool.kind}
                    size={mark}
                    reach={p.x}
                  />
                ))}
              {hover && hover.kind !== "free" && (
                <circle
                  cx={hover.point.x}
                  cy={-hover.point.y}
                  r={mark * 0.35}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </g>
          )}
        </svg>
      )}
    </div>
  );
}
