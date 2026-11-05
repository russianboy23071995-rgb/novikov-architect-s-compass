import { useState } from "react";
import type { ObjectToolDefaults } from "@/application/objects/defaults";
import { objectDefinition } from "@/domain/elements/object/catalog";
import type { Layer } from "@/domain/layers/model";

type NumberField = "width" | "depth" | "height" | "rotation" | "baseOffset";
const LABELS: Record<NumberField, string> = {
  width: "Breite (m)",
  depth: "Tiefe (m)",
  height: "Höhe (m)",
  rotation: "Drehung (°)",
  baseOffset: "Über Boden (m)",
};
const POSITIVE: ReadonlySet<NumberField> = new Set(["width", "depth", "height"]);

/**
 * Object fields (docs/OBJEKTBIBLIOTHEK.md, M1): the same set in the tool bar, the library
 * window, the tool settings window and the element properties. With onCommit (element
 * properties) a change applies when a field is left: one undo step per edit, not per keystroke.
 */
export function ObjectFields({
  value,
  onChange,
  onCommit,
  onCatalog,
  layers,
  label = "Bibliothekswerkzeug",
}: {
  value: ObjectToolDefaults;
  onChange: (value: ObjectToolDefaults) => void;
  onCommit?: (value: ObjectToolDefaults) => void;
  /** Opens the library window; without it the surrounding window names the object. */
  onCatalog?: () => void;
  layers: readonly Layer[];
  label?: string;
}) {
  const choose = (next: ObjectToolDefaults) => {
    onChange(next);
    onCommit?.(next);
  };
  const [draft, setDraft] = useState<Partial<Record<NumberField, string>>>({});
  const number = (field: NumberField) => (
    <label key={field} className="text-xs">
      {LABELS[field]}
      <input
        aria-label={`Objekt ${LABELS[field]}`}
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
      {onCatalog && (
        <button
          type="button"
          onClick={onCatalog}
          className="rounded border bg-background px-2 py-1 text-xs"
        >
          {objectDefinition(value.catalogId).name} · Katalog …
        </button>
      )}
      {number("width")}
      {number("depth")}
      {number("height")}
      {number("rotation")}
      {number("baseOffset")}
      <label className="flex items-center gap-1 py-1 text-xs">
        <input
          type="checkbox"
          aria-label="Objekt gespiegelt"
          checked={value.mirrored}
          onChange={(e) => choose({ ...value, mirrored: e.target.checked })}
        />
        Gespiegelt
      </label>
      <label className="text-xs">
        Ebene
        <select
          aria-label="Objektebene"
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
