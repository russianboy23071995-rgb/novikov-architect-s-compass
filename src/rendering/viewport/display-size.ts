import {
  positiveFinite,
  validateScaleContext,
  type DisplayLength,
  type ScaleContext,
} from "../../domain/views/scale.ts";

/** Paper sizes and model sizes both enter in metres; camera zoom is deliberately absent. */
export function resolveModelLength(size: DisplayLength, context?: ScaleContext): number {
  positiveFinite(size.metres);
  if (size.mode === "model") return size.metres;
  if (size.mode !== "paper" || !context)
    throw new Error("Papiermaß benötigt einen Ansichtskontext.");
  return positiveFinite(size.metres * validateScaleContext(context).denominator);
}

export function resolveScreenLength(
  size: DisplayLength,
  context: ScaleContext | undefined,
  pixelsPerMetre: number,
): number {
  return positiveFinite(resolveModelLength(size, context) * positiveFinite(pixelsPerMetre));
}

export function resolvePaperLength(modelMetres: number, context: ScaleContext): number {
  return positiveFinite(positiveFinite(modelMetres) / validateScaleContext(context).denominator);
}

export function paperMillimetresToMetres(paperMillimetres: number): number {
  return positiveFinite(positiveFinite(paperMillimetres) / 1000);
}
