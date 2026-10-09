import { ColorField } from "./PenColors";
import { PropertyForm } from "./PropertyForm";
import { useHatchPatterns } from "./useHatchPatterns";
import type { HatchPatternDefinition } from "@/domain/elements/hatch/pattern";
import { useState } from "react";
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
        <ColorField
          label="Schraffurfarbe"
          value={value.color}
          onChange={(color) => onChange({ ...value, color })}
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
  const [rotation, setRotation] = useState(hatch.pattern?.rotation ?? 0);
  const [error, setError] = useState("");
  return (
    <PropertyForm
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
              patternRotation: definition ? rotation : undefined,
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
      <HatchRotationField value={rotation} onChange={setRotation} enabled={!!definition} />
      <HatchFillFields value={fill} onChange={setFill} />
      <HatchPaintFields label="Hintergrund" value={background} onChange={setBackground} />
      <HatchPaintFields label="Kontur" value={contour} onChange={setContour} />
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </PropertyForm>
  );
}

export function HatchRotationField({
  value,
  onChange,
  enabled,
}: {
  value: number;
  onChange: (value: number) => void;
  enabled: boolean;
}) {
  return (
    <label
      className="text-xs"
      title="Dreht nur das Muster um seinen Ursprung; positive Winkel gegen den Uhrzeigersinn."
    >
      Musterwinkel (°)
      <input
        aria-label="Schraffur Musterwinkel"
        type="number"
        min={0}
        max={360}
        step="any"
        required
        disabled={!enabled}
        className="block h-8 w-24 rounded border bg-background px-2"
        value={Number.isNaN(value) ? "" : value}
        onChange={(event) => onChange(event.target.valueAsNumber)}
      />
    </label>
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
        <ColorField
          label={`Schraffur ${label}farbe`}
          value={value.color}
          disabled={!value.visible}
          onChange={(color) => onChange({ ...value, color })}
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
