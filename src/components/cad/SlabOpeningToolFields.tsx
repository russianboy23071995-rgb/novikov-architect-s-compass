import type { HatchConstruction } from "@/application/hatches/construction";
import { ConstructionPicker } from "./ConstructionPicker";

/** Deckendurchbruch tool (docs/DECKENDURCHBRUCH.md): outline construction shared with slabs and
 * hatches. The slab that holds the outline is found by the action; the opening takes its layer.
 */
export function SlabOpeningToolFields({
  construction,
  onConstruction,
}: {
  construction: HatchConstruction | "circle";
  onConstruction: (construction: HatchConstruction | "circle") => void;
}) {
  return (
    <section aria-label="Werkzeug Deckendurchbruch" className="flex flex-wrap items-end gap-3">
      <ConstructionPicker
        label="Deckendurchbruch-Erstellung"
        options={["diagonal", "side-height", "circle", "polygon", "boundary"] as const}
        value={construction}
        onValue={onConstruction}
      />
      <p className="text-xs text-muted-foreground">
        Ganz innerhalb einer Decke zeichnen; der Durchbruch geht durch die ganze Deckenstärke.
        Darstellung: Umriss mit schwarzem Eckkeil, rund mit schwarzer Sichel.
      </p>
    </section>
  );
}
