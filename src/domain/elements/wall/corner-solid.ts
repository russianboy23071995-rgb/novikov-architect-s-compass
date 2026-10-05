import { validateProject, type Project } from "../../project/schema.ts";
import { inspectCornerOpenings, type CornerTarget } from "./corner-openings.ts";
import { wallBody } from "./body.ts";
import {
  extrudeProfileWithOpenings,
  type Vertex3,
} from "../../../geometry/solids/profile-openings.ts";
import { coordinatesCompatible } from "../../../geometry/tolerances/model.ts";

/** Disposable geometry for the explicit pair only. No persistent joins, renderer
 * replacement or eligibility policy. End-contact cases remain unsupported here.
 */
export function deriveCornerSolids(input: Project, first: CornerTarget, second: CornerTarget) {
  const project = validateProject(input),
    inspection = inspectCornerOpenings(project, first, second);
  for (const opening of inspection.openings)
    if (opening.status !== "contained")
      throw new Error(
        `Öffnung ${opening.windowId}: ${opening.status} am Wandabschluss wird noch nicht unterstützt.`,
      );
  const walls = inspection.corner.walls.map((contour) => {
    const wall = project.storey.walls.find((w) => w.id === contour.wallId)!;
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    const ux = (wall.end.x - wall.start.x) / length,
      uy = (wall.end.y - wall.start.y) / length;
    const body = wallBody(wall);
    const profile = contour.points.map((p) => {
      const dx = p.x - body.start.x,
        dy = p.y - body.start.y;
      const x = dx * ux + dy * uy,
        y = -dx * uy + dy * ux;
      // Physical sides and the untouched cap have exact parametric coordinates.
      // Restore those after the world/local round trip, within model tolerance only.
      return {
        x: coordinatesCompatible(x, 0) ? 0 : coordinatesCompatible(x, length) ? length : x,
        y: coordinatesCompatible(y, wall.thickness / 2)
          ? wall.thickness / 2
          : coordinatesCompatible(y, -wall.thickness / 2)
            ? -wall.thickness / 2
            : y,
      };
    });
    const openings = project.storey.windows
      .filter((w) => w.wallId === wall.id)
      .map((w) => ({
        left: w.position * length - w.width / 2,
        right: w.position * length + w.width / 2,
        bottom: w.sillHeight,
        top: w.sillHeight + w.height,
      }));
    const solid = extrudeProfileWithOpenings(profile, wall.height, openings);
    const world = ([x, y, z]: Vertex3): Vertex3 => [
      body.start.x + ux * x - uy * y,
      body.start.y + uy * x + ux * y,
      z,
    ];
    const faces = solid.faces.map((f) => ({
      wallId: wall.id,
      vertices: f.vertices.map(world),
      normal: [
        ux * f.normal[0] - uy * f.normal[1],
        uy * f.normal[0] + ux * f.normal[1],
        f.normal[2],
      ] as Vertex3,
    }));
    if (!faces.every((f) => f.vertices.flat().every(Number.isFinite)))
      throw new Error("Wandkörperkoordinaten nicht darstellbar.");
    return {
      wallId: wall.id,
      contour: contour.points,
      localProfile: profile,
      faces,
      volume: solid.volume,
    };
  });
  const volume = walls.reduce((sum, w) => sum + w.volume, 0);
  if (!Number.isFinite(volume)) throw new Error("Anschlussvolumen nicht darstellbar.");
  return { walls, volume };
}
