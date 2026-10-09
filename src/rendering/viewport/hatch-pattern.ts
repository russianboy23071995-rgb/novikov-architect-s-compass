import type { Hatch } from "../../domain/elements/hatch/model.ts";
import type { HatchPatternDefinition } from "../../domain/elements/hatch/pattern.ts";
import { positiveFinite, type ScaleContext } from "../../domain/views/scale.ts";
import { resolveModelLength } from "./display-size.ts";

/** Derived display input only. Production hatch storage remains model-space. */
export type HatchPatternSizing =
  { mode: "model" } | { mode: "paper"; paperWidthMetres: number; context: ScaleContext };

export function hatchPatternStroke(pixelsPerMetre: number, factor: number): number {
  return positiveFinite(
    1 / positiveFinite(positiveFinite(pixelsPerMetre) * positiveFinite(factor)),
  );
}

/** Creator cells are x-right/y-down. Preserve their local orientation inside the world-space tile. */
export function hatchPatternTile(
  definition: HatchPatternDefinition,
  application: NonNullable<Hatch["pattern"]>,
  sizing: HatchPatternSizing = { mode: "model" },
) {
  const rotation = application.rotation ?? 0;
  if (!Number.isFinite(rotation) || rotation < 0 || rotation > 360) return null;
  positiveFinite(definition.width);
  positiveFinite(definition.height);
  if (sizing.mode !== "model" && sizing.mode !== "paper")
    throw new Error("Ungültiger Mustermaßbezug.");
  const width =
    sizing.mode === "paper"
      ? resolveModelLength({ mode: "paper", metres: sizing.paperWidthMetres }, sizing.context)
      : resolveModelLength({ mode: "model", metres: definition.width });
  const factor = positiveFinite(width / definition.width);
  const height = positiveFinite(definition.height * factor);
  const y = -application.origin.y - height;
  if (![application.origin.x, application.origin.y, y].every(Number.isFinite))
    throw new Error("Ungültiger Musterursprung oder Kachelausdehnung.");
  return {
    x: application.origin.x,
    y,
    width,
    height,
    factor,
    viewBox: `0 0 ${definition.width} ${definition.height}`,
    patternTransform: `rotate(${-rotation} ${application.origin.x} ${-application.origin.y})`,
    lines: definition.lines,
  };
}
