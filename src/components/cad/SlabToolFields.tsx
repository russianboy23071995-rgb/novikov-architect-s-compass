import { useState } from "react";
import type { HatchConstruction } from "@/application/hatches/construction";
import type { SlabDefaults } from "./useToolDefaults";
import { ConstructionPicker } from "./ConstructionPicker";

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
      <ConstructionPicker
        label="Decken-Erstellung"
        options={["polygon", "diagonal", "side-height", "boundary"] as const}
        value={construction}
        onValue={onConstruction}
      />
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
