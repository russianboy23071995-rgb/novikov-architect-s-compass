import type { Project } from "@/domain/project/schema";
import type { WindowDimensionDraft } from "@/application/drawing/window-placement";
import { Input } from "@/components/ui/input";

const fields = [
  ["width", "Fensterbreite (m)"],
  ["height", "Fensterhöhe (m)"],
  ["sillHeight", "Brüstungshöhe (m)"],
] as const;
export function WindowPlacementFields({
  layers,
  value,
  onChange,
  error,
  precision,
  onPrecision,
  pickingHost,
  choosingSide,
}: {
  layers: Project["layers"];
  value: WindowDimensionDraft;
  onChange: (value: WindowDimensionDraft) => void;
  error: string;
  precision: boolean;
  pickingHost: boolean;
  /** Position set: the pointer chooses the outside (R1). */
  choosingSide: boolean;
  onPrecision: (value: boolean) => void;
}) {
  return (
    <section aria-label="Fensterwerkzeug" className="flex flex-wrap items-end gap-3">
      {fields.map(([key, label]) => (
        <label key={key} className="text-xs">
          {label}
          <Input
            className="mt-1 w-28"
            inputMode="decimal"
            value={value[key]}
            onChange={(event) => onChange({ ...value, [key]: event.target.value })}
          />
        </label>
      ))}
      <label className="text-xs">
        Ebene
        <select
          aria-label="Fenster-Zielebene"
          className="block h-8 rounded border bg-background"
          value={value.layerId}
          onChange={(event) => onChange({ ...value, layerId: event.target.value })}
        >
          {layers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs">
        <input
          type="checkbox"
          checked={precision}
          onChange={(event) => onPrecision(event.target.checked)}
        />{" "}
        Position per Maß
      </label>
      <p className="text-xs text-muted-foreground">
        {choosingSide
          ? "Klick auf die Außenseite der Wand · Esc bricht ab."
          : precision
            ? pickingHost
              ? "Zuerst die Wand anklicken. Danach Tab: Abstand der Fenstermitte."
              : "Wand fixiert · Tab: Abstand der Fenstermitte ab Wandanfang · Enter/Klick setzt die Position."
            : "Wand anfahren · Klick 1 Position, Klick 2 Außenseite (nur Öffnung: ein Klick) · Esc bricht ab."}
      </p>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
