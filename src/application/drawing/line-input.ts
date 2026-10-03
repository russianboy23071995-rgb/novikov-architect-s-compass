import type { Point, Project } from "../../lib/bim/model.ts";
import { precisionTarget } from "../input/precision.ts";

/** Drawing-specific validation around the shared input; creation still uses addLine. */
export function previewLineInput(
  base: Project,
  current: Project,
  origin: Point,
  aim: Point | null,
  angle: string,
  length: string,
) {
  if (base !== current) throw new Error("Das Modell wurde geändert. Linie erneut beginnen.");
  const result = precisionTarget(origin, aim, angle, length);
  if (Math.hypot(result.point.x - origin.x, result.point.y - origin.y) === 0)
    throw new Error("Die Linie benötigt eine Länge größer als null.");
  return result;
}
