import { roofBody as roofBodyFaces } from "../../domain/elements/roof/body.ts";
import type { Roof } from "../../domain/elements/roof/model.ts";

type Vec3 = [number, number, number];
/** A roof face in the storey solid; `roof` keeps it out of every wall-only path. */
export type RoofFace = { wallId: string; vertices: Vec3[]; normal: Vec3; roof: true };

/** The shared roof body (domain, also used by IFC) as storey solid faces. */
export function roofBody(roof: Roof, elevation: number): { faces: RoofFace[]; volume: number } {
  const body = roofBodyFaces(roof, elevation);
  return {
    faces: body.faces.map((face) => ({ wallId: roof.id, ...face, roof: true as const })),
    volume: body.volume,
  };
}
