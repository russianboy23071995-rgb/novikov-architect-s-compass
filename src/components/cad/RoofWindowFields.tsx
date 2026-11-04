import { useState } from "react";
import type { RoofWindowDefaults } from "@/application/roof-windows/defaults";
import { ROOF_WINDOW_FRAME, ROOF_WINDOW_SIZE } from "@/domain/elements/roof/window";
import type { Layer } from "@/domain/layers/model";

type NumberField = "width" | "length" | "frame";
const LABELS: Record<NumberField, string> = {
  width: "Breite entlang Traufe (m)",
  length: "Länge im Gefälle (m)",
  frame: "Rahmen (m)",
};
const RANGES: Record<NumberField, { min: number; max: number }> = {
  width: ROOF_WINDOW_SIZE,
  length: ROOF_WINDOW_SIZE,
  frame: ROOF_WINDOW_FRAME,
};

/**
 * Roof window fields (docs/DACHFLAECHENFENSTER.md, D2): the same set in the tool bar, the tool
 * settings window and the element properties. Numbers are taken over when they are within
 * their range; the action checks again (fits the roof, frame narrower than half the window).
 * With onCommit (element properties) a change is applied when a field is left or a choice is
 * made: one undo step per edit.
 */
export function RoofWindowFields({
  value,
  onChange,
  layers,
  label = "Dachflächenfensterwerkzeug",
  onCommit,
}: {
  value: RoofWindowDefaults;
  onChange: (value: RoofWindowDefaults) => void;
  onCommit?: (value: RoofWindowDefaults) => void;
  layers: readonly Layer[];
  label?: string;
}) {
  const [draft, setDraft] = useState<Partial<Record<NumberField, string>>>({});
  const number = (field: NumberField) => {
    const range = RANGES[field];
    return (
      <label key={field} className="text-xs">
        {LABELS[field]}
        <input
          aria-label={`Dachflächenfenster ${LABELS[field]}`}
          inputMode="decimal"
          title={`${range.min}–${range.max} m`}
          value={draft[field] ?? String(value[field])}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft((d) => ({ ...d, [field]: raw }));
            const parsed = Number(raw.replace(",", "."));
            if (
              raw.trim() !== "" &&
              Number.isFinite(parsed) &&
              parsed >= range.min &&
              parsed <= range.max
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
      {number("width")}
      {number("length")}
      {number("frame")}
      <label className="text-xs">
        Ebene
        <select
          aria-label="Dachflächenfensterebene"
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
