import type { CalibrationContext } from "@/application/references/calibration";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Check, Mic, X } from "lucide-react";
import novikovLogo from "@/assets/novikov-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  previewSelectionCommand,
  selectionCommandIsCurrent,
  type SelectionCommandPreview,
} from "@/application/commands/selection-command";
import { singleTarget, type SelectionSet } from "@/application/selection/state";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import type { Project } from "@/lib/bim/model";
import { recognitionConstructor } from "@/lib/bim/voice";
import { startSelectionVoice } from "@/application/commands/selection-voice";

type Props = {
  calibration?: CalibrationContext | undefined;
  project: Project;
  targets: SelectionSet;
  visibility: LayerVisibilityPolicy;
  onExecute: (preview: SelectionCommandPreview) => void;
  onFocus?: () => void;
};

export function AiCommandBar({
  project,
  targets,
  visibility,
  onExecute,
  onFocus,
  calibration,
}: Props) {
  const selection = singleTarget(targets);
  const selectionCount = targets.length;
  const [command, setCommand] = useState("");
  const [preview, setPreview] = useState<SelectionCommandPreview | null>(null);
  const activePreview =
    preview && selectionCommandIsCurrent(project, targets, visibility, preview, calibration)
      ? preview
      : null;
  useEffect(() => {
    setPreview(null);
  }, [project, targets, visibility, calibration]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const cancelVoice = useRef<(() => void) | null>(null);
  const voiceContext = useMemo(
    () => ({ project, targets, visibility, calibration }),
    [project, targets, visibility, calibration],
  );
  const latestContext = useRef(voiceContext);
  latestContext.current = voiceContext;
  useEffect(() => {
    setVoiceAvailable(Boolean(recognitionConstructor(window)));
  }, []);
  useEffect(
    () => () => {
      cancelVoice.current?.();
      cancelVoice.current = null;
    },
    [voiceContext],
  );
  const listen = () => {
    if (listening) {
      cancelVoice.current?.();
      setMessage("Aufnahme abgebrochen.");
      return;
    }
    const RecognitionClass = recognitionConstructor(window);
    if (!RecognitionClass || !targets.length) return;
    reset();
    setListening(true);
    setMessage(`Aufnahme für ${targets.length} ausgewählte Elemente …`);
    try {
      cancelVoice.current = startSelectionVoice(
        RecognitionClass,
        voiceContext,
        () => latestContext.current,
        {
          end: () => {
            setListening(false);
            setMessage("");
          },
          error: setError,
          transcript: setCommand,
          preview: setPreview,
        },
      );
    } catch (error) {
      setListening(false);
      setMessage("");
      setError(error instanceof Error ? error.message : "Aufnahme nicht möglich.");
    }
  };
  const reset = () => {
    setPreview(null);
    setError("");
    setMessage("");
  };
  const interpret = () => {
    reset();
    try {
      setPreview(previewSelectionCommand(project, targets, visibility, command, calibration));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Befehl konnte nicht geprüft werden.");
    }
  };
  return (
    <div className="command-glass absolute bottom-5 left-1/2 z-30 w-[min(620px,calc(100%-32px))] -translate-x-1/2 rounded-xl border border-border p-2">
      <form
        onFocus={onFocus}
        className="flex items-center gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          interpret();
        }}
      >
        <img src={novikovLogo} alt="NOVIKOV" className="size-6 object-contain" />
        <div className="min-w-0 flex-1">
          <span className="block truncate px-2 text-[9px] text-muted-foreground">
            Lokale Modellbefehle ·{" "}
            {selectionCount > 1
              ? `${selectionCount} Elemente ausgewählt`
              : (selection?.id ?? "Kein Bauteil ausgewählt")}
          </span>
          <Input
            disabled={listening}
            value={command}
            onChange={(event) => {
              setCommand(event.target.value);
              reset();
            }}
            placeholder={
              calibration
                ? "Referenz auf 5 m kalibrieren"
                : selectionCount > 1
                  ? "Auswahl um 2 m bei 90 Grad verschieben"
                  : "Wandlänge auf 6 m"
            }
            aria-label="Modellbefehl"
            className="h-7 border-0 bg-transparent px-2 text-xs shadow-none"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!voiceAvailable || !targets.length}
          onClick={listen}
          aria-label={listening ? "Aufnahme abbrechen" : "Spracheingabe starten"}
          aria-pressed={listening}
          title={
            !voiceAvailable
              ? "Browser unterstützt keine Spracherkennung"
              : !targets.length
                ? "Zuerst Elemente auswählen"
                : "Sprachbefehl für die gesamte Auswahl"
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
        · Fenster zentrieren · Auswahl um 2 m bei 90 Grad verschieben
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {voiceAvailable
          ? "Mikrofon startet nur per Klick. Der Browser kann Audio an seinen Spracherkennungsdienst senden. Auswahlwechsel beendet die Aufnahme."
          : "Spracherkennung in diesem Browser nicht verfügbar. Textbefehle bleiben nutzbar."}
      </p>
      {selection?.kind === "reference" && (
        <p className="mt-1 text-xs">
          {calibration
            ? "Zwei Messpunkte gebunden. Befehl: Referenz auf 5 m kalibrieren."
            : "Zuerst im On-Demand-Menü zwei Messpunkte für die Kalibrierung aufnehmen."}
        </p>
      )}
      {selection?.kind === "hatch" && (
        <p className="px-2 text-xs text-muted-foreground">
          Schraffurfüllung über die Eigenschaften ändern; Befehle zur Füllung folgen später.
        </p>
      )}
      {selection?.kind === "line" && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          Linienstile über die Eigenschaften ändern; Stilbefehle folgen später.
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
      {activePreview && (
        <div className="mt-2 border-t border-border pt-2">
          <p className="text-xs" aria-label="Befehlsvorschau">
            {activePreview.summary}
          </p>
          <details className="mt-1 text-xs">
            <summary>Ziele ({activePreview.targets.length})</summary>
            <ul className="max-h-24 overflow-auto">
              {activePreview.targets.map((t) => (
                <li key={`${t.kind}:${t.id}`}>
                  {t.kind}: {t.id}
                </li>
              ))}
            </ul>
          </details>
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
                  onExecute(activePreview);
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
