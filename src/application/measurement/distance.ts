import type { Point2 } from "../../geometry/primitives/point.ts";
import type { ToolInteraction } from "../tools/interaction.ts";
import { drawingSnapPolicy } from "../tools/snapping.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";
export type DistanceMeasurement = { start: Point2 | null; end: Point2 | null };
export const emptyMeasurement: DistanceMeasurement = { start: null, end: null };
export function distanceMetres(a: Point2, b: Point2): number {
  if (![a.x, a.y, b.x, b.y].every(Number.isFinite)) throw new Error("Ungültiger Messpunkt.");
  const value = Math.hypot(b.x - a.x, b.y - a.y);
  if (!Number.isFinite(value)) throw new Error("Messstrecke zu groß.");
  return value;
}
export function pickMeasurement(state: DistanceMeasurement, point: Point2): DistanceMeasurement {
  distanceMetres(point, point);
  if (!state.start || state.end) return { start: { ...point }, end: null };
  distanceMetres(state.start, point);
  return { start: state.start, end: { ...point } };
}
/** Read-only tool: publishes transient points, never a project or history action. */
export function distanceInteraction(
  state: DistanceMeasurement,
  publish: (next: DistanceMeasurement) => void,
  cancel: () => void,
): ToolInteraction {
  return pointMeasurementInteraction(
    state,
    state.end ? [] : state.start ? [state.start] : [],
    (point) => publish(pickMeasurement(state, point)),
    cancel,
  );
}
/** Shared input and snapping contract for transient point-based measurements. */
export function pointMeasurementInteraction(
  identity: object,
  points: readonly Point2[],
  pick: (point: Point2) => void,
  cancel: () => void,
): ToolInteraction {
  const origin = points.at(-1);
  return {
    identity,
    origin: origin ?? { x: 0, y: 0 },
    input: null,
    click: "confirm",
    snapping: origin
      ? drawingSnapPolicy(origin, points)
      : { origin: null, sources: (r) => [...r], resolve: querySnap },
    preview: () => {
      throw new Error("Messpunkte im Grundriss wählen.");
    },
    validate: (point) => {
      distanceMetres(point, point);
    },
    commit: pick,
    cancel,
  };
}
