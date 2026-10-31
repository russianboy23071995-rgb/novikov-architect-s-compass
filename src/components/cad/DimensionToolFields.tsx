import type { Layer } from "@/domain/layers/model";
import type { DimensionOrientation } from "@/domain/elements/dimension/model";
import { DimensionStyleFields, type DimensionStyle } from "./DimensionStyleFields";

export type DimensionDefaults = {
  orientation: DimensionOrientation;
  layerId: string;
} & DimensionStyle;

/** Dimension chain tool (docs/MASSKETTE.md): direction and layer; the same set in the bar and
 * the settings window. The hint tells the click order. */
export function DimensionToolFields({
  value,
  onChange,
  layers,
  step,
}: {
  value: DimensionDefaults;
  onChange: (value: DimensionDefaults) => void;
  layers: readonly Layer[];
  /** Current step of the running chain, shown as a hint. */
  step?: "line" | "points" | undefined;
}) {
  return (
    <section aria-label="Maßkettenwerkzeug" className="flex flex-wrap items-end gap-3">
      <label className="text-xs">
        Richtung
        <select
          aria-label="Maßkettenrichtung"
          value={value.orientation}
          onChange={(e) =>
            onChange({ ...value, orientation: e.target.value as DimensionOrientation })
          }
          className="block rounded border bg-background p-1"
        >
          <option value="horizontal">Waagerecht</option>
          <option value="vertical">Senkrecht</option>
        </select>
      </label>
      <label className="text-xs">
        Ebene
        <select
          aria-label="Maßkettenebene"
          value={value.layerId}
          onChange={(e) => onChange({ ...value, layerId: e.target.value })}
          className="block rounded border bg-background p-1"
        >
          {layers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </label>
      <DimensionStyleFields value={value} onChange={(style) => onChange({ ...value, ...style })} />
      <p className="text-xs text-muted-foreground">
        {step === "points"
          ? "Punkte nacheinander anklicken (rastet ein) · Doppelklick ins Leere oder Enter: Maßkette erstellen · Esc: abbrechen"
          : "1. Klick: Lage der Maßlinie · danach die Punkte · Doppelklick ins Leere: fertig"}
      </p>
    </section>
  );
}
