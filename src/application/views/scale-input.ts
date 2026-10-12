import { positiveFinite } from "../../domain/views/scale.ts";

/** Accept a denominator or 1:S; never parse a prefix of an invalid expression. */
export function parseOutputScale(text: string): number {
  const match = /^(?:1\s*:\s*)?(\d+(?:[.,]\d+)?)$/.exec(text.trim());
  if (!match) throw new Error("Maßstab als 1:50 oder positive Zahl eingeben.");
  return positiveFinite(Number(match[1]!.replace(",", ".")));
}
