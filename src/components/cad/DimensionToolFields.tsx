import type { Layer } from "@/domain/layers/model";
import type { DimensionOrientation } from "@/domain/elements/dimension/model";
import { DimensionStyleFields, type DimensionStyle } from "./DimensionStyleFields";
import type { HeightMarkKind } from "@/domain/views/height-mark";

export type DimensionDefaults = {
  /** "height": height marks in a section or elevation drawing (docs/SCHNITT.md, BS2). */
  orientation: DimensionOrientation | "height";
  /** Height marks: shell (filled) or finish (open) triangle; absent: shell. */
  heightKind?: HeightMarkKind;
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
            onChange({ ...value, orientation: e.target.value as DimensionDefaults["orientation"] })
          }
          className="block rounded border bg-background p-1"
        >
          <option value="horizontal">Waagerecht</option>
          <option value="vertical">Senkrecht</option>
          <option value="height">Höhenkote (Schnitt/Ansicht)</option>
        </select>
      </label>
      {value.orientation === "height" && (
        <label className="text-xs">
          Kote
          <select
            aria-label="Art der Höhenkote"
            value={value.heightKind ?? "shell"}
            onChange={(e) => onChange({ ...value, heightKind: e.target.value as HeightMarkKind })}
            className="block rounded border bg-background p-1"
          >
            <option value="shell">Rohbau (gefüllt)</option>
            <option value="finish">Fertig (offen)</option>
          </select>
        </label>
      )}
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
        {value.orientation === "height"
          ? "Im Schnitt- oder Ansichts-Tab: 1. Klick: Lage der Höhenkoten · danach die Punkte (rasten ein) · Doppelklick oder Enter: Koten erstellen · Esc: abbrechen"
          : step === "points"
            ? "Punkte nacheinander anklicken (rastet ein) · Doppelklick ins Leere oder Enter: Maßkette erstellen · Esc: abbrechen"
            : "1. Klick: Lage der Maßlinie · danach die Punkte · Doppelklick ins Leere: fertig"}
      </p>
    </section>
  );
}
