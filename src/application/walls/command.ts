import { storeyOf } from "../../domain/storeys/access.ts";
import { wallLength, type Project } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../selection/target.ts";
import { updateWall } from "./actions.ts";
import { commandFailure } from "../commands/failure.ts";

const units = { m: 1, cm: 100, mm: 1000 } as const;
const labels = { wandlänge: "Wandlänge", wandhöhe: "Wandhöhe", wandstärke: "Wandstärke" } as const;

/** Bounded wall grammar for text and voice (N19), moved from lib/bim/commands.ts with the same
 * wording, units, limits and messages. Returns null when the text is no wall command, so other
 * grammars can answer; never infers a target or ignores extra text.
 */
export function previewWallCommand(
  project: Project,
  target: ElementTarget | null,
  text: string,
): { result: Project; summary: string } | null {
  const match =
    /^(?:setze\s+)?(wandlänge|wandhöhe|wandstärke)\s+(?:auf\s+)?(\d+(?:[.,]\d+)?)\s*(mm|cm|m)$/iu.exec(
      text.trim(),
    );
  if (!match) return null;
  const field = match[1]!.toLocaleLowerCase("de") as keyof typeof labels;
  if (target?.kind !== "wall") throw new Error("Bitte zuerst eine Wand auswählen.");
  const value =
    Number(match[2]!.replace(",", ".")) / units[match[3]!.toLowerCase() as keyof typeof units];
  if (!Number.isFinite(value) || value <= 0)
    throw new Error("Das Maß muss endlich und größer als null sein; die Brüstung darf null sein.");
  let result: Project;
  let previous: number;
  try {
    const wall = storeyOf(project).walls.find((w) => w.id === target.id);
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
  } catch (error) {
    throw commandFailure(error);
  }
  const format = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 6 });
  return {
    result,
    summary: `${target.id} · ${labels[field]}: ${format(previous)} → ${format(value)} m`,
  };
}
