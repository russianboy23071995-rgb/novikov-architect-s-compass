import { objectBoxes, type PlacedObject } from "../../domain/elements/object/model.ts";

type Vec3 = [number, number, number];
/** An object face in the storey solid; `object` keeps it out of every wall-only path. */
export type ObjectFace = { wallId: string; vertices: Vec3[]; normal: Vec3; object: true };

/**
 * Closed boxes of one placed object (docs/OBJEKTBIBLIOTHEK.md, O1), relative to the storey floor
 * at `elevation`. Boxes may touch (bed and headboard); each is closed, the volume is their sum.
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
  >,
  elevation: number,
): { faces: ObjectFace[]; volume: number } {
  const faces: ObjectFace[] = [];
  let volume = 0;
  for (const { corners: ring, bottom: b, top: t } of objectBoxes(object)) {
    const bottom = elevation + b,
      top = elevation + t;
    if (top - bottom <= 1e-9) continue;
    const at = (p: { x: number; y: number }, z: number): Vec3 => [p.x, p.y, z];
    faces.push({
      wallId: object.id,
      vertices: ring.map((p) => at(p, top)),
      normal: [0, 0, 1],
      object: true,
    });
    faces.push({
      wallId: object.id,
      vertices: [...ring].reverse().map((p) => at(p, bottom)),
      normal: [0, 0, -1],
      object: true,
    });
    for (let i = 0; i < 4; i++) {
      const a = ring[i]!,
        c = ring[(i + 1) % 4]!;
      const length = Math.hypot(c.x - a.x, c.y - a.y) || 1;
      faces.push({
        wallId: object.id,
        vertices: [at(a, bottom), at(c, bottom), at(c, top), at(a, top)],
        normal: [(c.y - a.y) / length, -(c.x - a.x) / length, 0],
        object: true,
      });
    }
    const [p0, p1, , p3] = ring;
    volume +=
      Math.hypot(p1!.x - p0!.x, p1!.y - p0!.y) *
      Math.hypot(p3!.x - p0!.x, p3!.y - p0!.y) *
      (top - bottom);
  }
  return { faces, volume };
}
