import { ColorField } from "./PenColors";
import { useId, useState } from "react";
import { FloatingPanel } from "./FloatingPanel";
import { LineStyleDrawing } from "./LineStyleDrawing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loadLineStyles,
  saveLineStyle,
  deleteLineStyle,
  loadLineInventory,
  saveLineInventory,
  validateLineStyle,
} from "@/application/lines/style-library";
import type { LineStyleDefinition } from "@/application/lines/style-library";
import { browserLineStyleStorage as storage } from "@/interop/line-style-storage";
function Preview({ style }: { style: LineStyleDefinition }) {
  const id = useId();
  return (
    <svg aria-label={`Vorschau ${style.name}`} viewBox="0 -12 120 24" className="h-8 w-36 shrink-0">
      <defs>
        <pattern
          id={id}
          width={style.period ?? 20}
          height={24}
          y={-12}
          patternUnits="userSpaceOnUse"
        >
          {style.segments?.map((s, i) => (
            <line
              key={i}
              x1={s.start.x}
              y1={s.start.y + 12}
              x2={s.end.x}
              y2={s.end.y + 12}
              stroke={style.color}
              strokeWidth="1.5"
            />
          ))}
        </pattern>
      </defs>
      <rect y={-12} width={120} height={24} fill={`url(#${id})`} />
    </svg>
  );
}
export function LineStyleCreator({ onClose }: { onClose: () => void }) {
  const [loaded] = useState(() => {
    try {
      const styles = loadLineStyles(storage);
      return { styles, inventory: loadLineInventory(storage, styles), error: "" };
    } catch {
      return {
        styles: [] as LineStyleDefinition[],
        inventory: [] as string[],
        error: "Bibliothek konnte nicht geladen werden. Daten werden nicht überschrieben.",
      };
    }
  });
  const [styles, setStyles] = useState(loaded.styles);
  const [inventory, setInventory] = useState(loaded.inventory);
  const [error, setError] = useState(loaded.error);
  const [draft, setDraft] = useState<LineStyleDefinition | null>(null);
  const edit = (style: LineStyleDefinition) => {
    setDraft({
      ...style,
      dashes: [],
      segments: (style.segments ?? []).map((s) => ({ start: { ...s.start }, end: { ...s.end } })),
    });
    setError("");
  };
  return (
    <FloatingPanel open title="Linien Creator" onClose={onClose} width={760} height={700}>
      <div className="min-h-0 flex-1 overflow-auto space-y-3 p-4">
        <section aria-label="Linieninventar">
          <p className="text-sm font-medium">Inventar · {inventory.length}/10</p>
          <div className="flex flex-wrap gap-2">
            {inventory.map((id) => {
              const style = styles.find((s) => s.id === id)!;
              return (
                <div key={id} className="rounded border p-2 text-xs">
                  <span>{style.name}</span>
                  <Preview style={style} />
                </div>
              );
            })}
            {!inventory.length && (
              <p className="text-xs text-muted-foreground">
                Linienarten aus dem Katalog aufnehmen.
              </p>
            )}
          </div>
        </section>
        <p className="text-xs text-muted-foreground">
          Katalog · Änderungen gelten zunächst nur in dieser Bibliothek. Anbindung des Inventars an
          das Linienwerkzeug folgt separat.
        </p>
        <div className="max-h-60 overflow-auto space-y-2" aria-label="Linienartenkatalog">
          {styles.map((style) => (
            <div
              key={style.id}
              className="flex flex-wrap items-center gap-2 rounded border p-2 text-xs"
            >
              <span className="min-w-24 flex-1">{style.name}</span>
              <Preview style={style} />
              <Button size="sm" onClick={() => edit(style)}>
                Bearbeiten
              </Button>
              <Button
                size="sm"
                disabled={!!loaded.error}
                onClick={() => {
                  try {
                    const next = deleteLineStyle(storage, styles, style.id);
                    setStyles(next);
                    setInventory(loadLineInventory(storage, next));
                    if (draft?.id === style.id) setDraft(null);
                    setError("");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Löschen
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={
                  !!loaded.error || (!inventory.includes(style.id) && inventory.length >= 10)
                }
                onClick={() => {
                  try {
                    setInventory(
                      saveLineInventory(
                        storage,
                        styles,
                        inventory.includes(style.id)
                          ? inventory.filter((id) => id !== style.id)
                          : [...inventory, style.id],
                      ),
                    );
                    setError("");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                {inventory.includes(style.id) ? "Aus Inventar" : "Ins Inventar"}
              </Button>
            </div>
          ))}
        </div>
        <Button
          disabled={!!loaded.error}
          onClick={() => {
            setDraft({
              id: crypto.randomUUID(),
              name: "",
              dashes: [],
              color: "#334155",
              period: 40,
              segments: [],
            });
            setError("");
          }}
        >
          Neue Linienart
        </Button>
        {draft && (
          <section className="space-y-3 border-t pt-3">
            <p className="text-sm font-medium">
              {styles.some((s) => s.id === draft.id) ? "Linienart bearbeiten" : "Neue Linienart"}
            </p>
            <div className="flex flex-wrap gap-3">
              <label className="text-xs flex-1">
                Name
                <Input
                  value={draft.name}
                  maxLength={80}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label className="text-xs">
                Farbe
                <ColorField
                  label="Linienartfarbe"
                  value={draft.color!}
                  onChange={(color) => setDraft({ ...draft, color })}
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={draft.colorEditable ?? true}
                  onChange={(e) => setDraft({ ...draft, colorEditable: e.target.checked })}
                />
                Farbe veränderbar
              </label>
              <label className="text-xs">
                Wiederholungslänge
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={draft.period}
                  className="w-24"
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value >= 1 && value <= 200) setDraft({ ...draft, period: value });
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Zwei Klicks zeichnen einen Abschnitt. Mehrere Abschnitte bilden die Struktur; Shift
              hält die Richtung. Die Struktur wiederholt sich entlang der Linie. Längen hier sind
              relative Mustereinheiten.
            </p>
            <LineStyleDrawing
              key={`${draft.id}-${draft.period}`}
              period={draft.period!}
              color={draft.color!}
              segments={draft.segments ?? []}
              onChange={(segments) => {
                try {
                  const next = validateLineStyle({
                    ...draft,
                    segments,
                    name: draft.name || "Entwurf",
                  });
                  setDraft({ ...next, name: draft.name });
                  setError("");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            />
            <Preview style={draft} />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  try {
                    const next = saveLineStyle(storage, styles, draft);
                    setStyles(next);
                    setInventory(loadLineInventory(storage, next));
                    setDraft(null);
                    setError("");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Speichern
              </Button>
              <Button
                variant="outline"
                disabled={!draft.segments?.length}
                onClick={() =>
                  setDraft({ ...draft, segments: (draft.segments ?? []).slice(0, -1) })
                }
              >
                Letzter Abschnitt zurück
              </Button>
              <Button variant="outline" onClick={() => setDraft(null)}>
                Abbrechen
              </Button>
            </div>
          </section>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </FloatingPanel>
  );
}
