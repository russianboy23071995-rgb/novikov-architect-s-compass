import type { BimWindow, Wall } from "../../domain/project/schema.ts";
import type { Door } from "../../domain/elements/door/model.ts";
import { doorOpening } from "../../domain/elements/door/model.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { wallBase } from "../../domain/elements/wall/heights.ts";
import { wallLength } from "../../domain/project/schema.ts";
import type { Face, Vec3 } from "./storey-solid.ts";

/** Glass pane thickness of a fixed light; the pane sits in the middle of the frame depth. */
export const GLASS_THICKNESS = 0.024;
/** Thickness of the window boards inside and outside. */
export const SILL_THICKNESS = { inside: 0.025, outside: 0.03 } as const;

/** Parts of an element: jambs and rails of the frame, glass, window boards, door leaf. */
export type InsertPart = "jamb" | "rail" | "glass" | "sill" | "leaf";
/** Wall-local box: x along the wall, y across (left positive), z from the wall base. */
export type InsertBox = {
  part: InsertPart;
  x: [number, number];
  y: [number, number];
  z: [number, number];
};

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

function span(opening: { position: number; width: number }, wall: Wall) {
  const length = wallLength(wall);
  return {
    l: opening.position * length - opening.width / 2,
    r: opening.position * length + opening.width / 2,
  };
}

export function windowInsertBoxes(window: BimWindow, wall: Wall): InsertBox[] {
  const insert = window.insert!;
  const { l, r } = span(window, wall);
  const b = window.sillHeight,
    t = window.sillHeight + window.height;
  const half = wall.thickness / 2;
  // The outside face: right of the wall direction is y < 0.
  const out = insert.exterior === "right" ? -1 : 1;
  const d = insert.frameDepth;
  // Frame across the wall, measured from the outside towards the inside.
  const from =
    insert.location === "centre"
      ? -d / 2
      : insert.location === "outside"
        ? -half + insert.offset
        : half - insert.offset - d;
  const across = (a: number, c: number): [number, number] => (out < 0 ? [a, c] : [-c, -a]);
  const frame = across(from, from + d);
  const w = insert.frameWidth;
  const boxes: InsertBox[] = [
    { part: "jamb", x: [l, l + w], y: frame, z: [b, t] },
    { part: "jamb", x: [r - w, r], y: frame, z: [b, t] },
    { part: "rail", x: [l + w, r - w], y: frame, z: [b, b + w] },
    { part: "rail", x: [l + w, r - w], y: frame, z: [t - w, t] },
  ];
  const mid = from + d / 2;
  boxes.push({
    part: "glass",
    x: [l + w, r - w],
    y: across(mid - GLASS_THICKNESS / 2, mid + GLASS_THICKNESS / 2),
    z: [b + w, t - w],
  });
  // Window boards: from the frame to the wall face plus the projection, on the opening floor.
  if (insert.sillOutside)
    boxes.push({
      part: "sill",
      x: [l, r],
      y: across(-half - insert.sillOutside.projection, from),
      z: [b, b + SILL_THICKNESS.outside],
    });
  if (insert.sillInside)
    boxes.push({
      part: "sill",
      x: [l, r],
      y: across(from + d, half + insert.sillInside.projection),
      z: [b, b + SILL_THICKNESS.inside],
    });
  return boxes;
}

export function doorInsertBoxes(door: Door, wall: Wall): InsertBox[] {
  const insert = door.insert!;
  const opening = doorOpening(door, wall);
  const { l, r } = span(opening, wall);
  const b = opening.sillHeight,
    t = opening.sillHeight + opening.height;
  const half = wall.thickness / 2;
  // Frame and leaf flush with the wall face of the side the leaf opens to.
  const side = door.opensTo === "left" ? 1 : -1;
  const depth = insert.frameDepth ?? wall.thickness;
  const across = (inner: number, outer: number): [number, number] => {
    const a = side * (half - outer),
      c = side * (half - inner);
    return a < c ? [a, c] : [c, a];
  };
  const frame = across(0, depth);
  const w = insert.frameWidth;
  return [
    { part: "jamb", x: [l, l + w], y: frame, z: [b, t] },
    { part: "jamb", x: [r - w, r], y: frame, z: [b, t] },
    { part: "rail", x: [l + w, r - w], y: frame, z: [t - w, t] },
    { part: "leaf", x: [l + w, r - w], y: across(0, insert.leafThickness), z: [b, t - w] },
  ];
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
    const quad = (points: Vec3[], normal: Vec3) =>
      faces.push({
        wallId: id,
        opening: kind,
        ...(box.part === "glass" ? { glass: true as const } : {}),
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
