import type { Project } from "@/domain/project/schema";
import type { DoorSettingsDraft } from "@/application/drawing/door-placement";
import { Input } from "@/components/ui/input";

const fields = [
  ["width", "Türbreite (m)"],
  ["height", "Türhöhe (m)"],
  ["zOffset", "Z-Versatz zum Geschoss (m)"],
] as const;
/**
 * Geometric wording: hinge jamb toward wall start/end. The side the door opens to comes from
 * the second click (docs/FENSTER_TUEREN.md, R1); DIN follows from both, shown in the door window.
 */
export function DoorPlacementFields({
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
  value: DoorSettingsDraft;
  onChange: (value: DoorSettingsDraft) => void;
  error: string;
  precision: boolean;
  pickingHost: boolean;
  /** Position set: the pointer chooses the swing side. */
  choosingSide: boolean;
  onPrecision: (value: boolean) => void;
}) {
  return (
    <section aria-label="Türwerkzeug" className="flex flex-wrap items-end gap-3">
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
        Anschlag
        <select
          aria-label="Türanschlag"
          className="block h-8 rounded border bg-background"
          value={value.hinge}
          onChange={(event) =>
            onChange({ ...value, hinge: event.target.value as DoorSettingsDraft["hinge"] })
          }
        >
          <option value="start">Seite Wandanfang</option>
          <option value="end">Seite Wandende</option>
        </select>
      </label>
      <label className="text-xs">
        Ebene
        <select
          aria-label="Tür-Zielebene"
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
          ? "Klick auf die Seite, zu der die Tür aufgeht · Esc bricht ab."
          : precision
            ? pickingHost
              ? "Zuerst die Wand anklicken. Danach Tab: Abstand der Türmitte."
              : "Wand fixiert · Tab: Abstand der Türmitte ab Wandanfang · Enter/Klick setzt die Position."
            : "Wand anfahren · Klick 1 Position, Klick 2 Seite, zu der die Tür aufgeht · Esc bricht ab."}
      </p>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
