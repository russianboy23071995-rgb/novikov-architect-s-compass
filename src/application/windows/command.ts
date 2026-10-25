import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../selection/target.ts";
import { openingLabel } from "../../domain/elements/wall/opening-marks.ts";
import { updateWindow } from "./actions.ts";

const units = { m: 1, cm: 100, mm: 1000 } as const;
const measures = {
  fensterbreite: { key: "width", label: "Fensterbreite" },
  fensterhöhe: { key: "height", label: "Fensterhöhe" },
  brüstungshöhe: { key: "sillHeight", label: "Brüstungshöhe" },
} as const;

/** Bounded window grammar for text and voice (N19), moved from lib/bim/commands.ts with the
 * same wording, units, limits and messages. Returns null when the text is no window command,
 * so other grammars can answer; never infers a target or ignores extra text.
 */
export function previewWindowCommand(
  project: Project,
  target: ElementTarget | null,
  text: string,
): { result: Project; summary: string } | null {
  const input = text.trim();
  const measure =
    /^(?:setze\s+)?(fensterbreite|fensterhöhe|brüstungshöhe)\s+(?:auf\s+)?(\d+(?:[.,]\d+)?)\s*(mm|cm|m)$/iu.exec(
      input,
    );
  const centred = /^fenster\s+zentrieren$/iu.test(input);
  if (!measure && !centred) return null;
  if (target?.kind !== "window") throw new Error("Bitte zuerst ein Fenster auswählen.");
  const field = measure
    ? measures[measure[1]!.toLocaleLowerCase("de") as keyof typeof measures]
    : { key: "position" as const, label: "Relative Fenstermitte" };
  const value = measure
    ? Number(measure[2]!.replace(",", ".")) / units[measure[3]!.toLowerCase() as keyof typeof units]
    : 0.5;
  if (!Number.isFinite(value) || value < 0 || (value === 0 && field.key !== "sillHeight"))
    throw new Error("Das Maß muss endlich und größer als null sein; die Brüstung darf null sein.");
  const opening = storeyOf(project).windows.find((w) => w.id === target.id);
  let result: Project;
  try {
    if (!opening) throw new Error("Missing target");
    result = updateWindow(project, opening.id, { [field.key]: value });
  } catch {
    throw new Error(
      "Änderung nicht möglich: Bauteil muss vorhanden sein und das Fenster vollständig in die Wand passen.",
    );
  }
  const format = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 6 });
  return {
    result,
    summary: `${openingLabel(opening)} · ${field.label}: ${format(opening[field.key])} → ${format(value)}${measure ? " m" : ""}`,
  };
}
