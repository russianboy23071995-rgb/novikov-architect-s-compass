import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Mic, X } from "lucide-react";
import novikovLogo from "@/assets/novikov-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { previewCommand } from "@/lib/bim/commands";
import type { CommandPreview, CommandSelection } from "@/lib/bim/commands";
import type { Project } from "@/lib/bim/model";
import { normalizeSpeech, recognitionConstructor, startVoice } from "@/lib/bim/voice";

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
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const cancelVoice = useRef<(() => void) | null>(null);
  useEffect(() => {
    setVoiceAvailable(Boolean(recognitionConstructor(window)));
  }, []);
  useEffect(
    () => () => {
      cancelVoice.current?.();
      cancelVoice.current = null;
    },
    [project, selection?.kind, selection?.id],
  );
  const listen = () => {
    if (listening) {
      cancelVoice.current?.();
      setMessage("Aufnahme abgebrochen.");
      return;
    }
    const RecognitionClass = recognitionConstructor(window);
    if (!RecognitionClass || !selection) return;
    reset();
    setListening(true);
    setMessage(`Aufnahme für ${selection.id} …`);
    cancelVoice.current = startVoice(RecognitionClass, {
      end: () => {
        setListening(false);
        setMessage("");
      },
      error: setError,
      result: (transcript) => {
        const text = normalizeSpeech(transcript);
        setCommand(text);
        try {
          setPreview(previewCommand(project, selection, text));
        } catch (error) {
          setError(error instanceof Error ? error.message : "Befehl nicht erkannt.");
        }
      },
    });
  };
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
            disabled={listening}
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
          disabled={
            !voiceAvailable || !selection || selection.kind === "line" || selection.kind === "hatch"
          }
          onClick={listen}
          aria-label={listening ? "Aufnahme abbrechen" : "Spracheingabe starten"}
          aria-pressed={listening}
          title={
            !voiceAvailable
              ? "Browser unterstützt keine Spracherkennung"
              : !selection
                ? "Zuerst Bauteil auswählen"
                : "Sprachbefehl für ausgewähltes Bauteil"
          }
        >
          <Mic />
        </Button>
        <Button
          type="submit"
          size="icon"
          disabled={listening || !command.trim()}
          aria-label="Befehl prüfen"
        >
          <ArrowUp />
        </Button>
      </form>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Wandlänge, Wandhöhe, Wandstärke, Fensterbreite, Fensterhöhe, Brüstungshöhe auf Zahl m/cm/mm
        · Fenster zentrieren
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {voiceAvailable
          ? "Mikrofon startet nur per Klick. Der Browser kann Audio an seinen Spracherkennungsdienst senden. Auswahlwechsel beendet die Aufnahme."
          : "Spracherkennung in diesem Browser nicht verfügbar. Textbefehle bleiben nutzbar."}
      </p>
      {selection?.kind === "hatch" && (
        <p className="px-2 text-xs text-muted-foreground">
          Schraffurfüllung über die Eigenschaften ändern; Schraffurbefehle folgen später.
        </p>
      )}
      {selection?.kind === "line" && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          Linienstile über die Eigenschaften ändern; Linienbefehle folgen später.
        </p>
      )}
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
