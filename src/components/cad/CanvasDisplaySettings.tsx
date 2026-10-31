import { FloatingPanel } from "./FloatingPanel";
import { CUT_FILL_MODES, cutPaint, type CutFill } from "./cut-fill";

export function CanvasDisplaySettings({
  open,
  onOpenChange,
  wallWidth,
  onWallWidth,
  cutFill,
  onCutFill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallWidth: number;
  onWallWidth: (width: number) => void;
  cutFill: CutFill;
  onCutFill: (fill: CutFill) => void;
}) {
  const sample = cutPaint(cutFill);
  return (
    <FloatingPanel
      open={open}
      title="Darstellung"
      onClose={() => onOpenChange(false)}
      width={420}
      height={540}
    >
      <div className="min-h-0 flex-1 overflow-auto space-y-4 p-4">
        <p className="text-xs text-muted-foreground">Bildschirmdarstellung des Grundrisses</p>
        <fieldset className="space-y-3">
          <legend className="font-medium">Konturlinien (Wand, Decke)</legend>
          <label className="flex items-center justify-between gap-4 text-sm">
            Konturstärke
            <select
              aria-label="Wandkonturstärke"
              className="rounded border bg-background p-2"
              value={wallWidth}
              onChange={(e) => onWallWidth(Number(e.target.value))}
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((v) => (
                <option key={v} value={v}>
                  {v.toLocaleString("de-DE")} px
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-muted-foreground">
            Durchgezogen; bleibt beim Zoomen gleich stark. Die Steuerungsachse bleibt türkis
            hervorgehoben. Gilt für alle Grundrissfenster und wird in diesem Browser gespeichert.
          </p>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="font-medium">Geschnittene Bauteile</legend>
          <div role="radiogroup" aria-label="Schnittfarbe" className="grid grid-cols-2 gap-2">
            {CUT_FILL_MODES.map(({ mode, label }) => (
              <label key={mode} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="cut-fill"
                  value={mode}
                  checked={cutFill.mode === mode}
                  onChange={() => onCutFill({ ...cutFill, mode })}
                />
                {label}
              </label>
            ))}
          </div>
          <label className="flex items-center justify-between gap-4 text-sm">
            Eigene Farbe
            <input
              type="color"
              aria-label="Eigene Schnittfarbe"
              className="h-8 w-14 rounded border bg-background"
              value={cutFill.color}
              onChange={(e) => onCutFill({ mode: "custom", color: e.target.value })}
            />
          </label>
          <svg viewBox="0 0 120 24" className="h-6 w-full" aria-label="Vorschau Schnittfarbe">
            <rect
              x="1"
              y="4"
              width="118"
              height="16"
              fill={sample.fill}
              fillOpacity={sample.fillOpacity}
              stroke="var(--foreground)"
              strokeWidth={wallWidth}
            />
          </svg>
          <p className="text-xs text-muted-foreground">
            Füllung der Wände und Dachschnitte in Schnitthöhe (1 m); Weiß zeigt nur die Kontur. Wird
            in diesem Browser gespeichert.
          </p>
        </fieldset>
      </div>
    </FloatingPanel>
  );
}
