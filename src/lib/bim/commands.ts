import { serializeProject, updateWall, updateWindow, wallLength } from "./model.ts";
import type { Project } from "./model.ts";

export type CommandSelection = { kind: "wall" | "window"; id: string } | null;
export type CommandPreview = {
  source: string;
  target: NonNullable<CommandSelection>;
  result: Project;
  summary: string;
};

/** Deliberately bounded grammar: never infer a target or silently ignore extra text. */
export function previewCommand(
  project: Project,
  selection: CommandSelection,
  text: string,
): CommandPreview {
  const match =
    /^(?:setze\s+)?(wandlänge|wandhöhe|wandstärke|fensterbreite|fensterhöhe|brüstungshöhe)\s+(?:auf\s+)?(\d+(?:[.,]\d+)?)\s*(mm|cm|m)$/iu.exec(
      text.trim(),
    );
  const centred = /^fenster\s+zentrieren$/iu.test(text.trim());
  if (!match && !centred)
    throw new Error("Unbekannter Befehl. Beispiel: Wandlänge auf 6 m oder Fenster zentrieren.");
  const field = match?.[1]?.toLocaleLowerCase("de") ?? "zentrieren";
  const kind = field.startsWith("wand") ? "wall" : "window";
  if (!selection || selection.kind !== kind)
    throw new Error(
      kind === "wall" ? "Bitte zuerst eine Wand auswählen." : "Bitte zuerst ein Fenster auswählen.",
    );
  const value = centred
    ? 0.5
    : Number(match![2]!.replace(",", ".")) / { m: 1, cm: 100, mm: 1000 }[match![3]!.toLowerCase()]!;
  if (!Number.isFinite(value) || value < 0 || (value === 0 && field !== "brüstungshöhe"))
    throw new Error("Das Maß muss endlich und größer als null sein; die Brüstung darf null sein.");
  let result: Project;
  let previous: number;
  try {
    if (kind === "wall") {
      const wall = project.storey.walls.find((w) => w.id === selection.id);
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
    } else {
      const opening = project.storey.windows.find((w) => w.id === selection.id);
      if (!opening) throw new Error("Missing target");
      const key =
        field === "fensterbreite"
          ? "width"
          : field === "fensterhöhe"
            ? "height"
            : field === "brüstungshöhe"
              ? "sillHeight"
              : "position";
      previous = opening[key];
      result = updateWindow(project, opening.id, { [key]: value });
    }
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
    summary: `${selection.id} · ${centred ? "Relative Fenstermitte" : field}: ${format(previous)} → ${format(value)}${centred ? "" : " m"}`,
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
