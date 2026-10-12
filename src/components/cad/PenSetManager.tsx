import { useState } from "react";
import { FloatingPanel } from "./FloatingPanel";
import { ColorField } from "./PenColors";
import { Button } from "@/components/ui/button";
import { loadPens, savePenSet } from "@/application/pens/library";
import { browserPenStorage } from "@/interop/pen-storage";
import { defaultPenSet } from "@/domain/pens/model";
import type { PenSet } from "@/domain/pens/model";
export function PenSetManager({
  selected,
  onSelect,
  onClose,
}: {
  selected: PenSet;
  onSelect: (set: PenSet) => void;
  onClose: () => void;
}) {
  const [loaded] = useState(() => {
    try {
      return { library: loadPens(browserPenStorage), error: "" };
    } catch {
      return {
        library: null,
        error: "Stiftesets konnten nicht geladen werden. Gespeicherte Daten bleiben erhalten.",
      };
    }
  });
  const [library, setLibrary] = useState(loaded.library);
  const [error, setError] = useState(loaded.error);
  const [draft, setDraft] = useState<PenSet>(() => structuredClone(selected));
  const [color, setColor] = useState("#334155");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const save = () => {
    if (!library) return;
    try {
      const next = savePenSet(browserPenStorage, library, draft);
      setLibrary(next);
      onSelect(next.sets.find((s) => s.id === draft.id)!);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "ZodError"
          ? e.message
          : "Name, Farben und Inventar prüfen (höchstens zehn Stifte). Änderungen wurden nicht übernommen.",
      );
    }
  };
  return (
    <FloatingPanel
      open
      title="Stifteset · Farbenverwaltung"
      onClose={onClose}
      width={620}
      height={650}
    >
      <div className="space-y-4 overflow-auto p-4 text-xs">
        <p>Farbenpakete für Projekte. Bestehende Elemente behalten ihre Farbe.</p>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Farbenpaket"
            value={draft.id}
            className="rounded border bg-background p-2"
            onChange={(e) => {
              setDraft(
                structuredClone(library?.sets.find((s) => s.id === e.target.value) ?? selected),
              );
              setEditing(null);
            }}
          >
            {!library?.sets.some((s) => s.id === draft.id) && (
              <option value={draft.id}>{draft.name} · Projekt/Entwurf</option>
            )}
            {library?.sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={() => {
              setDraft({
                id: crypto.randomUUID(),
                name: "Neues Stifteset",
                pens: [],
                inventory: [],
              });
              setEditing(null);
            }}
          >
            Neues Stifteset
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDraft({ ...structuredClone(defaultPenSet), id: crypto.randomUUID() });
              setEditing(null);
            }}
          >
            Standard als Kopie
          </Button>
        </div>
        <label className="block">
          Paketname
          <input
            aria-label="Stiftesetname"
            className="ml-2 rounded border bg-background p-2"
            maxLength={80}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <p className="font-medium">Inventar · {draft.inventory.length}/10</p>
        <div className="flex flex-wrap gap-2">
          {draft.inventory.map((id) => {
            const pen = draft.pens.find((p) => p.id === id)!;
            return (
              <button
                type="button"
                key={id}
                title={`${pen.name} aus Inventar entfernen`}
                className="h-9 w-9 rounded border"
                style={{ backgroundColor: pen.color }}
                onClick={() =>
                  setDraft({ ...draft, inventory: draft.inventory.filter((v) => v !== id) })
                }
              />
            );
          })}
        </div>
        <div className="max-h-52 overflow-auto rounded border">
          {draft.pens.map((p) => (
            <div key={p.id} className="flex items-center gap-2 border-b p-2">
              <span className="h-5 w-7 rounded border" style={{ backgroundColor: p.color }} />
              <span className="min-w-0 flex-1 truncate">
                {p.name} · {p.color}
              </span>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  aria-label={`${p.name} im Inventar`}
                  checked={draft.inventory.includes(p.id)}
                  disabled={!draft.inventory.includes(p.id) && draft.inventory.length >= 10}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      inventory: e.target.checked
                        ? [...draft.inventory, p.id]
                        : draft.inventory.filter((id) => id !== p.id),
                    })
                  }
                />
                Inventar
              </label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(p.id);
                  setName(p.name);
                  setColor(p.color);
                }}
              >
                Bearbeiten
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft({
                    ...draft,
                    pens: draft.pens.filter((v) => v.id !== p.id),
                    inventory: draft.inventory.filter((id) => id !== p.id),
                  });
                  if (editing === p.id) setEditing(null);
                }}
              >
                Löschen
              </Button>
            </div>
          ))}
        </div>
        <fieldset className="space-y-2 rounded border p-3">
          <legend>{editing ? "Stift bearbeiten" : "Neuer Farbstift"}</legend>
          <label>
            Name
            <input
              aria-label="Stiftname"
              value={name}
              maxLength={80}
              className="ml-2 rounded border bg-background p-2"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <ColorField label="Stiftfarbe" value={color} onChange={setColor} />
          <Button
            size="sm"
            disabled={!name.trim() || (!editing && draft.pens.length >= 256)}
            onClick={() => {
              const pen = { id: editing ?? crypto.randomUUID(), name: name.trim(), color };
              setDraft({
                ...draft,
                pens: editing
                  ? draft.pens.map((p) => (p.id === editing ? pen : p))
                  : [...draft.pens, pen],
              });
              setEditing(null);
              setName("");
            }}
          >
            {editing ? "Stift ändern" : "Stift hinzufügen"}
          </Button>
        </fieldset>
        <Button size="sm" disabled={!library} onClick={save}>
          Paket speichern und für Projekt wählen
        </Button>
        <p className="text-muted-foreground">
          Pakete: lokal in diesem Browserprofil. Das gewählte Paket und Inventar werden auch in der
          Projektdatei gesichert. Änderungen gelten für künftige Farbauswahlen.
        </p>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </div>
    </FloatingPanel>
  );
}
