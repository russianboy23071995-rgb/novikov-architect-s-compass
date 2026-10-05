import type { Wall } from "../../project/schema.ts";
import type { Point2 } from "../../../geometry/primitives/point.ts";
import { intersectLines } from "../../../geometry/intersections/lines.ts";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";
import { pointsCompatible, coordinatesCompatible } from "../../../geometry/tolerances/model.ts";
import { wallBody } from "./body.ts";

export type CornerEnd = {
  wall: Pick<Wall, "id" | "start" | "end" | "thickness" | "height" | "bodyOffset">;
  endpoint: 0 | 1;
};
const RIGHT_ANGLE_DOT_TOLERANCE = 1e-10; // Dimensionless; not a distance or snap radius.

/** Gross contours only, not an opening-aware body or a persistent connection.
 * Explicit endpoint pair; no neighbour search, mutations or automatic join creation.
 * Callers must separately validate project membership, openings and other joins.
 */
export function deriveRightAngleCorner(first: CornerEnd, second: CornerEnd) {
  const ends = [first, second].sort((a, b) => (a.wall.id < b.wall.id ? -1 : 1));
  if (!first.wall.id.trim() || !second.wall.id.trim() || first.wall.id === second.wall.id)
    throw new Error("Zwei unterschiedliche Wand-IDs erforderlich.");
  for (const { wall, endpoint } of ends) {
    if (endpoint !== 0 && endpoint !== 1) throw new Error("Ungültiger Wandendpunkt.");
    if (
      ![
        wall.start.x,
        wall.start.y,
        wall.end.x,
        wall.end.y,
        wall.thickness,
        wall.height,
        wall.bodyOffset,
      ].every(Number.isFinite) ||
      wall.thickness <= 0 ||
      wall.height <= 0 ||
      Math.abs(wall.bodyOffset) > wall.thickness / 2 ||
      pointsCompatible(wall.start, wall.end)
    )
      throw new Error("Wandmaße oder Versatz für diesen Eckanschluss ungültig.");
  }
  const [a, b] = ends as [CornerEnd, CornerEnd];
  if (a.wall.thickness !== b.wall.thickness || a.wall.height !== b.wall.height)
    throw new Error("Dieser Eckanschluss benötigt gleiche Wandstärken und Höhen.");
  const endPoint = ({ wall, endpoint }: CornerEnd) => (endpoint === 0 ? wall.start : wall.end);
  const origin = endPoint(a);
  if (!pointsCompatible(origin, endPoint(b))) throw new Error("Kein gemeinsamer Achsendpunkt.");
  const local = (p: Point2) => ({ x: p.x - origin.x, y: p.y - origin.y });
  const prepare = (end: CornerEnd) => {
    const { wall, endpoint } = end;
    const start = local(endPoint(end));
    const finish = local(endpoint === 0 ? wall.end : wall.start);
    const length = Math.hypot(finish.x - start.x, finish.y - start.y);
    const direction = { x: (finish.x - start.x) / length, y: (finish.y - start.y) / length };
    const body = wallBody({
      ...wall,
      start,
      end: finish,
      bodyOffset: endpoint === 0 ? wall.bodyOffset : -wall.bodyOffset,
    });
    return { end, start, length, direction, body };
  };
  const u = prepare(a),
    v = prepare(b);
  if (
    Math.abs(u.direction.x * v.direction.x + u.direction.y * v.direction.y) >
    RIGHT_ANGLE_DOT_TOLERANCE
  )
    throw new Error("Dieser Eckanschluss benötigt einen rechten Winkel.");
  // Both axes point away from the node. Left of one meets right of the other.
  const left = intersectLines(u.body.corner(0, 1), u.direction, v.body.corner(0, -1), v.direction);
  const right = intersectLines(u.body.corner(0, -1), u.direction, v.body.corner(0, 1), v.direction);
  if (!left || !right || pointsCompatible(left, right)) throw new Error("Keine gültige Gehrung.");
  const contour = (data: typeof u, nearRight: Point2, nearLeft: Point2) => {
    for (const point of [nearRight, nearLeft]) {
      const distance =
        (point.x - data.start.x) * data.direction.x + (point.y - data.start.y) * data.direction.y;
      if (
        !Number.isFinite(distance) ||
        distance >= data.length ||
        coordinatesCompatible(distance, data.length)
      )
        throw new Error("Wand für diese Gehrung zu kurz.");
    }
    const points = [nearRight, data.body.corner(1, -1), data.body.corner(1, 1), nearLeft];
    const checked = validateSimplePolygon(points);
    if (!checked.valid || checked.signedArea <= 0) throw new Error("Ungültige Anschlusskontur.");
    const world = points.map((p) => ({ x: p.x + origin.x, y: p.y + origin.y }));
    const worldCheck = validateSimplePolygon(world);
    if (!worldCheck.valid || worldCheck.signedArea <= 0)
      throw new Error("Anschlusskoordinaten nicht darstellbar.");
    return {
      wallId: data.end.wall.id,
      endpoint: data.end.endpoint,
      points: world,
      area: checked.signedArea,
    };
  };
  return {
    walls: [contour(u, right, left), contour(v, left, right)],
    seam: [right, left].map((p) => ({ x: p.x + origin.x, y: p.y + origin.y })),
  };
}
