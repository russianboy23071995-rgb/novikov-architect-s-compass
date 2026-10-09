import type { Hatch } from "../../domain/elements/hatch/model.ts";
import type { HatchPatternDefinition } from "../../domain/elements/hatch/pattern.ts";

/** Creator cells are x-right/y-down. Preserve their local orientation inside the world-space tile. */
export function hatchPatternTile(
  definition: HatchPatternDefinition,
  application: NonNullable<Hatch["pattern"]>,
) {
  const rotation = application.rotation ?? 0;
  if (!Number.isFinite(rotation) || rotation < 0 || rotation > 360) return null;
  return {
    x: application.origin.x,
    y: -application.origin.y - definition.height,
    width: definition.width,
    height: definition.height,
    viewBox: `0 0 ${definition.width} ${definition.height}`,
    patternTransform: `rotate(${-rotation} ${application.origin.x} ${-application.origin.y})`,
    lines: definition.lines,
  };
}
