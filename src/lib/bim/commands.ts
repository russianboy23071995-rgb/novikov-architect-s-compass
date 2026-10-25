import { previewOffsetCommand } from "../../application/drawing/offset-command.ts";
import { serializeProject } from "./model.ts";
import type { Project } from "./model.ts";

export type CommandSelection = import("../../application/selection/target.ts").ElementTarget | null;
export type CommandPreview = {
  source: string;
  target: NonNullable<CommandSelection>;
  result: Project;
  summary: string;
};

/** Deliberately bounded grammar: never infer a target or silently ignore extra text.
 * Door, window and wall commands live in application (doors/windows/walls command.ts);
 * only the offset command remains here.
 */
export function previewCommand(
  project: Project,
  selection: CommandSelection,
  text: string,
): CommandPreview {
  const offset = previewOffsetCommand(project, selection, text);
  if (offset && selection)
    return { ...offset, target: { ...selection }, source: serializeProject(project) };
  throw new Error("Unbekannter Befehl. Beispiel: Wandlänge auf 6 m oder Fenster zentrieren.");
}

/** A preview may only commit against the exact model and selection it was prepared for. */
export function applyCommand(
  project: Project,
  selection: CommandSelection,
  preview: CommandPreview,
): Project {
  if (
    serializeProject(project) !== preview.source ||
    selection?.kind !== preview.target.kind ||
    selection?.id !== preview.target.id
  )
    throw new Error("Modell oder Auswahl geändert. Bitte den Befehl erneut prüfen.");
  return JSON.parse(serializeProject(preview.result)) as Project;
}
