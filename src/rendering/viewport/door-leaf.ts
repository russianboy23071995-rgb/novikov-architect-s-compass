import type { Project } from "../../domain/project/schema.ts";
import { wallLength } from "../../domain/project/schema.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { workingStoreyElevation } from "../../domain/storeys/elevation.ts";
import type { DisplaySurfaces } from "./layer-display.ts";

type Face = DisplaySurfaces["faces"][number];
type Local = [number, number, number];

/** Provisional leaf thickness of the derived closed door leaf, metres (display only). */
export const DOOR_LEAF_THICKNESS = 0.04;

/** Closed single leaf of every visible door, flush with the wall face on its swing side.
 * Display-only faces for the renderer (user decision 24.10.2026): they are not wall material,
 * never picked as walls, never part of quantities, and carry the door ID for visibility.
 * Absolute heights: storey level plus the door's z offset, like the opening hit surfaces.
 */
export function doorLeafFaces(project: Project, allows: (id: string) => boolean): Face[] {
  return project.storeys.flatMap((storey) => {
    const doors = storey.doors ?? [];
    if (!doors.length) return [];
    const elevation = workingStoreyElevation({ ...project, workingStoreyId: storey.id });
    const walls = new Map(storey.walls.map((w) => [w.id, w]));
    return doors.flatMap((door) => {
      const wall = walls.get(door.wallId);
      if (!wall || !allows(wall.id) || !allows(door.id)) return [];
      const length = wallLength(wall),
        body = wallBody(wall);
      const ux = (wall.end.x - wall.start.x) / length,
        uy = (wall.end.y - wall.start.y) / length;
      const world = ([x, y, z]: Local): Local => [
        body.start.x + ux * x - uy * y,
        body.start.y + uy * x + ux * y,
        z,
      ];
      const side = door.opensTo === "left" ? 1 : -1;
      const outer = (side * wall.thickness) / 2,
        inner = outer - side * DOOR_LEAF_THICKNESS;
      const [a, b] = [Math.min(inner, outer), Math.max(inner, outer)];
      const l = door.position * length - door.width / 2,
        r = l + door.width;
      const d = elevation + door.zOffset,
        u = d + door.height;
      const face = (points: Local[], normal: Local): Face => ({
        wallId: door.id,
        vertices: points.map(world),
        normal: [ux * normal[0] - uy * normal[1], uy * normal[0] + ux * normal[1], normal[2]],
      });
      return [
        face(
          [
            [l, a, d],
            [r, a, d],
            [r, a, u],
            [l, a, u],
          ],
          [0, -1, 0],
        ),
        face(
          [
            [r, b, d],
            [l, b, d],
            [l, b, u],
            [r, b, u],
          ],
          [0, 1, 0],
        ),
        face(
          [
            [l, b, d],
            [l, a, d],
            [l, a, u],
            [l, b, u],
          ],
          [-1, 0, 0],
        ),
        face(
          [
            [r, a, d],
            [r, b, d],
            [r, b, u],
            [r, a, u],
          ],
          [1, 0, 0],
        ),
        face(
          [
            [l, a, u],
            [r, a, u],
            [r, b, u],
            [l, b, u],
          ],
          [0, 0, 1],
        ),
        face(
          [
            [l, b, d],
            [r, b, d],
            [r, a, d],
            [l, a, d],
          ],
          [0, 0, -1],
        ),
      ];
    });
  });
}
