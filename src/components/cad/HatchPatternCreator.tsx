import { useId, useRef, useState } from "react";
import { Undo2, Redo2 } from "lucide-react";
import { useHatchLibraryHistory } from "./useHatchLibraryHistory";
import type { PointerEvent } from "react";
import { FloatingPanel } from "./FloatingPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  appendPatternLine,
  resizePatternCell,
  removePatternLine,
} from "@/application/hatches/pattern-draft";
import type { PatternDraft } from "@/application/hatches/pattern-draft";
import type { Point2 } from "@/geometry/primitives/point";
import { querySnap } from "@/constraints/snapping/engine";
import { angle45Direction } from "@/geometry/projections/direction";

import type { HatchPatternDefinition } from "@/domain/elements/hatch/pattern";
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
  const library = useHatchLibraryHistory(open);
  const records = library.history?.present.records ?? [];
  const [editing, setEditing] = useState<{ id: string; revision: number } | null>(null);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState("");
  const direction = useRef<Point2 | null>(null);
  const patternId = useId();
  const openDraft = (pattern: HatchPatternDefinition, revision: number | null) => {
    setDraft({
      width: pattern.width,
      height: pattern.height,
      lines: structuredClone(pattern.lines),
    });
    setHistory([]);
    setSize({ width: String(pattern.width), height: String(pattern.height) });
    setName(revision === null ? `${pattern.name} Kopie` : pattern.name);
    setEditing(revision === null ? null : { id: pattern.id, revision });
    setSaved("");
    setError("");
    setStart(null);
    setCursor(null);
    direction.current = null;
  };
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
          Linie; Shift hält die Richtung. Gespeicherte Änderungen aktualisieren alle Anwendungen
          desselben Musters im aktiven Projekt und beim Öffnen anderer Projekte.
        </p>
        <section aria-label="Gespeicherte Schraffurmuster" className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Gespeicherte Muster · {records.length}/100</p>
            <div className="flex items-center gap-2">
              <span className="text-xs">Bibliothek</span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Bibliothek rückgängig"
                title="Bibliothek rückgängig · unabhängig vom Projekt-Undo"
                disabled={library.stale || !library.history?.past.length}
                onClick={() => {
                  if (library.undo())
                    setSaved(
                      "Bibliothek rückgängig. Zum Weiterbearbeiten das Muster erneut öffnen.",
                    );
                }}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Bibliothek wiederholen"
                title="Bibliothek wiederholen · unabhängig vom Projekt-Undo"
                disabled={library.stale || !library.history?.future.length}
                onClick={() => {
                  if (library.redo())
                    setSaved(
                      "Bibliothek wiederholt. Zum Weiterbearbeiten das Muster erneut öffnen.",
                    );
                }}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={library.reload}
                title="Aktuellen Stand laden; Bibliotheks-History dieser Sitzung zurücksetzen. Entwurf bleibt erhalten."
              >
                Neu laden
              </Button>
            </div>
          </div>
          {library.error && (
            <p role="alert" className="text-sm text-destructive">
              {library.error}
            </p>
          )}
          <div className="max-h-40 overflow-auto space-y-2">
            {!records.length && !library.error && (
              <p className="text-xs text-muted-foreground">
                Noch keine eigenen Muster gespeichert.
              </p>
            )}
            {records.map(({ definition: pattern, revision }) => (
              <div key={pattern.id} className="flex items-center gap-3 border rounded p-2">
                <PatternPreview pattern={pattern} />
                <span className="min-w-0 flex-1 text-xs truncate">
                  {pattern.name} · Rev. {revision}
                </span>
                <Button
                  variant="outline"
                  disabled={library.stale}
                  onClick={() => openDraft(pattern, revision)}
                >
                  Bearbeiten
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    openDraft(pattern, null);
                  }}
                >
                  Als neuen Entwurf öffnen
                </Button>
              </div>
            ))}
          </div>
        </section>
        <p className="text-xs font-medium">
          {editing ? `Muster bearbeiten · Ausgangsrevision ${editing.revision}` : "Neues Muster"}
        </p>
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
            disabled={library.stale || !library.history}
            onClick={() => {
              try {
                const definition = {
                  id: editing?.id ?? crypto.randomUUID(),
                  name,
                  width: draft.width,
                  height: draft.height,
                  lines: draft.lines,
                };
                const next = editing
                  ? library.edit(editing.id, editing.revision, definition)
                  : library.create(definition);
                if (!next) return;
                const record = next.present.records.find((r) => r.definition.id === definition.id)!;
                setEditing({ id: record.definition.id, revision: record.revision });
                setSaved(
                  "Muster gespeichert. Die Projektdarstellung wird automatisch abgeglichen.",
                );
                setError("");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            {editing ? "Änderungen speichern" : "Muster speichern"}
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
              setEditing(null);
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
            <div className="max-h-28 overflow-auto mt-2 space-y-1" aria-label="Musterlinien">
              {draft.lines.map((line, index) => (
                <div key={index} className="flex items-center justify-between gap-2 text-xs">
                  <span>
                    Linie {index + 1} · {line.start.x.toFixed(3)}, {line.start.y.toFixed(3)} →{" "}
                    {line.end.x.toFixed(3)}, {line.end.y.toFixed(3)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Musterlinie ${index + 1} entfernen`}
                    onClick={() => update(removePatternLine(draft, index))}
                  >
                    Entfernen
                  </Button>
                </div>
              ))}
            </div>
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
