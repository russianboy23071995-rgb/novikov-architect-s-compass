import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { Slab } from "../../domain/elements/slab/model.ts";
import type { ElementTarget } from "../selection/target.ts";
import { updateSlab } from "./actions.ts";
import { addSlabOpening } from "./openings.ts";

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
  const opening =
    /^(?:deckendurchbruch|durchbruch)\s+(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?$/iu.exec(
      text.trim(),
    );
  if (opening) return previewOpeningCommand(project, target, opening);
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

/** „Deckendurchbruch 1,20 x 0,80“ (docs/DECKENDURCHBRUCH.md): a rectangle of that size in X and
 * Y, centred in the outline box of the selected slab; the action refuses it outside the slab.
 */
function previewOpeningCommand(
  project: Project,
  target: ElementTarget | null,
  match: RegExpExecArray,
): { result: Project; summary: string } {
  if (target?.kind !== "slab") throw new Error("Bitte zuerst eine Decke auswählen.");
  const slab = storeyOf(project).slabs?.find((s) => s.id === target.id);
  if (!slab) throw new Error("Die ausgewählte Decke existiert nicht mehr.");
  // A unit after the depth also applies to the width („1,2 x 0,8 m“); none means metres.
  const unit = (raw: string | undefined) => units[(raw ?? "m").toLowerCase() as keyof typeof units];
  const width = Number(match[1]!.replace(",", ".")) / unit(match[2] ?? match[4]),
    depth = Number(match[3]!.replace(",", ".")) / unit(match[4]);
  if (!(width > 0) || !(depth > 0))
    throw new Error("Breite und Tiefe des Durchbruchs müssen größer als null sein.");
  const xs = slab.points.map((p) => p.x),
    ys = slab.points.map((p) => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2,
    cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const [x0, x1, y0, y1] = [cx - width / 2, cx + width / 2, cy - depth / 2, cy + depth / 2];
  const format = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 6 });
  return {
    result: addSlabOpening(project, {
      id: `slab-opening-${crypto.randomUUID()}`,
      slabId: slab.id,
      points: [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: x0, y: y1 },
      ],
    }),
    summary: `Deckendurchbruch ${format(width)} × ${format(depth)} m in der Mitte der Decke`,
  };
}
