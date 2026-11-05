import { useState } from "react";
import type { TerrainDefaults } from "@/application/terrain/actions";
import type { Layer } from "@/domain/layers/model";

type NumberField = "height" | "depth" | "contourStep";
const LABELS: Record<NumberField, string> = {
  height: "Höhe neuer Punkte (m)",
  depth: "Körpertiefe (m)",
  contourStep: "Höhenlinien alle (m)",
};
const POSITIVE: ReadonlySet<NumberField> = new Set(["depth", "contourStep"]);

/**
 * Terrain fields (docs/GELAENDE.md, G2): the same set in the tool bar, the tool settings window
 * and the element window. With onCommit a change applies when a field is left: one undo step.
 */
export function TerrainFields({
  value,
  onChange,
  onCommit,
  layers,
  fields = ["height", "depth", "contourStep"],
  label = "Geländewerkzeug",
}: {
  value: TerrainDefaults;
  onChange: (value: TerrainDefaults) => void;
  onCommit?: (value: TerrainDefaults) => void;
  layers: readonly Layer[];
  fields?: readonly NumberField[];
  label?: string;
}) {
  const [draft, setDraft] = useState<Partial<Record<NumberField, string>>>({});
  return (
    <section aria-label={label} className="flex flex-wrap items-end gap-3">
      {fields.map((field) => (
        <label key={field} className="text-xs">
          {LABELS[field]}
          <input
            aria-label={`Gelände ${LABELS[field]}`}
            inputMode="decimal"
            value={draft[field] ?? String(value[field])}
            onChange={(e) => {
              const raw = e.target.value;
              setDraft((d) => ({ ...d, [field]: raw }));
              const parsed = Number(raw.replace(",", "."));
              if (
                raw.trim() !== "" &&
                Number.isFinite(parsed) &&
                (!POSITIVE.has(field) || parsed > 0)
              )
                onChange({ ...value, [field]: parsed });
            }}
            onBlur={() => {
              setDraft((d) => ({ ...d, [field]: undefined }));
              onCommit?.(value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCommit?.(value);
            }}
            className="block w-24 rounded border bg-background p-1"
          />
        </label>
      ))}
      <label className="text-xs">
        Farbe
        <input
          type="color"
          aria-label="Geländefarbe"
          value={value.color}
          onChange={(e) => onChange({ ...value, color: e.target.value })}
          onBlur={() => onCommit?.(value)}
          className="block h-7 w-10 rounded border bg-background p-0.5"
        />
      </label>
      <label className="text-xs">
        Ebene
        <select
          aria-label="Geländeebene"
          value={value.layerId}
          onChange={(e) => {
            const next = { ...value, layerId: e.target.value };
            onChange(next);
            onCommit?.(next);
          }}
          className="block rounded border bg-background p-1"
        >
          {layers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
