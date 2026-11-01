import type { BimWindow, Wall } from "../../domain/project/schema.ts";
import type { Door } from "../../domain/elements/door/model.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { wallBase } from "../../domain/elements/wall/heights.ts";
import { wallLength } from "../../domain/project/schema.ts";
import {
  doorInsertBoxes,
  windowInsertBoxes,
  type InsertBox,
} from "../../domain/elements/window/insert-geometry.ts";
import type { Face, Vec3 } from "./storey-solid.ts";

export { GLASS_THICKNESS } from "../../domain/elements/window/insert-geometry.ts";

/**
 * Bodies of the elements set into openings (docs/FENSTER_TUEREN.md, FT2), derived only:
 * window frame on four sides, glass pane, window boards; door frame (Zarge) on both jambs and
 * the head, door leaf closed. Wall-local boxes: x along the wall from the body start, y across
 * (positive to the left of the wall direction), z from the wall base. Faces carry the opening
 * id and kind; glass faces are marked. Plain openings give nothing.
 */
export function openingInsertBodies(
  storey: {
    walls: readonly Wall[];
    windows: readonly BimWindow[];
    doors?: readonly Door[] | undefined;
  },
  elevation: number,
): { faces: Face[]; volume: number }[] {
  const walls = new Map(storey.walls.map((w) => [w.id, w]));
  const bodies: { faces: Face[]; volume: number }[] = [];
  for (const window of storey.windows) {
    const wall = walls.get(window.wallId);
    if (!window.insert || !wall) continue;
    bodies.push(place(wall, elevation, window.id, "window", windowInsertBoxes(window, wall)));
  }
  for (const door of storey.doors ?? []) {
    const wall = walls.get(door.wallId);
    if (!door.insert || !wall) continue;
    bodies.push(place(wall, elevation, door.id, "door", doorInsertBoxes(door, wall)));
  }
  return bodies;
}

function place(
  wall: Wall,
  elevation: number,
  id: string,
  kind: "window" | "door",
  boxes: readonly InsertBox[],
): { faces: Face[]; volume: number } {
  const length = wallLength(wall);
  const body = wallBody(wall);
  const ux = (wall.end.x - wall.start.x) / length,
    uy = (wall.end.y - wall.start.y) / length;
  const base = wallBase(wall, elevation);
  const world = ([x, y, z]: Vec3): Vec3 => [
    body.start.x + ux * x - uy * y,
    body.start.y + uy * x + ux * y,
    base + z,
  ];
  const turn = ([x, y, z]: Vec3): Vec3 => [ux * x - uy * y, uy * x + ux * y, z];
  const faces: Face[] = [];
  let volume = 0;
  for (const box of boxes) {
    const [x0, x1] = box.x,
      [y0, y1] = box.y,
      [z0, z1] = box.z;
    if (x1 - x0 <= 1e-9 || y1 - y0 <= 1e-9 || z1 - z0 <= 1e-9) continue;
    volume += (x1 - x0) * (y1 - y0) * (z1 - z0);
    // Opening symbol of a sash pane (FL3, DIN 1356): lines meet on the hinge side (turn) or at
    // the bottom (tilt). On the pane faces only; dashed where the face looks outside, because
    // the sash opens away from a viewer there.
    const marks = (normal: Vec3) => {
      const opening = box.opening;
      if (!opening || normal[1] === 0) return {};
      const y = normal[1] < 0 ? y0 : y1;
      const [hinge, free] = opening.hingeAtMaxX ? [x1, x0] : [x0, x1];
      const zm = (z0 + z1) / 2,
        xm = (x0 + x1) / 2;
      const local: [Vec3, Vec3][] = [];
      if (opening.operation !== "tilt")
        local.push(
          [
            [free, y, z0],
            [hinge, y, zm],
          ],
          [
            [free, y, z1],
            [hinge, y, zm],
          ],
        );
      if (opening.operation !== "turn")
        local.push(
          [
            [x0, y, z1],
            [xm, y, z0],
          ],
          [
            [x1, y, z1],
            [xm, y, z0],
          ],
        );
      return {
        marks: {
          segments: local.map(([a, b]): [Vec3, Vec3] => [world(a), world(b)]),
          dashed: Math.sign(normal[1]) === opening.outside,
        },
      };
    };
    const quad = (points: Vec3[], normal: Vec3) =>
      faces.push({
        wallId: id,
        opening: kind,
        ...(box.part === "glass" ? { glass: true as const } : {}),
        ...marks(normal),
        vertices: points.map(world),
        normal: turn(normal),
      });
    quad(
      [
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y0, z1],
        [x0, y0, z1],
      ],
      [0, -1, 0],
    );
    quad(
      [
        [x1, y1, z0],
        [x0, y1, z0],
        [x0, y1, z1],
        [x1, y1, z1],
      ],
      [0, 1, 0],
    );
    quad(
      [
        [x0, y1, z0],
        [x0, y0, z0],
        [x0, y0, z1],
        [x0, y1, z1],
      ],
      [-1, 0, 0],
    );
    quad(
      [
        [x1, y0, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x1, y0, z1],
      ],
      [1, 0, 0],
    );
    quad(
      [
        [x0, y1, z0],
        [x1, y1, z0],
        [x1, y0, z0],
        [x0, y0, z0],
      ],
      [0, 0, -1],
    );
    quad(
      [
        [x0, y0, z1],
        [x1, y0, z1],
        [x1, y1, z1],
        [x0, y1, z1],
      ],
      [0, 0, 1],
    );
  }
  return { faces, volume };
}
