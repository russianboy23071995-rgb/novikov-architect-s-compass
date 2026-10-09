import { FloatingPanel } from "./FloatingPanel";

export function CanvasDisplaySettings({
  open,
  onOpenChange,
  wallWidth,
  onWallWidth,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallWidth: number;
  onWallWidth: (width: number) => void;
}) {
  return (
    <FloatingPanel
      open={open}
      title="Canvas-Darstellung"
      onClose={() => onOpenChange(false)}
      width={420}
      height={300}
    >
      <div className="min-h-0 flex-1 overflow-auto space-y-4 p-4">
        <p className="text-xs text-muted-foreground">Bildschirmdarstellung des Grundrisses</p>
        <fieldset className="space-y-3">
          <legend className="font-medium">Wand</legend>
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
            Bleibt beim Zoomen gleich stark. Die Steuerungsachse bleibt türkis hervorgehoben. Gilt
            für alle Grundrissfenster und wird in diesem Browser gespeichert.
          </p>
        </fieldset>
      </div>
    </FloatingPanel>
  );
}
