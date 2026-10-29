import { storeyOf } from "../../domain/storeys/access.ts";
import { connectedWallContours } from "../../domain/elements/wall/connections.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { enclosedFace } from "../../geometry/polygons/enclosed-face.ts";
import type { Point, Project } from "../../domain/project/schema.ts";

/**
 * Room outline by a click into an area enclosed by the walls of the working storey
 * (docs/ROOM_ELEMENT.md, R2): the wall bodies in plan, as drawn (joins included), bound the
 * room on their inner faces. Openings do not open the boundary. Hidden walls count too: the
 * room follows the building, not the current layer display.
 */
export function enclosedRoomOutline(project: Project, point: Point): Point[] {
  const contours = connectedWallContours(project);
  const rings = storeyOf(project).walls.map((w) => contours.get(w.id) ?? wallBody(w).corners);
  const face = enclosedFace(rings, point);
  if (!face)
    throw new Error(
      "Hier ist kein von Wänden umschlossener Bereich. In einen geschlossenen Raum klicken oder den Umriss zeichnen.",
    );
  return face;
}
