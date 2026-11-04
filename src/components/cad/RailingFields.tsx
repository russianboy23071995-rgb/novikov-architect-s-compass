import { useState } from "react";
import type { RailingDefaults } from "@/application/railings/defaults";
import {
  RAILING_HEIGHT,
  RAILING_INFILLS,
  RAILING_INFILL_LABELS,
  RAILING_POST_SPACING,
  type RailingInfill,
} from "@/domain/elements/railing/model";
import type { Layer } from "@/domain/layers/model";

type NumberField = "height" | "postSpacing" | "baseOffset";
const LABELS: Record<NumberField, string> = {
  height: "Höhe (m)",
  postSpacing: "Pfostenabstand max. (m)",
  baseOffset: "Fuß über OK Rohfußboden (m)",
};
/** Allowed ranges; the foot may be anywhere. */
const RANGES: Partial<Record<NumberField, { min: number; max: number }>> = {
  height: RAILING_HEIGHT,
  postSpacing: RAILING_POST_SPACING,
};

/**
 * Railing fields (docs/GELAENDER.md, G2): the same set in the tool bar, the tool settings window
 * and the element properties. Numbers are taken over when they are valid; the action checks
 * again. With onCommit (element properties) a change is applied when a field is left or a choice
 * is made: one undo step per edit, not per keystroke.
 */
export function RailingFields({
  value,
  onChange,
  layers,
  label = "Geländerwerkzeug",
  onCommit,
}: {
  value: RailingDefaults;
  onChange: (value: RailingDefaults) => void;
  onCommit?: (value: RailingDefaults) => void;
  layers: readonly Layer[];
  label?: string;
}) {
  const choose = (next: RailingDefaults) => {
    onChange(next);
    onCommit?.(next);
  };
  const [draft, setDraft] = useState<Partial<Record<NumberField, string>>>({});
  const number = (field: NumberField) => {
    const range = RANGES[field];
    return (
      <label key={field} className="text-xs">
        {LABELS[field]}
        <input
          aria-label={`Geländer ${LABELS[field]}`}
          inputMode="decimal"
          title={range ? `${range.min}–${range.max} m` : undefined}
          value={draft[field] ?? String(value[field])}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft((d) => ({ ...d, [field]: raw }));
            const parsed = Number(raw.replace(",", "."));
            if (
              raw.trim() !== "" &&
              Number.isFinite(parsed) &&
              (!range || (parsed >= range.min && parsed <= range.max))
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
          className="block w-20 rounded border bg-background p-1"
        />
      </label>
    );
  };
  return (
    <section aria-label={label} className="flex flex-wrap items-end gap-3">
      {number("height")}
      <label className="text-xs">
        Füllung
        <select
          aria-label="Geländerfüllung"
          value={value.infill}
          onChange={(e) => choose({ ...value, infill: e.target.value as RailingInfill })}
          className="block rounded border bg-background p-1"
        >
          {RAILING_INFILLS.map((infill) => (
            <option key={infill} value={infill}>
              {RAILING_INFILL_LABELS[infill]}
            </option>
          ))}
        </select>
      </label>
      {number("postSpacing")}
      {number("baseOffset")}
      <label className="text-xs">
        Ebene
        <select
          aria-label="Geländerebene"
          value={value.layerId}
          onChange={(e) => choose({ ...value, layerId: e.target.value })}
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
