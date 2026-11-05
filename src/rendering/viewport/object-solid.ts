import { objectSolids, type PlacedObject } from "../../domain/elements/object/model.ts";

type Vec3 = [number, number, number];
/** An object face in the storey solid; `object` keeps it out of every wall-only path. */
export type ObjectFace = {
  wallId: string;
  vertices: Vec3[];
  normal: Vec3;
  object: true;
  color?: Vec3;
  smooth?: true;
};

const rgb = (hex: string): Vec3 => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
];
/** Rings with more corners than a box stand for a curve: their sides draw as one surface. */
const CURVED_RING = 6;

/**
 * Closed solids of one placed object (docs/OBJEKTBIBLIOTHEK.md, O1, M2), relative to the storey
 * floor at `elevation`. Solids may touch (bed and headboard); each is closed, the volume is
 * their sum. Every outline is convex, so its top and bottom draw as one fan.
 */
export function objectBody(
  object: Pick<
    PlacedObject,
    | "id"
    | "catalogId"
    | "position"
    | "rotation"
    | "mirrored"
    | "width"
    | "depth"
    | "height"
    | "baseOffset"
    | "options"
    | "finishes"
  >,
  elevation: number,
): { faces: ObjectFace[]; volume: number } {
  const faces: ObjectFace[] = [];
  let volume = 0;
  for (const { ring, bottom: b, top: t, color } of objectSolids(object)) {
    const bottom = elevation + b,
      top = elevation + t;
    if (top - bottom <= 1e-9) continue;
    const own = {
      wallId: object.id,
      object: true as const,
      ...(color ? { color: rgb(color) } : {}),
    };
    const at = (p: { x: number; y: number }, z: number): Vec3 => [p.x, p.y, z];
    faces.push({ ...own, vertices: ring.map((p) => at(p, top)), normal: [0, 0, 1] });
    faces.push({
      ...own,
      vertices: [...ring].reverse().map((p) => at(p, bottom)),
      normal: [0, 0, -1],
    });
    let area = 0;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!,
        c = ring[(i + 1) % ring.length]!;
      area += a.x * c.y - c.x * a.y;
      const length = Math.hypot(c.x - a.x, c.y - a.y) || 1;
      faces.push({
        ...own,
        vertices: [at(a, bottom), at(c, bottom), at(c, top), at(a, top)],
        normal: [(c.y - a.y) / length, -(c.x - a.x) / length, 0],
        ...(ring.length > CURVED_RING ? { smooth: true as const } : {}),
      });
    }
    volume += (Math.abs(area) / 2) * (top - bottom);
  }
  return { faces, volume };
}
