import { pointsCompatible } from "../tolerances/model.ts";
import { replacePathVertex, type Point2 } from "../primitives/point.ts";

/**
 * Vertex lists of point-edited elements (docs/POLYGON_REGELN.md, Regel 2):
 * - "ring": closed outline with implicit closure (hatch, slab, …), at least 3 corners.
 * - "path": polyline; closed when its last point repeats the first, then at least 3 corners,
 *   otherwise at least 2 points.
 */
export type VertexShape = "ring" | "path";

/**
 * Moving a vertex onto another vertex of the same element deletes the moved vertex. Returns
 * the remaining vertices, or null when `position` meets no other vertex (a normal move).
 * Exception: on an open path an end point placed on the other end point closes the path
 * (normal move), as before. Throws when too few vertices would remain.
 */
export function mergeOntoVertex(
  points: readonly Point2[],
  index: number,
  position: Point2,
  shape: VertexShape,
): Point2[] | null {
  if (!Number.isInteger(index) || index < 0 || index >= points.length)
    throw new Error("Ungültiger Punkt.");
  const last = points.length - 1;
  const closedPath =
    shape === "path" &&
    points.length > 2 &&
    points[0]!.x === points[last]!.x &&
    points[0]!.y === points[last]!.y;
  // Distinct corners: a closed path repeats its start, which is the same corner.
  const corners = closedPath ? points.slice(0, last) : points.slice();
  const moved = closedPath && index === last ? 0 : index;
  const met = corners.findIndex((p, i) => i !== moved && pointsCompatible(p, position));
  if (met < 0) return null;
  if (shape === "path" && !closedPath && moved + met === last && (moved === 0 || met === 0))
    return null;
  const minimum = shape === "ring" || closedPath ? 3 : 2;
  if (corners.length - 1 < minimum)
    throw new Error(
      minimum === 3
        ? "Mindestens drei Ecken müssen bleiben; die Ecke kann nicht gelöscht werden."
        : "Mindestens zwei Punkte müssen bleiben; der Punkt kann nicht gelöscht werden.",
    );
  const remaining = corners.filter((_, i) => i !== moved).map((p) => ({ ...p }));
  return closedPath ? [...remaining, { ...remaining[0]! }] : remaining;
}

/** Moved vertex list: the vertex merges into a met vertex, otherwise it takes `position`. */
export function moveVertex(
  points: readonly Point2[],
  index: number,
  position: Point2,
  shape: VertexShape,
): Point2[] {
  return (
    mergeOntoVertex(points, index, position, shape) ?? replacePathVertex(points, index, position)
  );
}
