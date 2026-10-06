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
}: {
  value: WindowDimensionDraft;
  onChange: (value: WindowDimensionDraft) => void;
  error: string;
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
      <p className="text-xs text-muted-foreground">
        Wand anfahren · Klick setzt Fenster · Esc bricht ab. Nur neue Fenster.
      </p>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
