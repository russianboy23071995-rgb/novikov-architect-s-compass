import type { Wall, BimWindow } from "../../project/schema.ts";
import { deriveRightAngleTJunction } from "./t-junction.ts";
import { wallBody } from "./body.ts";
import { wallContourSolid } from "./contour-solid.ts";
import { measureHalfPlane } from "../../../geometry/projections/half-plane.ts";
import { coordinatesCompatible } from "../../../geometry/tolerances/model.ts";

export type TPairEnd = { wall: Wall; endpoint: 0 | 1 };

/** Internal pair kernel: caller supplies resolved walls and schema-valid windows
 * from ONE snapshot, and validates membership/other relations. No Project or
 * validateProject dependency; safe to use during project geometry validation.
 */
export function inspectTPair(host: Wall, incoming: TPairEnd, windows: readonly BimWindow[]) {
  const wall = incoming.wall;
  const ids = new Set([host.id, wall.id]);
  const geometry = deriveRightAngleTJunction(host, { wall, endpoint: incoming.endpoint });
  const hostLength = Math.hypot(host.end.x - host.start.x, host.end.y - host.start.y);
  const contact = geometry.contact
    .map(
      (p) =>
        ((p.x - host.start.x) * (host.end.x - host.start.x)) / hostLength +
        ((p.y - host.start.y) * (host.end.y - host.start.y)) / hostLength,
    )
    .sort((a, b) => a - b);
  const openings = windows
    .filter((w) => ids.has(w.wallId))
    .map((window) => {
      const target = window.wallId === host.id ? host : wall;
      const length = Math.hypot(target.end.x - target.start.x, target.end.y - target.start.y);
      const left = window.position * length - window.width / 2,
        right = window.position * length + window.width / 2;
      let status: "free" | "touching" | "overlapping";
      if (target.id === host.id) {
        const overlap = Math.min(right, contact[1]!) - Math.max(left, contact[0]!);
        status = coordinatesCompatible(overlap, 0)
          ? "touching"
          : overlap > 0
            ? "overlapping"
            : "free";
      } else {
        const at = (d: number) => ({
          x: target.start.x + ((target.end.x - target.start.x) * d) / length,
          y: target.start.y + ((target.end.y - target.start.y) * d) / length,
        });
        const footprint = wallBody({ ...target, start: at(left), end: at(right) }).corners;
        const ring = geometry.incoming.points;
        const checks = ring.map(
          (p, i) => measureHalfPlane(footprint, p, ring[(i + 1) % ring.length]!).relation,
        );
        status = checks.includes("outside")
          ? "overlapping"
          : checks[incoming.endpoint === 0 ? 3 : 1] === "touching"
            ? "touching"
            : "free";
      }
      return {
        windowId: window.id,
        wallId: target.id,
        boundary: target.id === host.id ? ("host-contact" as const) : ("incoming-cap" as const),
        status,
      };
    });
  return { geometry, openings };
}

/** Same pair inspection and solids for project validation, previews and export. */
export function deriveTPairSolids(host: Wall, incoming: TPairEnd, windows: readonly BimWindow[]) {
  const { geometry } = inspectTPair(host, incoming, windows);
  const wall = incoming.wall;
  const walls = [
    wallContourSolid(host, geometry.host.points, [...windows], true),
    wallContourSolid(wall, geometry.incoming.points, [...windows], true),
  ];
  const volume = walls.reduce((sum, w) => sum + w.volume, 0);
  if (!Number.isFinite(volume)) throw new Error("Anschlussvolumen nicht darstellbar.");
  return { walls, volume };
}
