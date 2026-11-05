import {
  TERRAIN_DEFAULTS,
  terrainShell,
  type Terrain,
} from "../../domain/elements/terrain/model.ts";

type Vec3 = [number, number, number];
/** A face of the terrain body; `terrain` keeps it out of every wall-only path. */
export type TerrainFace = {
  wallId: string;
  vertices: Vec3[];
  normal: Vec3;
  terrain: true;
  color: Vec3;
};
const rgb = (hex: string): Vec3 => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
];

/** The closed body of a terrain as 3D faces (docs/GELAENDE.md). */
export function terrainBody(terrain: Terrain): { faces: TerrainFace[]; volume: number } {
  const color = rgb(terrain.color ?? TERRAIN_DEFAULTS.color);
  const { faces, volume } = terrainShell(terrain);
  return {
    volume,
    faces: faces.map((face) => ({ ...face, wallId: terrain.id, terrain: true, color })),
  };
}
