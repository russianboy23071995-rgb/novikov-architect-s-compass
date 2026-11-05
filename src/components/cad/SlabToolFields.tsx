import { useState } from "react";
import type { HatchConstruction } from "@/application/hatches/construction";
import type { SlabDefaults } from "./useToolDefaults";

/** Slab tool: outline construction shared with hatches, thickness and top offset in metres.
 * Values are taken over only when they are valid numbers; the action validates again.
 */
export function SlabToolFields({
  construction,
  onConstruction,
  value,
  onChange,
}: {
  construction: HatchConstruction;
  onConstruction: (construction: HatchConstruction) => void;
  value: SlabDefaults;
  onChange: (value: SlabDefaults) => void;
}) {
  const [draft, setDraft] = useState({
    thickness: String(value.thickness),
    topOffset: String(value.topOffset),
  });
  const take = (name: "thickness" | "topOffset", raw: string) => {
    setDraft((d) => ({ ...d, [name]: raw }));
    const number = Number(raw.replace(",", "."));
    if (raw.trim() !== "" && Number.isFinite(number) && (name === "topOffset" || number > 0))
      onChange({ ...value, [name]: number });
  };
  return (
    <section aria-label="Deckenwerkzeug" className="flex flex-wrap items-end gap-3">
      <label className="text-xs">
        Erstellung
        <select
          aria-label="Decken-Erstellung"
          value={construction}
          onChange={(e) => onConstruction(e.target.value as HatchConstruction)}
          className="block rounded border bg-background p-1"
        >
          <option value="polygon">Polygon per Klick</option>
          <option value="diagonal">Rechteck: Diagonale</option>
          <option value="side-height">Rechteck: Seite und Höhe</option>
          <option value="boundary">Geschlossene Kontur übernehmen</option>
        </select>
      </label>
      <label className="text-xs">
        Stärke (m)
        <input
          aria-label="Deckenstärke"
          inputMode="decimal"
          value={draft.thickness}
          onChange={(e) => take("thickness", e.target.value)}
          className="block w-20 rounded border bg-background p-1"
        />
      </label>
      <label className="text-xs">
        Versatz OK (m)
        <input
          aria-label="Versatz Deckenoberkante"
          inputMode="decimal"
          value={draft.topOffset}
          onChange={(e) => take("topOffset", e.target.value)}
          className="block w-20 rounded border bg-background p-1"
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Oberkante = Rohfußboden des Geschosses darüber; die Stärke wächst nach unten.
      </p>
    </section>
  );
}
