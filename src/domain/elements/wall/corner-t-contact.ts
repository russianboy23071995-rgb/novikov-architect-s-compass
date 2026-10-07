import type { WallGeometry } from "../../project/geometry-scope.ts";
import type { Point, Wall } from "../../project/schema.ts";
import { wallBody } from "./body.ts";
import { pointsCompatible, coordinatesCompatible } from "../../../geometry/tolerances/model.ts";
import { measureHalfPlane } from "../../../geometry/projections/half-plane.ts";

/** Bounded combination: right-angle corners at either host end, contact on its untouched side. */
export function validateCornerTContact(
  project: WallGeometry,
  host: Wall,
  incomingRing: Point[],
  contact: Point[],
  corners: ReadonlyMap<string, Point[]>,
) {
  const joins = project.storey.wallJoins.filter(
    (j) => j.first.wallId === host.id || j.second.wallId === host.id,
  );
  if (!joins.length) return;
  const partners = joins.map((join) => {
    const partnerId = join.first.wallId === host.id ? join.second.wallId : join.first.wallId;
    const partner = project.storey.walls.find((w) => w.id === partnerId)!;
    const hx = host.end.x - host.start.x,
      hy = host.end.y - host.start.y;
    const px = partner.end.x - partner.start.x,
      py = partner.end.y - partner.start.y;
    if (Math.abs((hx * px + hy * py) / (Math.hypot(hx, hy) * Math.hypot(px, py))) > 1e-10)
      throw new Error("Ecke und T benoetigen vorerst eine rechtwinklige Ecke.");
    return partner;
  });
  const ring = corners.get(host.id);
  if (!ring) throw new Error("Eckkontur der T-Hauptwand fehlt.");
  // Indices 0 and 2 are the preserved longitudinal sides of the composed corner ring.
  const onSide = [0, 2].some((i) => {
    const a = ring[i]!,
      b = ring[(i + 1) % 4]!;
    const dx = b.x - a.x,
      dy = b.y - a.y,
      length = Math.hypot(dx, dy);
    return contact.every((p) => {
      const distance = ((p.x - a.x) * dx + (p.y - a.y) * dy) / length;
      const projected = { x: a.x + (distance * dx) / length, y: a.y + (distance * dy) / length };
      return (
        pointsCompatible(p, projected) &&
        distance > 0 &&
        distance < length &&
        !coordinatesCompatible(distance, 0) &&
        !coordinatesCompatible(distance, length)
      );
    });
  });
  if (!onSide) throw new Error("T-Kontakt beruehrt den Eckbereich der Hauptwand.");

  // Both profiles are convex quadrilaterals. A strict separating edge excludes corner contact too.
  const separated = (a: Point[], b: Point[]) =>
    a.some((p, i) => measureHalfPlane(b, a[(i + 1) % a.length]!, p).relation === "inside");
  for (const partner of partners) {
    const partnerRing = corners.get(partner.id) ?? wallBody(partner).corners;
    if (!separated(incomingRing, partnerRing) && !separated(partnerRing, incomingRing))
      throw new Error("T-Nebenwand beruehrt oder ueberlappt den Eckpartner.");
  }
}
