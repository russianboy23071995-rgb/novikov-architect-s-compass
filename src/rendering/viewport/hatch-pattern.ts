import type { Hatch } from "../../domain/elements/hatch/model.ts";
import type { HatchPatternDefinition } from "../../domain/elements/hatch/pattern.ts";
import { positiveFinite, type ScaleContext } from "../../domain/views/scale.ts";
import { hatchCellSize } from "../../domain/elements/hatch/sizing.ts";

/** Optional explicit display override for isolated diagnostics; product reads the application. */
export type HatchPatternSizing =
  | { mode: "model"; modelWidthMetres?: number }
  | { mode: "paper"; paperWidthMetres: number; context: ScaleContext };

export function hatchPatternStroke(pixelsPerMetre: number, factor: number): number {
  return positiveFinite(
    1 / positiveFinite(positiveFinite(pixelsPerMetre) * positiveFinite(factor)),
  );
}

/** Creator cells are x-right/y-down. Preserve their local orientation inside the world-space tile. */
export function hatchPatternTile(
  definition: HatchPatternDefinition,
  application: NonNullable<Hatch["pattern"]>,
  sizing?: HatchPatternSizing,
  context?: ScaleContext,
) {
  const rotation = application.rotation ?? 0;
  if (!Number.isFinite(rotation) || rotation < 0 || rotation > 360) return null;
  positiveFinite(definition.width);
  positiveFinite(definition.height);
  const size = sizing ?? application;
  if (size.mode !== "model" && size.mode !== "paper") throw new Error("Ungültiger Mustermaßbezug.");
  const { width, height, factor } = hatchCellSize(
    definition,
    size,
    sizing?.mode === "paper" ? sizing.context : context,
  );
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
