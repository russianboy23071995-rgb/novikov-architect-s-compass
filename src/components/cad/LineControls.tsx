import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateLine } from "@/lib/bim/model";
import type { DrawingLine, Project } from "@/lib/bim/model";
import type { LineAppearance } from "@/lib/bim/lines";
import { lineLength } from "@/lib/bim/lines";
import type { Selection } from "./bim-view";

export function LineStyleFields({
  value,
  onChange,
}: {
  value: LineAppearance;
  onChange: (value: LineAppearance) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2 text-xs">
      <label>
        Farbe
        <select
          aria-label="Linienfarbe"
          className="block rounded border bg-background p-1"
          value={value.color}
          onChange={(e) => onChange({ ...value, color: e.target.value })}
        >
          {Object.entries({
            "#334155": "Graphit",
            "#000000": "Schwarz",
            "#dc2626": "Rot",
            "#2563eb": "Blau",
            "#16a34a": "Grün",
            "#d97706": "Orange",
          }).map(([color, name]) => (
            <option key={color} value={color}>
              {name}
            </option>
          ))}
          {!["#334155", "#000000", "#dc2626", "#2563eb", "#16a34a", "#d97706"].includes(
            value.color,
          ) && <option value={value.color}>{value.color}</option>}
        </select>
      </label>
      <label>
        Strichstärke (mm)
        <input
          aria-label="Strichstärke (mm)"
          className="block w-20 rounded border bg-background p-1"
          type="number"
          min="0.05"
          max="2"
          step="0.05"
          value={Number.isNaN(value.penWidth) ? "" : value.penWidth}
          onChange={(e) => onChange({ ...value, penWidth: e.target.valueAsNumber })}
        />
      </label>
      <label>
        Strichart
        <select
          aria-label="Strichart"
          className="block rounded border bg-background p-1"
          value={value.style}
          onChange={(e) => onChange({ ...value, style: e.target.value as DrawingLine["style"] })}
        >
          <option value="solid">Durchgezogen</option>
          <option value="dashed">Gestrichelt</option>
          <option value="break">Abbruchlinie</option>
        </select>
      </label>
    </div>
  );
}
export function LineInspector({
  project,
  line,
  onChange,
}: {
  project: Project;
  line: DrawingLine;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const [value, setValue] = useState<LineAppearance>({
    color: line.color,
    penWidth: line.penWidth,
    style: line.style,
  });
  const [error, setError] = useState("");
  return (
    <section className="border-t p-3" aria-label="Linieneigenschaften">
      <h2 className="text-sm font-semibold">{line.kind === "line" ? "Linie" : "Polylinie"}</h2>
      <p className="my-2 break-all text-[10px]">{line.id}</p>
      <p className="mb-2 text-xs">
        {lineLength(line).toFixed(2)} m · {line.points.length} Punkte · nur 2D
      </p>
      <LineStyleFields value={value} onChange={setValue} />
      <Button
        className="mt-3"
        size="sm"
        onClick={() => {
          try {
            onChange(updateLine(project, line.id, value), { kind: "line", id: line.id });
            setError("");
          } catch {
            setError("Strichstärke muss zwischen 0,05 und 2 mm liegen.");
          }
        }}
      >
        Linienstil übernehmen
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
