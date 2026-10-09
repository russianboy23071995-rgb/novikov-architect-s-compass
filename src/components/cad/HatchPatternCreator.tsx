import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { FloatingPanel } from "./FloatingPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appendPatternLine, resizePatternCell } from "@/application/hatches/pattern-draft";
import type { PatternDraft } from "@/application/hatches/pattern-draft";
import type { Point2 } from "@/geometry/primitives/point";
import { querySnap } from "@/constraints/snapping/engine";
import { angle45Direction } from "@/geometry/projections/direction";

import { loadHatchPatterns, saveHatchPattern } from "@/application/hatches/pattern-library";
import type { HatchPatternDefinition } from "@/domain/elements/hatch/pattern";
import { browserHatchPatternStorage as storage } from "@/interop/hatch-pattern-storage";
function PatternPreview({ pattern }: { pattern: PatternDraft }) {
  return (
    <svg
      aria-label="Mustervorschau"
      viewBox={`0 0 ${pattern.width} ${pattern.height}`}
      className="h-14 w-24 shrink-0 border rounded bg-white/30"
    >
      <path
        d={pattern.lines
          .map((line) => `M ${line.start.x} ${line.start.y} L ${line.end.x} ${line.end.y}`)
          .join(" ")}
        fill="none"
        stroke="#334155"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
/** Transient drawing draft; persistent library actions are independent of BIM history. */
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
  const [patterns, setPatterns] = useState<HatchPatternDefinition[]>([]);
  const [libraryError, setLibraryError] = useState("");
  const [name, setName] = useState("");
  const [saved, setSaved] = useState("");
  const reload = () => {
    try {
      setPatterns(loadHatchPatterns(storage));
      setLibraryError("");
    } catch {
      setLibraryError(
        "Bibliothek konnte nicht geladen werden. Vorhandene Daten werden nicht überschrieben.",
      );
    }
  };
  useEffect(() => {
    if (open) reload();
  }, [open]);
  const direction = useRef<Point2 | null>(null);
  const patternId = useId();
  const update = (next: PatternDraft) => {
    setHistory((h) => [...h, draft]);
    setDraft(next);
    setError("");
    setSaved("");
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
          Musterbibliothek für alle Projekte in diesem Browserprofil. Zwei Klicks zeichnen eine
          Linie; Shift hält die Richtung. Anwendung auf Projektkonturen folgt separat.
        </p>
        <section aria-label="Gespeicherte Schraffurmuster" className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Gespeicherte Muster · {patterns.length}/100</p>
            <Button variant="outline" onClick={reload}>
              Neu laden
            </Button>
          </div>
          {libraryError && (
            <p role="alert" className="text-sm text-destructive">
              {libraryError}
            </p>
          )}
          <div className="max-h-40 overflow-auto space-y-2">
            {!patterns.length && !libraryError && (
              <p className="text-xs text-muted-foreground">
                Noch keine eigenen Muster gespeichert.
              </p>
            )}
            {patterns.map((pattern) => (
              <div key={pattern.id} className="flex items-center gap-3 border rounded p-2">
                <PatternPreview pattern={pattern} />
                <span className="min-w-0 flex-1 text-xs truncate">{pattern.name}</span>
                <Button
                  variant="outline"
                  onClick={() => {
                    update(structuredClone(pattern));
                    setSize({ width: String(pattern.width), height: String(pattern.height) });
                    setName(`${pattern.name} Kopie`);
                    setSaved("");
                  }}
                >
                  Als neuen Entwurf öffnen
                </Button>
              </div>
            ))}
          </div>
        </section>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs">
            Mustername
            <Input
              className="w-48"
              value={name}
              maxLength={80}
              onChange={(e) => {
                setName(e.target.value);
                setSaved("");
              }}
            />
          </label>
          <Button
            disabled={!!libraryError}
            onClick={() => {
              try {
                const next = saveHatchPattern(storage, {
                  id: crypto.randomUUID(),
                  name,
                  width: draft.width,
                  height: draft.height,
                  lines: draft.lines,
                });
                setPatterns(next);
                setSaved("Muster gespeichert. Erneutes Speichern erstellt eine neue Definition.");
                setError("");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Muster speichern
          </Button>
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
              setName("");
              setSaved("");
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
        {saved && (
          <p role="status" className="text-xs">
            {saved}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </FloatingPanel>
  );
}
