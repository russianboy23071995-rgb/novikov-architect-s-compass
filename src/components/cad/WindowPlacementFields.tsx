import type { WindowDimensionDraft } from "@/application/drawing/window-placement";
import { Input } from "@/components/ui/input";

const fields = [
  ["width", "Fensterbreite (m)"],
  ["height", "Fensterhöhe (m)"],
  ["sillHeight", "Brüstungshöhe (m)"],
] as const;
export function WindowPlacementFields({
  value,
  onChange,
  error,
  precision,
  onPrecision,
  pickingHost,
}: {
  value: WindowDimensionDraft;
  onChange: (value: WindowDimensionDraft) => void;
  error: string;
  precision: boolean;
  pickingHost: boolean;
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
        <input
          type="checkbox"
          checked={precision}
          onChange={(event) => onPrecision(event.target.checked)}
        />{" "}
        Position per Maß
      </label>
      <p className="text-xs text-muted-foreground">
        {precision
          ? pickingHost
            ? "Zuerst die Wand anklicken. Danach Tab: Abstand der Fenstermitte."
            : "Wand fixiert · Tab: Abstand der Fenstermitte ab Wandanfang · Enter/Klick setzt Fenster."
          : "Wand anfahren · Klick setzt Fenster · Esc bricht ab. Nur neue Fenster."}
      </p>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
