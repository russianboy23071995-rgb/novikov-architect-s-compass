import type { Point, Project } from "../../domain/project/schema.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";
import { isLayerVisible } from "../layers/visibility.ts";
import { validateSimplePolygon } from "../../geometry/polygons/simple-polygon.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
export type HatchConstruction = "polygon" | "diagonal" | "side-height" | "boundary";
export { rectangleContour } from "../../geometry/polygons/rectangle.ts";
import { contains } from "../../geometry/polygons/contains.ts";
/** Prepare only visible, explicit, simple closed 2D contours once per model/context.
 * Nested hits resolve to smallest containing area; equal areas retain source order. */
export function prepareHatchBoundaries(project: Project, visibility: LayerVisibilityPolicy) {
  const contours = [...(project.storey.lines ?? []), ...project.storey.hatches]
    .flatMap((line) => {
      const points = line.points;
      if (
        !isLayerVisible(project, visibility, line.id) ||
        points.length < 3 ||
        (line.kind !== "hatch" &&
          (points.length < 4 || !pointsCompatible(points[0]!, points.at(-1)!)))
      )
        return [];
      const ring = line.kind === "hatch" ? points : points.slice(0, -1),
        valid = validateSimplePolygon(ring);
      return valid.valid ? [{ points: ring, area: Math.abs(valid.signedArea) }] : [];
    })
    .sort((a, b) => a.area - b.area);
  return (point: Point): Point[] =>
    contours.find((c) => contains(c.points, point))?.points.map((p) => ({ ...p })) ?? [];
}
