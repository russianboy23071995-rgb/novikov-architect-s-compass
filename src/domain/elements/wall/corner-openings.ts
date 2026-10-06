import { validateProject, type Project } from "../../project/schema.ts";
import { deriveRightAngleCorner, type CornerEnd } from "./corner.ts";
import { wallBody } from "./body.ts";
import { measureHalfPlane } from "../../../geometry/projections/half-plane.ts";

export type CornerTarget = { wallId: string; endpoint: 0 | 1 };

/** Geometric report only: no join creation, clearance policy, visibility filtering,
 * window overlap rule or edits. Derive contours and footprints from ONE validated
 * project; callers cannot accidentally supply a stale contour from another model.
 */
export function inspectCornerOpenings(input: Project, first: CornerTarget, second: CornerTarget) {
  const project = validateProject(input);
  const end = (target: CornerTarget): CornerEnd => {
    const wall = project.storey.walls.find((w) => w.id === target.wallId);
    if (!wall) throw new Error("Wand für Öffnungsprüfung nicht gefunden.");
    return { wall, endpoint: target.endpoint };
  };
  const a = end(first),
    b = end(second),
    corner = deriveRightAngleCorner(a, b);
  const boundaries = ["side", "far-end", "side", "join"] as const;
  const openings = project.storey.windows
    .filter((w) => w.wallId === a.wall.id || w.wallId === b.wall.id)
    .sort((x, y) => (x.id < y.id ? -1 : 1))
    .map((window) => {
      const wall = window.wallId === a.wall.id ? a.wall : b.wall;
      const contour = corner.walls.find((w) => w.wallId === wall.id)!;
      const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
      const ux = (wall.end.x - wall.start.x) / length,
        uy = (wall.end.y - wall.start.y) / length;
      const at = (distance: number) => ({
        x: wall.start.x + ux * distance,
        y: wall.start.y + uy * distance,
      });
      const centre = window.position * length;
      const footprint = wallBody({
        ...wall,
        start: at(centre - window.width / 2),
        end: at(centre + window.width / 2),
      }).corners;
      // Corner contours are convex, CCW, with their seam as the closing edge.
      const checks = contour.points.map((point, i) => ({
        boundary: boundaries[i]!,
        ...measureHalfPlane(footprint, point, contour.points[(i + 1) % contour.points.length]!),
      }));
      const status: "contained" | "touching" | "outside" = checks.some(
        (c) => c.relation === "outside",
      )
        ? "outside"
        : checks.some((c) => c.boundary !== "side" && c.relation === "touching")
          ? "touching"
          : "contained";
      return { windowId: window.id, wallId: wall.id, status, footprint, boundaries: checks };
    });
  return { corner, openings };
}
