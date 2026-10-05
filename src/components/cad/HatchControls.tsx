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
  const [fill, setFill] = useState(hatch.fill);
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
              id: hatch.id,
              changes: { fill },
            }),
            { kind: "hatch", id: hatch.id },
          );
          setError("");
        } catch {
          setError("Farbe und Deckkraft zwischen 0 und 100 % prüfen.");
        }
      }}
    >
      <span className="text-xs">Schraffur · {hatch.points.length} Eckpunkte</span>
      <HatchFillFields value={fill} onChange={setFill} />
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
