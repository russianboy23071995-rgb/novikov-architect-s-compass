import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import { doorDinHand, doorHingeForDinHand, type Door } from "../../domain/elements/door/model.ts";
import type { ElementTarget } from "../selection/target.ts";
import { updateDoor } from "./actions.ts";
import { openingLabel } from "../../domain/elements/wall/opening-marks.ts";

const units = { m: 1, cm: 100, mm: 1000 } as const;
const measures = {
  türbreite: { key: "width", label: "Türbreite" },
  türhöhe: { key: "height", label: "Türhöhe" },
  "z-versatz": { key: "zOffset", label: "Z-Versatz" },
} as const;

/** Bounded door grammar for text and voice (N19). Returns null when the text is no door
 * command, so other grammars can answer; never infers a target or ignores extra text.
 */
export function previewDoorCommand(
  project: Project,
  target: ElementTarget | null,
  text: string,
): { result: Project; summary: string } | null {
  const input = text.trim();
  const measure =
    /^(?:setze\s+)?(türbreite|türhöhe|z-versatz)\s+(?:auf\s+)?(-?\d+(?:[.,]\d+)?)\s*(mm|cm|m)$/iu.exec(
      input,
    );
  const centre = /^tür\s+zentrieren$/iu.test(input);
  const hinge = /^anschlag\s+(?:auf\s+)?(wandanfang|wandende)$/iu.exec(input);
  const swing = /^aufschlag\s+(?:nach\s+)?(links|rechts)$/iu.exec(input);
  const din = /^tür\s+din\s+(links|rechts)$/iu.exec(input);
  if (!measure && !centre && !hinge && !swing && !din) return null;
  if (target?.kind !== "door") throw new Error("Bitte zuerst eine Tür auswählen.");
  const door = storeyOf(project).doors?.find((d) => d.id === target.id);
  if (!door) throw new Error("Die ausgewählte Tür existiert nicht mehr.");
  let changes: Partial<Omit<Door, "id">>;
  let summary: string;
  const format = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 6 });
  if (measure) {
    const field = measures[measure[1]!.toLocaleLowerCase("de") as keyof typeof measures];
    const value =
      Number(measure[2]!.replace(",", ".")) /
      units[measure[3]!.toLowerCase() as keyof typeof units];
    if (!Number.isFinite(value) || (field.key !== "zOffset" && value <= 0))
      throw new Error("Breite und Höhe müssen größer als null sein; der Z-Versatz eine Zahl.");
    changes = { [field.key]: value };
    summary = `${openingLabel(door)} · ${field.label}: ${format(door[field.key])} → ${format(value)} m`;
  } else if (centre) {
    changes = { position: 0.5 };
    summary = `${openingLabel(door)} · Relative Türmitte: ${format(door.position)} → 0,5`;
  } else if (hinge) {
    const value = hinge[1]!.toLocaleLowerCase("de") === "wandanfang" ? "start" : "end";
    changes = { hinge: value };
    summary = `${openingLabel(door)} · Anschlag: Seite ${value === "start" ? "Wandanfang" : "Wandende"}`;
  } else if (din) {
    // DIN 107 handing keeps the swing side and moves the hinge jamb (user decision 24.10.2026).
    const hand = din[1]!.toLocaleLowerCase("de") as "links" | "rechts";
    changes = { hinge: doorHingeForDinHand(door, hand) };
    summary = `${openingLabel(door)} · DIN ${doorDinHand(door)} → DIN ${hand}`;
  } else {
    const value = swing![1]!.toLocaleLowerCase("de") === "links" ? "left" : "right";
    changes = { opensTo: value };
    summary = `${openingLabel(door)} · Aufschlag: ${value === "left" ? "links" : "rechts"} der Wandrichtung`;
  }
  try {
    return { result: updateDoor(project, door.id, changes), summary };
  } catch (error) {
    throw new Error(
      `Änderung nicht möglich: ${error instanceof Error ? error.message : "Die Tür muss vollständig in ihre Wand passen."}`,
    );
  }
}
