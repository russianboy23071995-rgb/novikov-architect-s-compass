import { useState } from "react";
import { convertSectionSymbolSize, type SectionSymbolSize } from "@/domain/views/sections";

/**
 * Size of the section symbol (docs/SCHNITT.md, SC4), like the text size: letter height in paper
 * mm or model m; switching the unit keeps the visible size at the output scale. A typed value is
 * reported on blur or Enter, a unit switch at once.
 */
export function SectionSizeField({
  value,
  onChange,
  denominator,
}: {
  value: SectionSymbolSize;
  onChange: (value: SectionSymbolSize) => void;
  /** Output scale 1:denominator. */
  denominator: number;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const parsed = Number(draft.replace(",", "."));
    setDraft(null);
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 1000 && parsed !== value.value)
      onChange({ ...value, value: parsed });
  };
  const label = value.unit === "paper" ? "Größe (mm Papier)" : "Größe (m Modell)";
  return (
    <div className="flex items-end gap-2">
      <label className="text-xs">
        {label}
        <input
          aria-label={`Schnittsymbol ${label}`}
          inputMode="decimal"
          value={draft ?? String(value.value).replace(".", ",")}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => event.key === "Enter" && commit()}
          className="block w-16 rounded border bg-background p-1"
        />
      </label>
      <label className="text-xs">
        Maß
        <select
          aria-label="Schnittsymbol Größenmaß"
          value={value.unit}
          onChange={(event) =>
            onChange(
              convertSectionSymbolSize(
                value,
                event.target.value as SectionSymbolSize["unit"],
                denominator,
              ),
            )
          }
          className="block rounded border bg-background p-1"
          title="Papiermaß folgt dem Ausgabemaßstab, Modellmaß bleibt im Modell gleich groß"
        >
          <option value="paper">Papiermaß</option>
          <option value="model">Modellmaß</option>
        </select>
      </label>
    </div>
  );
}
