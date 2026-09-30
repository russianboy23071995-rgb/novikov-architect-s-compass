import { useState } from "react";
import { ArrowUp, Check, Mic, X } from "lucide-react";
import novikovLogo from "@/assets/novikov-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { previewCommand } from "@/lib/bim/commands";
import type { CommandPreview, CommandSelection } from "@/lib/bim/commands";
import type { Project } from "@/lib/bim/model";

type Props = {
  project: Project;
  selection: CommandSelection;
  onExecute: (preview: CommandPreview) => void;
};

export function AiCommandBar({ project, selection, onExecute }: Props) {
  const [command, setCommand] = useState("");
  const [preview, setPreview] = useState<CommandPreview | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const reset = () => {
    setPreview(null);
    setError("");
    setMessage("");
  };
  const interpret = () => {
    reset();
    try {
      setPreview(previewCommand(project, selection, command));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Befehl konnte nicht geprüft werden.");
    }
  };
  return (
    <div className="command-glass absolute bottom-5 left-1/2 z-30 w-[min(620px,calc(100%-32px))] -translate-x-1/2 rounded-xl border border-border p-2">
      <form
        className="flex items-center gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          interpret();
        }}
      >
        <img src={novikovLogo} alt="NOVIKOV" className="size-6 object-contain" />
        <div className="min-w-0 flex-1">
          <span className="block truncate px-2 text-[9px] text-muted-foreground">
            Lokale Modellbefehle · {selection?.id ?? "Kein Bauteil ausgewählt"}
          </span>
          <Input
            value={command}
            onChange={(event) => {
              setCommand(event.target.value);
              reset();
            }}
            placeholder="Wandlänge auf 6 m"
            aria-label="Modellbefehl"
            className="h-7 border-0 bg-transparent px-2 text-xs shadow-none"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled
          aria-label="Spracheingabe noch nicht verfügbar"
          title="Spracheingabe folgt in einem späteren Schritt"
        >
          <Mic />
        </Button>
        <Button type="submit" size="icon" disabled={!command.trim()} aria-label="Befehl prüfen">
          <ArrowUp />
        </Button>
      </form>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Wandlänge, Wandhöhe, Wandstärke, Fensterbreite, Fensterhöhe, Brüstungshöhe auf Zahl m/cm/mm
        · Fenster zentrieren
      </p>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-2 text-xs">
          {message}
        </p>
      )}
      {preview && (
        <div className="mt-2 border-t border-border pt-2">
          <p className="text-xs" aria-label="Befehlsvorschau">
            {preview.summary}
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              <X />
              Abbrechen
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                try {
                  onExecute(preview);
                  setPreview(null);
                  setCommand("");
                  setError("");
                  setMessage("Änderung übernommen.");
                } catch (error) {
                  setPreview(null);
                  setError(error instanceof Error ? error.message : "Änderung fehlgeschlagen.");
                }
              }}
            >
              <Check />
              Übernehmen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
