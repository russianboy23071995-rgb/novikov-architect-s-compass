import { positiveFinite, type ScaleContext } from "../../views/scale.ts";
import { resolveModelLength } from "../../views/display-size.ts";
import type { HatchPatternSize } from "./model.ts";
import type { HatchPatternDefinition } from "./pattern.ts";

export function hatchCellSize(
  definition: HatchPatternDefinition,
  size: HatchPatternSize,
  context?: ScaleContext,
) {
  const width = resolveModelLength(
    {
      mode: size.mode,
      metres:
        size.mode === "paper" ? size.paperWidthMetres : (size.modelWidthMetres ?? definition.width),
    },
    context,
  );
  const factor = positiveFinite(width / positiveFinite(definition.width));
  return { width, height: positiveFinite(positiveFinite(definition.height) * factor), factor };
}
