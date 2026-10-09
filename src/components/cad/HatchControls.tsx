import { useHatchPatterns } from "./useHatchPatterns";
import type { HatchPatternDefinition } from "@/domain/elements/hatch/pattern";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { previewHatch } from "@/application/hatches/actions";
import type { Hatch } from "@/domain/elements/hatch/model";
import type { Project } from "@/domain/project/schema";
import type { Selection } from "./bim-view";

export function HatchFillFields({
  value,
  onChange,
}: {
  value: Hatch["fill"];
  onChange: (fill: Hatch["fill"]) => void;
}) {
  return (
    <>
      <label className="text-xs">
        Füllfarbe
        <input
          aria-label="Schraffurfarbe"
          type="color"
          className="block h-8 w-16 rounded border"
          value={value.color}
          onInput={(e) => onChange({ ...value, color: e.currentTarget.value })}
          onChange={(e) => onChange({ ...value, color: e.target.value })}
        />
      </label>
      <label className="text-xs">
        Deckkraft (%)
        <input
          aria-label="Schraffurdeckkraft"
          type="number"
          min={0}
          max={100}
          step={1}
          required
          className="block h-8 w-24 rounded border bg-background px-2"
          value={Number.isNaN(value.opacity) ? "" : Math.round(value.opacity * 100)}
          onChange={(e) =>
            onChange({
              ...value,
              opacity: e.target.value === "" ? NaN : Number(e.target.value) / 100,
            })
          }
        />
      </label>
    </>
  );
}
export function HatchInspector({
  project,
  hatch,
  onChange,
}: {
  project: Project;
  hatch: Hatch;
  onChange: (p: Project, s: Selection) => void;
}) {
  const [definition, setDefinition] = useState<HatchPatternDefinition | null | undefined>(() =>
    hatch.pattern ? project.hatchPatterns.find((p) => p.id === hatch.pattern!.patternId) : null,
  );
  const [fill, setFill] = useState(hatch.fill);
  const [background, setBackground] = useState(hatch.background);
  const [contour, setContour] = useState(hatch.contour);
  const [error, setError] = useState("");
  return (
    <form
      aria-label="Schraffureigenschaften"
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          onChange(
            previewHatch(project, project, {
              projectId: project.id,
              kind: "update",
              patternDefinition: definition ?? null,
              id: hatch.id,
              changes: { fill, background, contour },
            }),
            { kind: "hatch", id: hatch.id },
          );
          setError("");
        } catch (error) {
          setError((error as Error).message);
        }
      }}
    >
      <span className="text-xs">Schraffur · {hatch.points.length} Eckpunkte</span>
      <HatchPatternFields project={project} value={definition} onChange={setDefinition} />
      <HatchFillFields value={fill} onChange={setFill} />
      <HatchPaintFields label="Hintergrund" value={background} onChange={setBackground} />
      <HatchPaintFields label="Kontur" value={contour} onChange={setContour} />
      <Button size="sm" type="submit">
        Übernehmen
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

export function HatchPaintFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Hatch["background"];
  onChange: (value: Hatch["background"]) => void;
}) {
  return (
    <fieldset
      className="flex items-end gap-2"
      title={
        label === "Hintergrund"
          ? "Hinter der Füllung; bei 100 % Fülldeckkraft verdeckt."
          : "Durchgezogene Kontur; Linienarten folgen später."
      }
    >
      <label className="text-xs flex h-8 items-center gap-1">
        <input
          type="checkbox"
          aria-label={`Schraffur ${label} anzeigen`}
          checked={value.visible}
          onChange={(e) => onChange({ ...value, visible: e.target.checked })}
        />
        {label}
      </label>
      <label className="text-xs">
        Farbe
        <input
          type="color"
          aria-label={`Schraffur ${label}farbe`}
          value={value.color}
          disabled={!value.visible}
          className="block h-8 w-12 rounded border"
          onInput={(e) => onChange({ ...value, color: e.currentTarget.value })}
          onChange={(e) => onChange({ ...value, color: e.target.value })}
        />
      </label>
    </fieldset>
  );
}

export function HatchPatternFields({
  project,
  value,
  onChange,
}: {
  project: Project;
  value: HatchPatternDefinition | null | undefined;
  onChange: (value: HatchPatternDefinition | null) => void;
}) {
  const library = useHatchPatterns();
  const patterns = new Map(library.patterns.map((p) => [p.id, p]));
  for (const p of project.hatchPatterns) patterns.set(p.id, p);
  if (value && !patterns.has(value.id)) patterns.set(value.id, value);
  return (
    <label className="text-xs">
      Muster · Modellmaß
      <select
        aria-label="Schraffurmuster"
        className="block h-8 rounded border bg-background max-w-48"
        value={value?.id ?? ""}
        onChange={(e) => onChange(patterns.get(e.target.value) ?? null)}
      >
        <option value="">Vollfläche</option>
        {[...patterns.values()].map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} · {p.width} × {p.height} m
          </option>
        ))}
      </select>
      {library.error && <span role="alert">{library.error}</span>}
    </label>
  );
}
