import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  gridSpacing,
  parseGridSpacing,
  type GridSettings,
} from "@/application/snapping/grid-settings";

export function GridControls({
  value,
  onChange,
}: {
  value: GridSettings;
  onChange: (value: GridSettings) => void;
}) {
  const [draft, setDraft] = useState(String(value.spacing));
  const [error, setError] = useState("");
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        className="h-6 px-2 text-[11px]"
        aria-pressed={value.enabled}
        onClick={() => onChange({ ...value, enabled: !value.enabled })}
      >
        Rasterfang {value.enabled ? "an" : "aus"}
      </Button>
      <Popover
        onOpenChange={(open) => {
          if (open) {
            setDraft(String(value.spacing));
            setError("");
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-6 px-2 text-[11px]"
            aria-label="Rasterschrittweite einstellen"
          >
            {value.spacing} m
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" side="top">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              try {
                const spacing = parseGridSpacing(draft);
                gridSpacing({ ...value, spacing });
                onChange({ ...value, spacing });
                setError("");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <label className="text-xs">
              Rasterschrittweite (m)
              <input
                aria-label="Rasterschrittweite (m)"
                inputMode="decimal"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="my-2 w-full rounded border bg-background px-2 py-1 text-sm"
              />
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Für Zeichnen und Bewegen. SNAP bleibt der Hauptschalter. Das sichtbare Raster passt
              sich weiterhin dem Zoom an.
            </p>
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="sm">
              Übernehmen
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
