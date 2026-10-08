import { useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { FloatingPanel } from "./FloatingPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appendPatternLine, resizePatternCell } from "@/application/hatches/pattern-draft";
import type { PatternDraft } from "@/application/hatches/pattern-draft";
import type { Point2 } from "@/geometry/primitives/point";
import { querySnap } from "@/constraints/snapping/engine";
import { angle45Direction } from "@/geometry/projections/direction";

/** Isolated local draft. No project state, assets or BIM history are changed. */
export function HatchPatternCreator({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState<PatternDraft>({ width: 1, height: 1, lines: [] });
  const [history, setHistory] = useState<PatternDraft[]>([]);
  const [size, setSize] = useState({ width: "1", height: "1" });
  const [start, setStart] = useState<Point2 | null>(null);
  const [cursor, setCursor] = useState<Point2 | null>(null);
  const [error, setError] = useState("");
  const direction = useRef<Point2 | null>(null);
  const patternId = useId();
  const update = (next: PatternDraft) => {
    setHistory((h) => [...h, draft]);
    setDraft(next);
    setError("");
    setStart(null);
    setCursor(null);
    direction.current = null;
  };
  const point = (event: PointerEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const raw = {
      x: Math.max(0, Math.min(draft.width, local.x)),
      y: Math.max(0, Math.min(draft.height, local.y)),
    };
    if (event.shiftKey && start && !direction.current)
      direction.current = angle45Direction(raw, start).direction;
    if (!event.shiftKey) direction.current = null;
    const references = [
      { x: 0, y: 0 },
      { x: draft.width, y: 0 },
      { x: 0, y: draft.height },
      { x: draft.width, y: draft.height },
      ...draft.lines.flatMap((line) => [line.start, line.end]),
    ].map((p, i) => ({ point: p, entityId: `draft-${i}`, feature: "endpoint" }));
    return querySnap(raw, {
      references,
      pixelsPerMetre: Math.hypot(matrix.a, matrix.b),
      enabled: true,
      endpointRadiusPx: 10,
      gridSpacing: Math.min(draft.width, draft.height) / 10,
      orthoOrigin: null,
      angleOrigin: event.shiftKey ? start : null,
      angleDirection: direction.current,
    }).point;
  };
  return (
    <FloatingPanel
      open={open}
      title="Schraffurenverwaltung · Muster-Creator"
      width={900}
      height={650}
      onClose={() => {
        setStart(null);
        setCursor(null);
        direction.current = null;
        onOpenChange(false);
      }}
    >
      <div className="min-h-0 flex-1 overflow-auto space-y-4 p-4">
        <p className="text-xs text-muted-foreground">
          Lokaler Entwurf in Metern. Zwei Klicks zeichnen eine Linie; Shift hält die Richtung. Noch
          keine Speicherung oder Anwendung auf Projektkonturen.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          {(["width", "height"] as const).map((key) => (
            <label key={key} className="text-xs">
              {key === "width" ? "Zellbreite (m)" : "Zellhöhe (m)"}
              <Input
                className="w-28"
                value={size[key]}
                onChange={(e) => setSize({ ...size, [key]: e.target.value })}
              />
            </label>
          ))}
          <Button
            onClick={() => {
              try {
                update(
                  resizePatternCell(
                    draft,
                    Number(size.width.replace(",", ".")),
                    Number(size.height.replace(",", ".")),
                  ),
                );
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Zelle anpassen
          </Button>
          <Button
            disabled={!history.length}
            onClick={() => {
              const previous = history.at(-1)!;
              setDraft(previous);
              setSize({ width: String(previous.width), height: String(previous.height) });
              setHistory(history.slice(0, -1));
              setStart(null);
              setCursor(null);
              setError("");
              direction.current = null;
            }}
          >
            Entwurf rückgängig
          </Button>
          <Button
            onClick={() => {
              setDraft({ width: 1, height: 1, lines: [] });
              setHistory([]);
              setSize({ width: "1", height: "1" });
              setStart(null);
              setCursor(null);
              setError("");
              direction.current = null;
            }}
          >
            Neuer Entwurf
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs mb-2">Zeichenzelle · {draft.lines.length}/256 Linien</p>
            <svg
              aria-label="Musterlinien zeichnen"
              tabIndex={0}
              viewBox={`0 0 ${draft.width} ${draft.height}`}
              className="w-full h-80 border rounded bg-white/30 touch-none"
              onKeyDown={(e) => {
                if (e.key === "Escape" && start) {
                  e.preventDefault();
                  e.stopPropagation();
                  setStart(null);
                  setCursor(null);
                  direction.current = null;
                }
                if (e.key === "Shift" && !e.repeat) direction.current = null;
              }}
              onKeyUp={(e) => {
                if (e.key === "Shift") direction.current = null;
              }}
              onPointerMove={(e) => setCursor(point(e))}
              onPointerLeave={() => setCursor(null)}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.currentTarget.focus();
                const p = point(e);
                if (!p) return;
                if (!start) {
                  setStart(p);
                  direction.current = null;
                } else {
                  try {
                    update(appendPatternLine(draft, { start, end: p }));
                  } catch (error) {
                    setError((error as Error).message);
                  }
                }
              }}
            >
              <defs>
                <pattern
                  id={`${patternId}-grid`}
                  width={draft.width / 10}
                  height={draft.height / 10}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${draft.width / 10} 0 H 0 V ${draft.height / 10}`}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </pattern>
              </defs>
              <rect width={draft.width} height={draft.height} fill={`url(#${patternId}-grid)`} />
              {draft.lines.map((line, i) => (
                <line
                  key={i}
                  x1={line.start.x}
                  y1={line.start.y}
                  x2={line.end.x}
                  y2={line.end.y}
                  stroke="#334155"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {start && cursor && (
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={cursor.x}
                  y2={cursor.y}
                  stroke="#22b8c5"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {cursor && (
                <circle
                  cx={cursor.x}
                  cy={cursor.y}
                  r={Math.min(draft.width, draft.height) / 65}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
          </div>
          <div>
            <p className="text-xs mb-2">Wiederholung · 3 × 3 Zellen</p>
            <svg
              aria-label="Wiederholungsvorschau"
              viewBox={`0 0 ${draft.width * 3} ${draft.height * 3}`}
              className="w-full h-80 border rounded bg-white/30"
            >
              <defs>
                <pattern
                  id={`${patternId}-tile`}
                  width={draft.width}
                  height={draft.height}
                  patternUnits="userSpaceOnUse"
                >
                  {draft.lines.map((line, i) => (
                    <line
                      key={i}
                      x1={line.start.x}
                      y1={line.start.y}
                      x2={line.end.x}
                      y2={line.end.y}
                      stroke="#334155"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </pattern>
              </defs>
              <rect
                width={draft.width * 3}
                height={draft.height * 3}
                fill={`url(#${patternId}-tile)`}
              />
            </svg>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </FloatingPanel>
  );
}
