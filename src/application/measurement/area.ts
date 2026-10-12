import type { Point2 } from "../../geometry/primitives/point.ts";
import { validateSimplePolygon } from "../../geometry/polygons/simple-polygon.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
import { distanceMetres } from "./distance.ts";
export type AreaMeasurement = { points: readonly Point2[]; squareMetres: number | null };
export const emptyArea: AreaMeasurement = { points: [], squareMetres: null };
export function pickArea(state: AreaMeasurement, point: Point2): AreaMeasurement {
  distanceMetres(point, point);
  const points = state.squareMetres === null ? state.points : [];
  // A double click or exact closure must not introduce a duplicate edge.
  if (points.length && pointsCompatible(points.at(-1)!, point)) return state;
  return { points: [...points, { ...point }], squareMetres: null };
}
export function finishArea(state: AreaMeasurement): AreaMeasurement {
  const points =
    state.points.length > 1 && pointsCompatible(state.points[0]!, state.points.at(-1)!)
      ? state.points.slice(0, -1)
      : state.points;
  const result = validateSimplePolygon(points);
  if (!result.valid) {
    if (result.reason === "too-few-vertices") throw new Error("Mindestens drei Messpunkte wählen.");
    if (result.reason === "edge-contact")
      throw new Error("Messkontur darf sich nicht kreuzen oder berühren.");
    throw new Error("Messkontur benötigt eine gültige Fläche ohne doppelte Punkte.");
  }
  return { points, squareMetres: Math.abs(result.signedArea) };
}
