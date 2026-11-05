import { useState } from "react";
import {
  TEXT_FONTS,
  TEXT_FONT_LABELS,
  convertTextSize,
  type PlanText,
} from "@/domain/elements/text/model";
import type { Layer } from "@/domain/layers/model";
import { TextDecorationFields } from "./TextDecorationFields";

/** Text settings without position and content: tool defaults and element properties. */
export type TextDefaults = Omit<PlanText, "id" | "position" | "content">;

/**
 * Text fields (docs/TEXT.md, T1): font, size in paper mm or model m, alignment, anchor,
 * rotation, colour, layer – the same set in the bar, the settings window and the properties.
 * With onCommit a typed number is applied when the field is left (one undo step per edit).
 */
export function TextFields({
  value,
  onChange,
  onCommit,
  layers,
  denominator,
}: {
  value: TextDefaults;
  onChange: (value: TextDefaults) => void;
  onCommit?: (value: TextDefaults) => void;
  layers: readonly Layer[];
  /** Output scale 1:denominator: switching paper/model keeps the visible size. */
  denominator: number;
}) {
  const [draft, setDraft] = useState<{ size?: string; rotation?: string }>({});
  const choose = (next: TextDefaults) => {
    onChange(next);
    onCommit?.(next);
  };
  const number = (field: "size" | "rotation", label: string) => (
    <label className="text-xs">
      {label}
      <input
        aria-label={`Text ${label}`}
        inputMode="decimal"
        value={draft[field] ?? String(field === "size" ? value.size.value : value.rotation)}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft((d) => ({ ...d, [field]: raw }));
          const parsed = Number(raw.replace(",", "."));
          if (raw.trim() === "" || !Number.isFinite(parsed)) return;
          if (field === "size" && parsed > 0)
            onChange({ ...value, size: { ...value.size, value: parsed } });
          if (field === "rotation") onChange({ ...value, rotation: parsed });
        }}
        onBlur={() => {
          setDraft((d) => ({ ...d, [field]: undefined }));
          onCommit?.(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit?.(value);
        }}
        className="block w-16 rounded border bg-background p-1"
      />
    </label>
  );
  const select = <K extends "align" | "anchor" | "font">(
    field: K,
    label: string,
    options: readonly (readonly [TextDefaults[K], string])[],
  ) => (
    <label className="text-xs">
      {label}
      <select
        aria-label={`Text ${label}`}
        value={value[field]}
        onChange={(e) => choose({ ...value, [field]: e.target.value as TextDefaults[K] })}
        className="block rounded border bg-background p-1"
      >
        {options.map(([option, text]) => (
          <option key={option} value={option}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <section aria-label="Texteinstellungen" className="flex flex-wrap items-end gap-3">
      {select(
        "font",
        "Schrift",
        TEXT_FONTS.map((f) => [f, TEXT_FONT_LABELS[f]] as const),
      )}
      {number("size", value.size.unit === "paper" ? "Größe (mm Papier)" : "Größe (m Modell)")}
      <label className="text-xs">
        Maß
        <select
          aria-label="Text Größenmaß"
          value={value.size.unit}
          onChange={(e) =>
            choose({
              ...value,
              size: convertTextSize(
                value.size,
                e.target.value as TextDefaults["size"]["unit"],
                denominator,
              ),
            })
          }
          className="block rounded border bg-background p-1"
          title="Papiermaß folgt dem Ausgabemaßstab, Modellmaß bleibt im Modell gleich groß"
        >
          <option value="paper">Papiermaß</option>
          <option value="model">Modellmaß</option>
        </select>
      </label>
      {select("align", "Ausrichtung", [
        ["left", "Links"],
        ["center", "Mitte"],
        ["right", "Rechts"],
      ])}
      {select("anchor", "Bezug", [
        ["bottom", "Unten"],
        ["middle", "Mitte"],
        ["top", "Oben"],
      ])}
      {number("rotation", "Drehung (°)")}
      <label className="text-xs">
        Farbe
        <input
          type="color"
          aria-label="Textfarbe"
          value={value.color}
          onChange={(e) => choose({ ...value, color: e.target.value })}
          className="block h-7 w-10 rounded border bg-background"
        />
      </label>
      <label className="text-xs">
        Ebene
        <select
          aria-label="Textebene"
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
      <TextDecorationFields value={value} onChoose={choose} />
    </section>
  );
}
