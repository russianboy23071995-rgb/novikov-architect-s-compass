import { validateLineStyle } from "../../domain/elements/line/style.ts";
import type { LineStyleDefinition } from "../../domain/elements/line/style.ts";
import type { LineAppearance } from "../../lib/bim/lines.ts";
/** Same application defaults for drawing and inspector; owned portable definition. */
export function applyLineStyle(
  appearance: LineAppearance,
  definition: LineStyleDefinition,
  repeatLength = 1,
): LineAppearance {
  if (!Number.isFinite(repeatLength) || repeatLength < 0.000001 || repeatLength > 1000000)
    throw new Error("Musterlänge muss positiv sein.");
  const pattern = validateLineStyle(definition);
  return {
    ...appearance,
    style: "custom",
    color: pattern.color,
    pattern: {
      ...pattern,
      dashes: [...pattern.dashes],
      segments: pattern.segments.map((s) => ({ start: { ...s.start }, end: { ...s.end } })),
    },
    repeatLength,
  };
}
