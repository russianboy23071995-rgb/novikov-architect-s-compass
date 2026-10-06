import type { Wall, BimWindow } from "../../project/schema.ts";
import type { Point2 } from "../../../geometry/primitives/point.ts";
import { wallBody } from "./body.ts";
import {
  extrudeProfileWithOpenings,
  type Vertex3,
} from "../../../geometry/solids/profile-openings.ts";
import { coordinatesCompatible } from "../../../geometry/tolerances/model.ts";

export function wallContourSolid(
  wall: Wall,
  points: Point2[],
  windows: BimWindow[],
  clipOpeningsToProfile = false,
) {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  const ux = (wall.end.x - wall.start.x) / length,
    uy = (wall.end.y - wall.start.y) / length;
  const body = wallBody(wall);
  const profile = points.map((p) => {
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
  // A transverse cap can acquire two slightly different local X values during
  // rotation/translation. Canonicalize only numerically compatible coordinates.
  const xs: number[] = [];
  for (const point of profile) {
    const existing = xs.find((x) => coordinatesCompatible(x, point.x));
    if (existing === undefined) xs.push(point.x);
    else point.x = existing;
  }
  // Reconcile opening edges with profile vertices after world/local roundoff.
  // Derived coordinates only; do not create a microscopic extrusion cell at contact.
  const profileX = (x: number) => profile.find((p) => coordinatesCompatible(p.x, x))?.x ?? x;
  const openings = windows
    .filter((w) => w.wallId === wall.id)
    .map((w) => ({
      left: profileX(w.position * length - w.width / 2),
      right: profileX(w.position * length + w.width / 2),
      bottom: w.sillHeight,
      top: w.sillHeight + w.height,
    }));
  const solid = extrudeProfileWithOpenings(profile, wall.height, openings, clipOpeningsToProfile);
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
    contour: points,
    localProfile: profile,
    faces,
    volume: solid.volume,
  };
}
