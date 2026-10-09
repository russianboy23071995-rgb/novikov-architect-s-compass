import {
  hatchPatternSizeSchema,
  type HatchPatternSize,
} from "../../domain/elements/hatch/model.ts";
import { hatchCellSize } from "../../domain/elements/hatch/sizing.ts";
import type { HatchPatternDefinition } from "../../domain/elements/hatch/pattern.ts";
import { resolvePaperLength } from "../../domain/views/display-size.ts";
import type { ScaleContext } from "../../domain/views/scale.ts";

/** Mode change preserves current cell size without touching definition or contour. */
export function changeHatchSizeMode(
  definition: HatchPatternDefinition,
  previous: HatchPatternSize,
  mode: "model" | "paper",
  context: ScaleContext,
): HatchPatternSize {
  const size = hatchPatternSizeSchema.parse(previous);
  if (size.mode === mode) return size;
  const { width } = hatchCellSize(definition, size, context);
  return mode === "paper"
    ? { mode, paperWidthMetres: resolvePaperLength(width, context) }
    : width === definition.width
      ? { mode }
      : { mode, modelWidthMetres: width };
}
export function patternSize(pattern: HatchPatternSize | null | undefined): HatchPatternSize {
  if (!pattern) return { mode: "model" };
  return pattern.mode === "paper"
    ? { mode: "paper", paperWidthMetres: pattern.paperWidthMetres }
    : {
        mode: "model",
        ...(pattern.modelWidthMetres === undefined
          ? {}
          : { modelWidthMetres: pattern.modelWidthMetres }),
      };
}
