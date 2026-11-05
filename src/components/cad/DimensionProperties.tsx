import { useState } from "react";
import { updateDimension } from "@/application/dimensions/actions";
import {
  dimensionValues,
  formatDimension,
  type Dimension,
  type DimensionOrientation,
} from "@/domain/elements/dimension/model";
import type { Project } from "@/domain/project/schema";
import type { Selection } from "./bim-view";
import { DimensionStyleFields } from "./DimensionStyleFields";

/** Properties of one dimension chain (docs/MASSKETTE.md): direction and the measured values. */
export function DimensionProperties({
  project,
  dimension,
  selection,
  onChange,
}: {
  project: Project;
  dimension: Dimension;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const [error, setError] = useState("");
  const values = dimensionValues(dimension);
  return (
    <section aria-label="Maßketteneigenschaften" className="flex flex-wrap items-end gap-3">
      <h2 className="text-sm font-semibold">Maßkette</h2>
      <label className="text-xs">
        Richtung
        <select
          aria-label="Richtung der Maßkette"
          value={dimension.orientation}
          onChange={(e) => {
            try {
              onChange(
                updateDimension(project, dimension.id, {
                  orientation: e.target.value as DimensionOrientation,
                }),
                selection,
              );
              setError("");
            } catch (failure) {
              setError(failure instanceof Error ? failure.message : "Nicht möglich.");
            }
          }}
          className="block rounded border bg-background p-1"
        >
          <option value="horizontal">Waagerecht</option>
          <option value="vertical">Senkrecht</option>
        </select>
      </label>
      <DimensionStyleFields
        value={dimension}
        onChange={(style) => {
          try {
            onChange(updateDimension(project, dimension.id, style), selection);
            setError("");
          } catch (failure) {
            setError(failure instanceof Error ? failure.message : "Nicht möglich.");
          }
        }}
      />
      <p className="text-xs text-muted-foreground">
        {values.map((v) => formatDimension(v, dimension.units)).join(" · ")} · gesamt{" "}
        {formatDimension(
          values.reduce((a, b) => a + b, 0),
          dimension.units,
        )}
      </p>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
