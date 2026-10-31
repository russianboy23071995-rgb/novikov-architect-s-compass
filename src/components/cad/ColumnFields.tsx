import { useState } from "react";
import type { ColumnDefaults } from "@/application/columns/defaults";
import type { Layer } from "@/domain/layers/model";

type NumberField =
  "width" | "depth" | "diameter" | "rotation" | "baseOffset" | "height" | "topOffset";
const LABELS: Record<NumberField, string> = {
  width: "Breite (m)",
  depth: "Tiefe (m)",
  diameter: "Durchmesser (m)",
  rotation: "Drehung (°)",
  baseOffset: "Fuß über OK Rohfußboden (m)",
  height: "Höhe (m)",
  topOffset: "Versatz Oberkante (m)",
};
/** Sizes and the fixed height must be positive; offsets and rotation may be zero or negative. */
const POSITIVE: ReadonlySet<NumberField> = new Set(["width", "depth", "diameter", "height"]);

/**
 * Column fields (docs/STUETZEN.md, P2): the same set in the tool bar, the tool settings window
 * and the element properties. Numbers are taken over when they are valid; the action checks
 * again (for example a top below the foot). With onCommit (element properties) a change is
 * applied when a field is left or a choice is made: one undo step per edit, not per keystroke.
 */
export function ColumnFields({
  value,
  onChange,
  layers,
  label = "Stützenwerkzeug",
  onCommit,
}: {
  value: ColumnDefaults;
  onChange: (value: ColumnDefaults) => void;
  onCommit?: (value: ColumnDefaults) => void;
  layers: readonly Layer[];
  label?: string;
}) {
  const choose = (next: ColumnDefaults) => {
    onChange(next);
    onCommit?.(next);
  };
  const [draft, setDraft] = useState<Partial<Record<NumberField, string>>>({});
  const number = (field: NumberField) => (
    <label key={field} className="text-xs">
      {LABELS[field]}
      <input
        aria-label={`Stütze ${LABELS[field]}`}
        inputMode="decimal"
        value={draft[field] ?? String(value[field])}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft((d) => ({ ...d, [field]: raw }));
          const parsed = Number(raw.replace(",", "."));
          if (raw.trim() !== "" && Number.isFinite(parsed) && (!POSITIVE.has(field) || parsed > 0))
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
  return (
    <section aria-label={label} className="flex flex-wrap items-end gap-3">
      <label className="text-xs">
        Form
        <select
          aria-label="Stützenform"
          value={value.kind}
          onChange={(e) => choose({ ...value, kind: e.target.value as ColumnDefaults["kind"] })}
          className="block rounded border bg-background p-1"
        >
          <option value="rectangle">Rechteckig</option>
          <option value="circle">Rund</option>
        </select>
      </label>
      {value.kind === "rectangle" ? (
        <>
          {number("width")}
          {number("depth")}
          {number("rotation")}
        </>
      ) : (
        number("diameter")
      )}
      <label className="text-xs">
        Höhe
        <select
          aria-label="Stützenhöhe"
          value={value.heightMode}
          onChange={(e) =>
            choose({ ...value, heightMode: e.target.value as ColumnDefaults["heightMode"] })
          }
          className="block rounded border bg-background p-1"
        >
          <option value="storey">Bis Geschoss darüber</option>
          <option value="fixed">Feste Höhe</option>
        </select>
      </label>
      {value.heightMode === "fixed" ? number("height") : number("topOffset")}
      {number("baseOffset")}
      <label className="text-xs">
        Ebene
        <select
          aria-label="Stützenebene"
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
