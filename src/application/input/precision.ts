import { parseMetres } from "../../core/units/metres.ts";
import { resolvePolarInput } from "../../constraints/input/polar.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";

/** Shared text adapter for every polar tool, with no BIM or React dependencies. */
export function precisionTarget(
  origin: Point2,
  aim: Point2 | null,
  angleText: string,
  lengthText: string,
) {
  const parse = (text: string, label: string) => {
    if (!text.trim()) return null;
    const value = parseMetres(text);
    if (!Number.isFinite(value)) throw new Error(label + " muss eine endliche Zahl sein.");
    return value;
  };
  return resolvePolarInput(origin, aim, parse(angleText, "Winkel"), parse(lengthText, "Länge"));
}

/**
 * A key that starts a typed length (docs/ANPASSUNGSLISTE.md, E1): a digit, the decimal comma or
 * point, or a minus; never with Ctrl, Alt or Meta, which belong to shortcuts.
 */
export function startsTypedValue(event: {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}): boolean {
  return !event.ctrlKey && !event.altKey && !event.metaKey && /^[0-9.,-]$/.test(event.key);
}
