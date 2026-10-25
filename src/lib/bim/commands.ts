import { storeyOf } from "../../domain/storeys/access.ts";
import { previewOffsetCommand } from "../../application/drawing/offset-command.ts";
import { serializeProject, updateWall, wallLength } from "./model.ts";
import type { Project } from "./model.ts";

export type CommandSelection = import("../../application/selection/target.ts").ElementTarget | null;
export type CommandPreview = {
  source: string;
  target: NonNullable<CommandSelection>;
  result: Project;
  summary: string;
};

/** Deliberately bounded grammar: never infer a target or silently ignore extra text.
 * Window commands moved to application/windows/command.ts; only wall commands remain here.
 */
export function previewCommand(
  project: Project,
  selection: CommandSelection,
  text: string,
): CommandPreview {
  const offset = previewOffsetCommand(project, selection, text);
  if (offset && selection)
    return { ...offset, target: { ...selection }, source: serializeProject(project) };
  const match =
    /^(?:setze\s+)?(wandlänge|wandhöhe|wandstärke)\s+(?:auf\s+)?(\d+(?:[.,]\d+)?)\s*(mm|cm|m)$/iu.exec(
      text.trim(),
    );
  if (!match)
    throw new Error("Unbekannter Befehl. Beispiel: Wandlänge auf 6 m oder Fenster zentrieren.");
  const field = match[1]!.toLocaleLowerCase("de");
  if (!selection || selection.kind !== "wall") throw new Error("Bitte zuerst eine Wand auswählen.");
  const value =
    Number(match[2]!.replace(",", ".")) / { m: 1, cm: 100, mm: 1000 }[match[3]!.toLowerCase()]!;
  if (!Number.isFinite(value) || value <= 0)
    throw new Error("Das Maß muss endlich und größer als null sein; die Brüstung darf null sein.");
  let result: Project;
  let previous: number;
  try {
    const wall = storeyOf(project).walls.find((w) => w.id === selection.id);
    if (!wall) throw new Error("Missing target");
    previous =
      field === "wandlänge"
        ? wallLength(wall)
        : field === "wandhöhe"
          ? wall.height
          : wall.thickness;
    const changes =
      field === "wandlänge"
        ? {
            end: {
              x: wall.start.x + ((wall.end.x - wall.start.x) * value) / previous,
              y: wall.start.y + ((wall.end.y - wall.start.y) * value) / previous,
            },
          }
        : field === "wandhöhe"
          ? { height: value }
          : { thickness: value };
    result = updateWall(project, wall.id, changes);
  } catch {
    throw new Error(
      "Änderung nicht möglich: Bauteil muss vorhanden sein und das Fenster vollständig in die Wand passen.",
    );
  }
  const format = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 6 });
  return {
    source: serializeProject(project),
    target: { ...selection },
    result,
    summary: `${selection.id} · ${field}: ${format(previous)} → ${format(value)} m`,
  };
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
