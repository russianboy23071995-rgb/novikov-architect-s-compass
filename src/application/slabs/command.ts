import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { Slab } from "../../domain/elements/slab/model.ts";
import type { ElementTarget } from "../selection/target.ts";
import { updateSlab } from "./actions.ts";

const units = { m: 1, cm: 100, mm: 1000 } as const;
const measures = {
  deckenstärke: { key: "thickness", label: "Deckenstärke" },
  deckenversatz: { key: "topOffset", label: "Versatz OK" },
} as const;

/** Bounded slab grammar for text and voice (N19, docs/SLAB_ELEMENT.md Teil B3). Returns null
 * when the text is no slab command, so other grammars can answer; never infers a target.
 */
export function previewSlabCommand(
  project: Project,
  target: ElementTarget | null,
  text: string,
): { result: Project; summary: string } | null {
  const measure =
    /^(?:setze\s+)?(deckenstärke|deckenversatz)\s+(?:auf\s+)?(-?\d+(?:[.,]\d+)?)\s*(mm|cm|m)$/iu.exec(
      text.trim(),
    );
  if (!measure) return null;
  if (target?.kind !== "slab") throw new Error("Bitte zuerst eine Decke auswählen.");
  const slab = storeyOf(project).slabs?.find((s) => s.id === target.id);
  if (!slab) throw new Error("Die ausgewählte Decke existiert nicht mehr.");
  const field = measures[measure[1]!.toLocaleLowerCase("de") as keyof typeof measures];
  const value =
    Number(measure[2]!.replace(",", ".")) / units[measure[3]!.toLowerCase() as keyof typeof units];
  if (!Number.isFinite(value) || (field.key === "thickness" && value <= 0))
    throw new Error("Die Deckenstärke muss größer als null sein; der Versatz eine Zahl.");
  const format = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 6 });
  const changes: Partial<Omit<Slab, "id">> = { [field.key]: value };
  return {
    result: updateSlab(project, slab.id, changes),
    summary: `Decke · ${field.label}: ${format(slab[field.key])} → ${format(value)} m`,
  };
}
