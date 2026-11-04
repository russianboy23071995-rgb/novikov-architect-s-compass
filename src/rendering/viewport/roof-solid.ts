import { roofBody as roofBodyFaces } from "../../domain/elements/roof/body.ts";
import type { Roof } from "../../domain/elements/roof/model.ts";
import type { RoofWindow } from "../../domain/elements/roof/window.ts";
import { roofWindowBody } from "../../domain/elements/roof/window-body.ts";

type Vec3 = [number, number, number];
/** A roof face in the storey solid; `roof` keeps it out of every wall-only path. */
export type RoofFace = { wallId: string; vertices: Vec3[]; normal: Vec3; roof: true };

/** The shared roof body (domain, also used by IFC) as storey solid faces. */
export function roofBody(
  roof: Roof,
  elevation: number,
  windows: readonly RoofWindow[] = [],
): { faces: RoofFace[]; volume: number } {
  const body = roofBodyFaces(roof, elevation, windows);
  return {
    faces: body.faces.map((face) => ({ wallId: roof.id, ...face, roof: true as const })),
    volume: body.volume,
  };
}

/** A roof window face (docs/DACHFLAECHENFENSTER.md): white frame, glass pane; `roofWindow`
 * makes a click pick the roof window, `opening` gives it the window colours. */
export type RoofWindowFace = {
  wallId: string;
  vertices: Vec3[];
  normal: Vec3;
  roofWindow: true;
  opening: "window";
  glass?: true;
};

/** The roof window element in its opening as storey solid faces. */
export function roofWindowSolid(
  roof: Roof,
  window: RoofWindow,
  elevation: number,
): { faces: RoofWindowFace[]; volume: number } {
  const body = roofWindowBody(roof, window, elevation);
  return {
    faces: body.parts.flatMap((part) =>
      part.faces.map((face) => ({
        wallId: window.id,
        ...face,
        roofWindow: true as const,
        opening: "window" as const,
      })),
    ),
    volume: body.volume,
  };
}
