import { validateProject, type Project } from "../../project/schema.ts";
import type { CornerTarget } from "./corner-openings.ts";
import { deriveRightAngleTJunction } from "./t-junction.ts";
import { wallBody } from "./body.ts";
import { measureHalfPlane } from "../../../geometry/projections/half-plane.ts";
import { coordinatesCompatible } from "../../../geometry/tolerances/model.ts";

/** One validated snapshot supplies geometry and openings; touching is reported,
 * not conflated with overlap. No mutation or visibility-dependent exemption. */
export function inspectTOpenings(input: Project, hostId: string, incoming: CornerTarget) {
  const project = validateProject(input);
  const host = project.storey.walls.find((w) => w.id === hostId);
  const wall = project.storey.walls.find((w) => w.id === incoming.wallId);
  if (!host || !wall) throw new Error("Beide Wände müssen im aktuellen Modell vorhanden sein.");
  const ids = new Set([hostId, wall.id]);
  if (project.storey.wallJoins.some((j) => ids.has(j.first.wallId) || ids.has(j.second.wallId)))
    throw new Error("T-Vorschau unterstützt zunächst nur Wände ohne weitere Anschlüsse.");
  const geometry = deriveRightAngleTJunction(host, { wall, endpoint: incoming.endpoint });
  const hostLength = Math.hypot(host.end.x - host.start.x, host.end.y - host.start.y);
  const contact = geometry.contact
    .map(
      (p) =>
        ((p.x - host.start.x) * (host.end.x - host.start.x)) / hostLength +
        ((p.y - host.start.y) * (host.end.y - host.start.y)) / hostLength,
    )
    .sort((a, b) => a - b);
  const openings = project.storey.windows
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
