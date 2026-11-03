import type { HatchConstruction } from "@/application/hatches/construction";

/** Deckendurchbruch tool (docs/DECKENDURCHBRUCH.md): outline construction shared with slabs and
 * hatches. The slab that holds the outline is found by the action; the opening takes its layer.
 */
export function SlabOpeningToolFields({
  construction,
  onConstruction,
}: {
  construction: HatchConstruction;
  onConstruction: (construction: HatchConstruction) => void;
}) {
  return (
    <section aria-label="Werkzeug Deckendurchbruch" className="flex flex-wrap items-end gap-3">
      <label className="text-xs">
        Erstellung
        <select
          aria-label="Deckendurchbruch-Erstellung"
          value={construction}
          onChange={(e) => onConstruction(e.target.value as HatchConstruction)}
          className="block rounded border bg-background p-1"
        >
          <option value="diagonal">Rechteck: Diagonale</option>
          <option value="side-height">Rechteck: Seite und Höhe</option>
          <option value="polygon">Polygon per Klick</option>
          <option value="boundary">Geschlossene Kontur übernehmen</option>
        </select>
      </label>
      <p className="text-xs text-muted-foreground">
        Ganz innerhalb einer Decke zeichnen; der Durchbruch geht durch die ganze Deckenstärke.
        Darstellung nach DIN 1356-1: Umriss mit Diagonalkreuz.
      </p>
    </section>
  );
}
