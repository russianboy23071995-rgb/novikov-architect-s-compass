import { assertSameWallBase } from "./heights.ts";
import type { Wall } from "../../project/schema.ts";
import type { Point2 } from "../../../geometry/primitives/point.ts";
import { intersectLines } from "../../../geometry/intersections/lines.ts";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";
import { pointsCompatible, coordinatesCompatible } from "../../../geometry/tolerances/model.ts";
import { wallBody } from "./body.ts";

export type CornerEnd = {
  wall: Pick<Wall, "id" | "start" | "end" | "thickness" | "height" | "bodyOffset" | "baseOffset">;
  endpoint: 0 | 1;
};
const RIGHT_ANGLE_DOT_TOLERANCE = 1e-10; // Dimensionless; not a distance or snap radius.

/** Gross contours only, not an opening-aware body or a persistent connection.
 * Explicit endpoint pair; no neighbour search, mutations or automatic join creation.
 * Callers must separately validate project membership, openings and other joins.
 */
export function deriveWallCorner(first: CornerEnd, second: CornerEnd) {
  return deriveCorner(first, second, false);
}

/** Retained strict contract for the historical right-angle diagnostic. */
export function deriveRightAngleCorner(first: CornerEnd, second: CornerEnd) {
  return deriveCorner(first, second, true);
}

function deriveCorner(first: CornerEnd, second: CornerEnd, rightAngleOnly: boolean) {
  assertSameWallBase(first.wall, second.wall);
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
  // The strict historical contract keeps equal sections. Automatic joins accept different
  // thicknesses (mitre through the face intersections) and heights (butt joint, user decision
  // 26.10.2026, docs/WALL_JUNCTIONS.md).
  if (rightAngleOnly && (a.wall.thickness !== b.wall.thickness || a.wall.height !== b.wall.height))
    throw new Error("Dieser Eckanschluss benötigt gleiche Wandstärken und Höhen.");
  const endPoint = ({ wall, endpoint }: CornerEnd) => (endpoint === 0 ? wall.start : wall.end);
  const origin = endPoint(a);
  if (!pointsCompatible(origin, endPoint(b))) throw new Error("Kein gemeinsamer Achsendpunkt.");
  const local = (p: Point2) => ({ x: p.x - origin.x, y: p.y - origin.y });
  const prepare = (end: CornerEnd): Prepared => {
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
    rightAngleOnly &&
    Math.abs(u.direction.x * v.direction.x + u.direction.y * v.direction.y) >
      RIGHT_ANGLE_DOT_TOLERANCE
  )
    throw new Error("Dieser Eckanschluss benötigt einen rechten Winkel.");
  if (a.wall.height !== b.wall.height) return buttCorner(u, v, origin);
  // Both axes point away from the node. Left of one meets right of the other.
  const left = intersectLines(u.body.corner(0, 1), u.direction, v.body.corner(0, -1), v.direction);
  const right = intersectLines(u.body.corner(0, -1), u.direction, v.body.corner(0, 1), v.direction);
  if (!left || !right || pointsCompatible(left, right)) throw new Error("Keine gültige Gehrung.");
  return {
    walls: [cornerContour(u, right, left, origin), cornerContour(v, left, right, origin)],
    seam: [right, left].map((p) => ({ x: p.x + origin.x, y: p.y + origin.y })),
  };
}

/** One wall end of a corner, in node-local coordinates with its axis pointing away. */
type Prepared = {
  end: CornerEnd;
  start: Point2;
  length: number;
  direction: Point2;
  body: ReturnType<typeof wallBody>;
};

/** Ring [near right, far right, far left, near left] of one wall, checked and in world units. */
function cornerContour(data: Prepared, nearRight: Point2, nearLeft: Point2, origin: Point2) {
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
}

/** Different heights (user decision 26.10.2026): the taller wall runs through to the far face of
 * the lower wall, which butts against the inner face of the taller wall. A mitre would show a
 * sloped cut above the lower wall. The seam is the end of the lower wall on that inner face.
 */
function buttCorner(u: Prepared, v: Prepared, origin: Point2) {
  const [through, butt] = u.end.wall.height > v.end.wall.height ? [u, v] : [v, u];
  const offset = (data: Prepared, side: -1 | 1, toward: Point2) => {
    const p = data.body.corner(0, side);
    return (p.x - data.start.x) * toward.x + (p.y - data.start.y) * toward.y;
  };
  const sides = [-1, 1] as const;
  // Far face of the butting wall: the one away from the run of the through wall.
  const outer = sides.reduce((best, s) =>
    offset(butt, s, through.direction) < offset(butt, best, through.direction) ? s : best,
  );
  // Face of the through wall that faces the run of the butting wall.
  const inner = sides.reduce((best, s) =>
    offset(through, s, butt.direction) > offset(through, best, butt.direction) ? s : best,
  );
  const cut = (data: Prepared, side: -1 | 1, linePoint: Point2, lineDirection: Point2) => {
    const p = intersectLines(data.body.corner(0, side), data.direction, linePoint, lineDirection);
    if (!p) throw new Error("Kein gültiger Stumpfstoß.");
    return p;
  };
  const outerFace = butt.body.corner(0, outer),
    innerFace = through.body.corner(0, inner);
  const throughContour = cornerContour(
    through,
    cut(through, -1, outerFace, butt.direction),
    cut(through, 1, outerFace, butt.direction),
    origin,
  );
  const seam = [
    cut(butt, -1, innerFace, through.direction),
    cut(butt, 1, innerFace, through.direction),
  ];
  const buttContour = cornerContour(butt, seam[0]!, seam[1]!, origin);
  return {
    walls: through === u ? [throughContour, buttContour] : [buttContour, throughContour],
    seam: seam.map((p) => ({ x: p.x + origin.x, y: p.y + origin.y })),
  };
}
