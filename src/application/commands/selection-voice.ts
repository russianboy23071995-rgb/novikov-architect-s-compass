import { normalizeSpeech, startVoice, type RecognitionConstructor } from "../../lib/bim/voice.ts";
import { previewSelectionCommand, type SelectionCommandPreview } from "./selection-command.ts";
import { eligibleSelection, type SelectionSet } from "../selection/state.ts";
import { sameTargets } from "../selection/move.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";
export type VoiceSelectionContext = {
  project: Project;
  targets: SelectionSet;
  visibility: LayerVisibilityPolicy;
};
/** Context identity is a revision token: returning to an earlier selection cannot revive audio. */
export function startSelectionVoice(
  RecognitionClass: RecognitionConstructor,
  context: VoiceSelectionContext,
  current: () => VoiceSelectionContext,
  callbacks: {
    transcript: (text: string) => void;
    preview: (preview: SelectionCommandPreview) => void;
    error: (message: string) => void;
    end: () => void;
  },
): () => void {
  if (
    !context.targets.length ||
    !sameTargets(
      context.targets,
      eligibleSelection(context.project, context.visibility, context.targets),
    )
  )
    throw new Error("Bitte zuerst sichtbare Elemente auswählen.");
  const targets = context.targets.map((t) => ({ ...t }));
  let cancelled = false;
  const valid = () => !cancelled && current() === context && sameTargets(context.targets, targets);
  const stop = startVoice(RecognitionClass, {
    end: callbacks.end,
    error: (message) => {
      if (valid()) callbacks.error(message);
    },
    result: (transcript) => {
      if (!valid()) return;
      const text = normalizeSpeech(transcript);
      callbacks.transcript(text);
      try {
        const preview = previewSelectionCommand(context.project, targets, context.visibility, text);
        if (valid()) callbacks.preview(preview);
      } catch (error) {
        if (valid())
          callbacks.error(error instanceof Error ? error.message : "Befehl nicht erkannt.");
      }
    },
  });
  return () => {
    cancelled = true;
    stop();
  };
}
