import type { CornerEnd } from "./corner.ts";
import type { Point2 } from "../../../geometry/primitives/point.ts";
import { wallBody } from "./body.ts";
import { intersectLines } from "../../../geometry/intersections/lines.ts";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";
import { coordinatesCompatible, pointsCompatible } from "../../../geometry/tolerances/model.ts";

/** Gross geometry for an explicit, isolated perpendicular T pair only.
 * No project lookup, opening validation, other joins, persistence or mutation.
 * Callers must verify those project-level preconditions before using this result.
 */
export function deriveRightAngleTJunction(host: CornerEnd["wall"], incoming: CornerEnd) {
  if (!host.id.trim() || !incoming.wall.id.trim() || host.id === incoming.wall.id)
    throw new Error("Zwei unterschiedliche Wand-IDs erforderlich.");
  if (incoming.endpoint !== 0 && incoming.endpoint !== 1)
    throw new Error("Ungültiger Wandendpunkt.");
  for (const wall of [host, incoming.wall]) {
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
      throw new Error("Ungültige Wandmaße für den T-Anschluss.");
  }
  if (host.thickness !== incoming.wall.thickness || host.height !== incoming.wall.height)
    throw new Error("Der T-Anschluss benötigt gleiche Wandstärken und Höhen.");

  const local = (p: Point2) => ({ x: p.x - host.start.x, y: p.y - host.start.y });
  const world = (p: Point2) => ({ x: p.x + host.start.x, y: p.y + host.start.y });
  const h = { ...host, start: local(host.start), end: local(host.end) };
  const w = { ...incoming.wall, start: local(incoming.wall.start), end: local(incoming.wall.end) };
  const hb = wallBody(h),
    wb = wallBody(w);
  const hostLength = Math.hypot(h.end.x, h.end.y);
  const u = { x: h.end.x / hostLength, y: h.end.y / hostLength };
  const node = incoming.endpoint === 0 ? w.start : w.end;
  const far = incoming.endpoint === 0 ? w.end : w.start;
  const length = Math.hypot(far.x - node.x, far.y - node.y);
  const away = { x: (far.x - node.x) / length, y: (far.y - node.y) / length };
  if (Math.abs(u.x * away.x + u.y * away.y) > 1e-10)
    throw new Error("Der T-Anschluss benötigt einen rechten Winkel.");
  const along = (p: Point2) => p.x * u.x + p.y * u.y;
  const position = along(node);
  const projected = world({ x: u.x * position, y: u.y * position });
  if (
    !pointsCompatible(projected, incoming.endpoint === 0 ? incoming.wall.start : incoming.wall.end)
  )
    throw new Error("Das Achsende liegt nicht auf der Hauptwandachse.");
  const interior = (distance: number) =>
    Number.isFinite(distance) &&
    distance > 0 &&
    distance < hostLength &&
    !coordinatesCompatible(distance, 0) &&
    !coordinatesCompatible(distance, hostLength);
  if (!interior(position)) throw new Error("T-Anschluss muss im Inneren der Hauptwand liegen.");

  const side = away.x * hb.normal.x + away.y * hb.normal.y > 0 ? 1 : -1;
  const sideStart = hb.corner(0, side);
  const nearIndices = incoming.endpoint === 0 ? [0, 3] : [1, 2];
  const contour = wb.corners.map((p) => ({ ...p }));
  const contact = nearIndices.map((index) => {
    const p = intersectLines(contour[index]!, away, sideStart, u);
    if (!p || !interior(along(p)))
      throw new Error("Kontaktbreite berührt oder überschreitet das Hauptwandende.");
    const trim = (p.x - node.x) * away.x + (p.y - node.y) * away.y;
    if (
      !Number.isFinite(trim) ||
      (trim < 0 && !coordinatesCompatible(trim, 0)) ||
      trim >= length ||
      coordinatesCompatible(trim, length)
    )
      throw new Error("Ankommende Wand für den T-Anschluss zu kurz.");
    contour[index] = p;
    return world(p);
  });
  const result = (wallId: string, points: Point2[]) => {
    const checked = validateSimplePolygon(points);
    const mapped = points.map(world);
    const representable = validateSimplePolygon(mapped);
    if (
      !checked.valid ||
      checked.signedArea <= 0 ||
      !representable.valid ||
      representable.signedArea <= 0
    )
      throw new Error("Ungültige T-Anschlusskontur.");
    return { wallId, points: mapped, area: checked.signedArea };
  };
  return {
    host: result(host.id, hb.corners),
    incoming: result(w.id, contour),
    contact,
  };
}
