import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  builtInLineStyles,
  loadLineStyles,
  saveLineStyle,
  deleteLineStyle,
} from "@/application/lines/style-library";
import type { LineStyleDefinition } from "@/application/lines/style-library";
import { browserLineStyleStorage as storage } from "@/interop/line-style-storage";
function Preview({ style }: { style: LineStyleDefinition }) {
  return (
    <svg aria-label={`Vorschau ${style.name}`} viewBox="0 0 180 24" className="h-6 w-44 shrink-0">
      <path
        d={style.id === "break" ? "M 4 12 H 76 L 82 5 L 94 19 L 100 12 H 176" : "M 4 12 H 176"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray={style.dashes.length ? style.dashes.join(" ") : undefined}
      />
    </svg>
  );
}
export function LineStyleCreator({ onClose }: { onClose: () => void }) {
  const [loaded] = useState(() => {
    try {
      return { styles: loadLineStyles(storage), error: "" };
    } catch {
      return {
        styles: [] as LineStyleDefinition[],
        error:
          "Bibliothek konnte nicht geladen werden. Gespeicherte Daten werden nicht überschrieben.",
      };
    }
  });
  const [styles, setStyles] = useState(loaded.styles);
  const [error, setError] = useState(loaded.error);
  const [id, setId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [dashes, setDashes] = useState("8 5");
  const values = dashes.trim().split(/\s+/).map(Number);
  const preview = {
    id: "preview",
    name: "Entwurf",
    dashes:
      values.length <= 32 && values.every((v) => Number.isFinite(v) && v > 0 && v <= 1000)
        ? values
        : [],
  };
  const clear = () => {
    setId(null);
    setName("");
    setDashes("8 5");
    setError(loaded.error);
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="glass-panel-strong max-w-2xl max-h-[85vh] overflow-auto">
        <DialogTitle>Linien Creator</DialogTitle>
        <DialogDescription>
          Linienarten verwalten. Eigene Strich-/Lückenmuster werden projektübergreifend in diesem
          Browserprofil gespeichert. Die Anbindung an das Linienwerkzeug folgt separat.
        </DialogDescription>
        <div className="max-h-64 overflow-auto space-y-2" aria-label="Vorhandene Linienarten">
          {[...builtInLineStyles, ...styles].map((style) => (
            <div
              key={style.id}
              className="flex flex-wrap items-center gap-2 rounded border p-2 text-xs"
            >
              <span className="min-w-28 flex-1">{style.name}</span>
              <Preview style={style} />
              {builtInLineStyles.some((s) => s.id === style.id) ? (
                <span className="text-muted-foreground">Standard</span>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      setId(style.id);
                      setName(style.name);
                      setDashes(style.dashes.join(" "));
                      setError("");
                    }}
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    size="sm"
                    disabled={!!loaded.error}
                    onClick={() => {
                      try {
                        setStyles(deleteLineStyle(storage, styles, style.id));
                        if (id === style.id) clear();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Löschen
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="border-t pt-3 space-y-2">
          <p className="text-sm">{id ? "Linienart bearbeiten" : "Neue Linienart"}</p>
          <label className="block text-xs">
            Name
            <Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block text-xs">
            Strich und Lücke im Wechsel · relative Längen, mit Leerzeichen trennen
            <Input
              value={dashes}
              onChange={(e) => setDashes(e.target.value)}
              placeholder="8 5 2 5"
            />
          </label>
          <Preview style={preview} />
          <div className="flex gap-2">
            <Button
              disabled={!!loaded.error}
              onClick={() => {
                try {
                  const next = saveLineStyle(storage, styles, {
                    id: id ?? crypto.randomUUID(),
                    name,
                    dashes: values,
                  });
                  setStyles(next);
                  clear();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Speichern
            </Button>
            <Button variant="outline" onClick={clear}>
              Neue Linienart
            </Button>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
