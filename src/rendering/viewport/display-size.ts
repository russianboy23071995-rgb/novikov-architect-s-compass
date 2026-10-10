import { positiveFinite, type DisplayLength, type ScaleContext } from "../../domain/views/scale.ts";
import { resolveModelLength } from "../../domain/views/display-size.ts";
export {
  resolveModelLength,
  resolvePaperLength,
  paperMillimetresToMetres,
} from "../../domain/views/display-size.ts";

export function resolveScreenLength(
  size: DisplayLength,
  context: ScaleContext | undefined,
  pixelsPerMetre: number,
): number {
  return positiveFinite(resolveModelLength(size, context) * positiveFinite(pixelsPerMetre));
}
