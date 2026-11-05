import {
  TERRAIN_DEFAULTS,
  terrainFloor,
  terrainMesh,
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

/** The closed body of a terrain: surface, sides along the outline, flat underside. Heights are
 * from ±0,00, so it needs no storey elevation (docs/GELAENDE.md). */
export function terrainBody(terrain: Terrain): { faces: TerrainFace[]; volume: number } {
  const own = {
    wallId: terrain.id,
    terrain: true as const,
    color: rgb(terrain.color ?? TERRAIN_DEFAULTS.color),
  };
  const floor = terrainFloor(terrain);
  const faces: TerrainFace[] = [];
  let volume = 0;
  for (const [a, b, c] of terrainMesh(terrain)) {
    const u: Vec3 = [b.x - a.x, b.y - a.y, b.z - a.z],
      v: Vec3 = [c.x - a.x, c.y - a.y, c.z - a.z];
    const n: Vec3 = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const length = Math.hypot(...n) || 1;
    faces.push({
      ...own,
      vertices: [a, b, c].map((p) => [p.x, p.y, p.z] as Vec3),
      normal: [n[0] / length, n[1] / length, n[2] / length],
    });
    faces.push({
      ...own,
      vertices: [c, b, a].map((p) => [p.x, p.y, floor] as Vec3),
      normal: [0, 0, -1],
    });
    volume += (n[2] / 2) * ((a.z + b.z + c.z) / 3 - floor);
  }
  const ring = terrain.outline;
  const signed = ring.reduce((sum, p, i) => {
    const q = ring[(i + 1) % ring.length]!;
    return sum + p.x * q.y - q.x * p.y;
  }, 0);
  const walk = signed >= 0 ? ring : [...ring].reverse();
  walk.forEach((a, i) => {
    const b = walk[(i + 1) % walk.length]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    faces.push({
      ...own,
      vertices: [
        [a.x, a.y, floor],
        [b.x, b.y, floor],
        [b.x, b.y, b.z],
        [a.x, a.y, a.z],
      ],
      normal: [(b.y - a.y) / length, -(b.x - a.x) / length, 0],
    });
  });
  return { faces, volume };
}
