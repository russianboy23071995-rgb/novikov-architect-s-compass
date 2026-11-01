import { useMemo, useRef, useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { Section } from "@/domain/views/sections";
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
 */
export function SectionDrawingView({
  project,
  section,
  cutFill,
  denominator,
  onSettings,
}: {
  project: Project;
  section: Section;
  cutFill: CutFill;
  /** Plan scale; sizes the height marks like the other paper sizes. */
  denominator: number;
  onSettings: () => void;
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
          className="min-h-0 flex-1 touch-none select-none"
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
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, box: view };
          }}
          onPointerMove={(event) => {
            const start = drag.current;
            const m = svg.current?.getScreenCTM();
            if (!start || !m) return;
            setBox({
              ...start.box,
              x: start.box.x - (event.clientX - start.x) / m.a,
              y: start.box.y - (event.clientY - start.y) / m.d,
            });
          }}
          onPointerUp={() => (drag.current = null)}
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
        </svg>
      )}
    </div>
  );
}
