import type { Point2 } from "../../geometry/primitives/point.ts";
import { includedAngle } from "../../geometry/primitives/angle.ts";
import { distanceMetres } from "./distance.ts";
export type AngleMeasurement = { points: readonly Point2[]; degrees: number | null };
export const emptyAngle: AngleMeasurement = { points: [], degrees: null };
export function pickAngle(state: AngleMeasurement, point: Point2): AngleMeasurement {
  distanceMetres(point, point);
  const points = state.degrees === null ? state.points : [];
  if (points.length === 1 && distanceMetres(points[0]!, point) === 0)
    throw new Error("Scheitel muss vom ersten Punkt verschieden sein.");
  const next = [...points, { ...point }];
  return {
    points: next,
    degrees: next.length === 3 ? includedAngle(next[0]!, next[1]!, next[2]!) : null,
  };
}
