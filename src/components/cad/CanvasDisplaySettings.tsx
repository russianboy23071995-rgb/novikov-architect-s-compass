import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel-strong max-w-sm">
        <DialogHeader>
          <DialogTitle>Canvas-Darstellung</DialogTitle>
          <DialogDescription>Bildschirmdarstellung des Grundrisses</DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
