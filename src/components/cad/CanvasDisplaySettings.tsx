import { FloatingPanel } from "./FloatingPanel";
import { CUT_FILL_MODES, cutPaint, type CutFill } from "./cut-fill";
import { Pictogram } from "./Pictogram";
import { PICTOGRAM_DUOTONE, PICTOGRAM_SCALE, type PictogramSettings } from "./pictogram-settings";

export function CanvasDisplaySettings({
  open,
  onOpenChange,
  wallWidth,
  onWallWidth,
  cutFill,
  onCutFill,
  showRenovation,
  onShowRenovation,
  pictograms,
  onPictograms,
  onResetPictograms,
}: {
  /** Size and colours of the pictograms (docs/WERKZEUGLEISTE.md, WL4). */
  pictograms: PictogramSettings;
  onPictograms: (settings: PictogramSettings) => void;
  onResetPictograms: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallWidth: number;
  onWallWidth: (width: number) => void;
  cutFill: CutFill;
  onCutFill: (fill: CutFill) => void;
  showRenovation: boolean;
  onShowRenovation: (show: boolean) => void;
}) {
  const sample = cutPaint(cutFill);
  return (
    <FloatingPanel
      open={open}
      title="Darstellung"
      onClose={() => onOpenChange(false)}
      width={420}
      height={640}
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
        <fieldset className="space-y-2">
          <legend className="font-medium">Bauzustand</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              aria-label="Bauzustand farbig anzeigen"
              checked={showRenovation}
              onChange={(e) => onShowRenovation(e.target.checked)}
            />
            Bauzustand farbig anzeigen
          </label>
          <p className="text-xs text-muted-foreground">
            Neubau rot, Abbruch gelb, Bestand in der Schnittfarbe. Den Bauzustand einer Wand legst
            du im Wandfenster unter „Bauzustand“ fest.
          </p>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="font-medium">Piktogramme</legend>
          <div className="flex items-center gap-3" aria-label="Vorschau Piktogramme">
            <Pictogram group="werkzeuge" name="wand" />
            <Pictogram group="werkzeuge" name="wand" active />
            <Pictogram group="werkzeuge" name="fenster" />
            <Pictogram group="werkzeuge" name="fenster" active />
            <Pictogram group="navigator" name="grundriss" size={18} />
          </div>
          <label className="flex items-center justify-between gap-4 text-sm">
            Größe
            <span className="flex items-center gap-2">
              <input
                type="range"
                aria-label="Größe der Piktogramme"
                min={PICTOGRAM_SCALE.min}
                max={PICTOGRAM_SCALE.max}
                step={PICTOGRAM_SCALE.step}
                value={pictograms.scale}
                onChange={(e) => onPictograms({ ...pictograms, scale: Number(e.target.value) })}
              />
              <span className="w-10 text-right tabular-nums">
                {Math.round(pictograms.scale * 100)} %
              </span>
            </span>
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            Farbe aktiv, helle Oberfläche
            <input
              type="color"
              aria-label="Aktivfarbe hell"
              value={pictograms.activeLight}
              onChange={(e) => onPictograms({ ...pictograms, activeLight: e.target.value })}
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            Farbe aktiv, dunkle Oberfläche
            <input
              type="color"
              aria-label="Aktivfarbe dunkel"
              value={pictograms.activeDark}
              onChange={(e) => onPictograms({ ...pictograms, activeDark: e.target.value })}
            />
          </label>
          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                aria-label="Eigene Linienfarbe"
                checked={pictograms.line !== null}
                onChange={(e) =>
                  onPictograms({ ...pictograms, line: e.target.checked ? "#1d2125" : null })
                }
              />
              Eigene Linienfarbe (sonst wie Text)
            </label>
            {pictograms.line !== null && (
              <input
                type="color"
                aria-label="Linienfarbe"
                value={pictograms.line}
                onChange={(e) => onPictograms({ ...pictograms, line: e.target.value })}
              />
            )}
          </div>
          <label className="flex items-center justify-between gap-4 text-sm">
            Deckkraft der Fläche (inaktiv)
            <span className="flex items-center gap-2">
              <input
                type="range"
                aria-label="Deckkraft der Duoton-Fläche"
                min={PICTOGRAM_DUOTONE.min}
                max={PICTOGRAM_DUOTONE.max}
                step={PICTOGRAM_DUOTONE.step}
                value={pictograms.duotone}
                onChange={(e) => onPictograms({ ...pictograms, duotone: Number(e.target.value) })}
              />
              <span className="w-10 text-right tabular-nums">
                {Math.round(pictograms.duotone * 100)} %
              </span>
            </span>
          </label>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Werkzeugleiste, Zeichenarten und Navigator. Wird in diesem Browser gespeichert.
            </p>
            <button
              type="button"
              className="shrink-0 rounded border px-2 py-1 text-xs hover:bg-muted"
              onClick={onResetPictograms}
            >
              Zurücksetzen
            </button>
          </div>
        </fieldset>
      </div>
    </FloatingPanel>
  );
}
