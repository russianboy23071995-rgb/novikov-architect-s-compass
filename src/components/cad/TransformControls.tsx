import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/bim/model";
import {
  editablePoints,
  moveElement,
  moveElementPoint,
  stretchEndpoint,
  moveWindowAlongWall,
  parseMetres,
} from "@/lib/bim/transforms";
import type { Selection } from "./bim-view";

export function TransformControls({
  project,
  selection,
  onChange,
}: {
  project: Project;
  selection: NonNullable<Selection>;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const [action, setAction] = useState("move");
  const [index, setIndex] = useState(0);
  const [endpoint, setEndpoint] = useState("end");
  const [error, setError] = useState("");
  const points =
    selection.kind === "window"
      ? []
      : editablePoints(project, { kind: selection.kind, id: selection.id });
  const point = points[index];
  const closed =
    points.length > 2 && points[0]!.x === points.at(-1)!.x && points[0]!.y === points.at(-1)!.y;
  return (
    <section
      aria-label="Geometrie bearbeiten"
      className="mt-2 flex flex-wrap items-end gap-2 border-t pt-2 text-xs"
    >
      <label>
        Aktion
        <select
          aria-label="Geometrieaktion"
          className="block rounded border bg-background p-1"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setError("");
          }}
        >
          <option value="move">
            {selection.kind === "window" ? "Entlang Wand bewegen" : "Element bewegen"}
          </option>
          {selection.kind !== "window" && <option value="point">Punkt versetzen</option>}
          {selection.kind !== "window" && !closed && (
            <option value="stretch">Endpunkt strecken</option>
          )}
        </select>
      </label>
      {action === "point" && (
        <label>
          Punkt
          <select
            aria-label="Bearbeitungspunkt"
            className="block rounded border bg-background p-1"
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
          >
            {points.map((_, i) => (
              <option key={i} value={i}>
                {i === 0 ? "Anfang" : i === points.length - 1 ? "Ende" : `Punkt ${i + 1}`}
              </option>
            ))}
          </select>
        </label>
      )}
      <form
        key={`${action}:${index}:${endpoint}`}
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const number = (name: string) => parseMetres(String(data.get(name) ?? ""));
          try {
            const next =
              selection.kind === "window"
                ? moveWindowAlongWall(project, selection.id, number("distance"))
                : action === "move"
                  ? moveElement(
                      project,
                      { kind: selection.kind, id: selection.id },
                      { x: number("x"), y: number("y") },
                    )
                  : action === "point"
                    ? moveElementPoint(project, { kind: selection.kind, id: selection.id }, index, {
                        x: number("x"),
                        y: number("y"),
                      })
                    : stretchEndpoint(
                        project,
                        { kind: selection.kind, id: selection.id },
                        data.get("endpoint") === "start" ? "start" : "end",
                        number("length"),
                      );
            onChange(next, selection);
            setError("");
          } catch (err) {
            setError(
              err instanceof Error && !err.message.startsWith("[")
                ? err.message
                : "Ungültige Geometrie. Maße prüfen; Fenster müssen vollständig in ihrer Wand bleiben.",
            );
          }
        }}
      >
        {selection.kind === "window" ? (
          <Coordinate name="distance" label="Abstand entlang Wand (m)" value={0} />
        ) : action === "stretch" ? (
          <>
            <label>
              Endpunkt
              <select
                name="endpoint"
                aria-label="Streck-Endpunkt"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="block rounded border bg-background p-1"
              >
                <option value="end">Ende</option>
                <option value="start">Anfang</option>
              </select>
            </label>
            <Coordinate
              name="length"
              label="Neue Segmentlänge (m)"
              value={
                endpoint === "start"
                  ? Math.hypot(points[0]!.x - points[1]!.x, points[0]!.y - points[1]!.y)
                  : Math.hypot(
                      points.at(-1)!.x - points.at(-2)!.x,
                      points.at(-1)!.y - points.at(-2)!.y,
                    )
              }
            />
          </>
        ) : (
          <>
            <Coordinate
              name="x"
              label={action === "move" ? "Verschiebung X (m)" : "Punkt X (m)"}
              value={action === "move" ? 0 : point!.x}
            />
            <Coordinate
              name="y"
              label={action === "move" ? "Verschiebung Y (m)" : "Punkt Y (m)"}
              value={action === "move" ? 0 : point!.y}
            />
          </>
        )}
        <Button size="sm" type="submit">
          Geometrie übernehmen
        </Button>
      </form>
      <span className="text-muted-foreground">
        {action === "point"
          ? "Absolute Modellkoordinaten; +Y nach oben."
          : action === "stretch"
            ? "Gewählter Endpunkt bleibt auf der bisherigen Flucht."
            : selection.kind === "window"
              ? "Positiv: Richtung Wandende; negativ: Richtung Wandanfang."
              : "Relative Verschiebung; +X rechts, +Y oben."}
      </span>
      {error && (
        <p role="alert" className="basis-full text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
function Coordinate({ name, label, value }: { name: string; label: string; value: number }) {
  return (
    <label>
      {label}
      <input
        name={name}
        aria-label={label}
        type="text"
        inputMode="decimal"
        required
        defaultValue={String(value).replace(".", ",")}
        className="block w-28 rounded border bg-background p-1"
      />
    </label>
  );
}
