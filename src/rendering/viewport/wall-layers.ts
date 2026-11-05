import {
  projectMaterials,
  projectWallAssemblies,
  wallLayers,
  type Material,
  type WallAssembly,
} from "../../domain/elements/wall/assembly.ts";

/** Library a drawing resolves wall build-ups against (docs/WANDAUFBAU.md). */
export type AssemblyLibrary = {
  materials: readonly Material[];
  wallAssemblies: readonly WallAssembly[];
};
export function assemblyLibraryOf(project: {
  materials?: readonly Material[] | undefined;
  wallAssemblies?: readonly WallAssembly[] | undefined;
}): AssemblyLibrary {
  return { materials: projectMaterials(project), wallAssemblies: projectWallAssemblies(project) };
}

/**
 * One layer of a wall across its thickness (docs/WANDAUFBAU.md, SA2): local y from the right
 * face (−thickness/2) to the left face (+thickness/2), the side of wallBody's local profile.
 */
export type WallLayerBand = { from: number; to: number; material: Material };

/** Bands of a wall with a build-up; null without one (the wall keeps its cut fill). */
export function wallLayerBands(
  wall: {
    thickness: number;
    assemblyId?: string | undefined;
    assemblyFlipped?: boolean | undefined;
  },
  library: AssemblyLibrary,
): WallLayerBand[] | null {
  const layers = wallLayers(wall, library.wallAssemblies);
  if (!layers) return null;
  const materials = new Map(library.materials.map((m) => [m.id, m]));
  const bands: WallLayerBand[] = [];
  let at = -wall.thickness / 2;
  for (const layer of layers) {
    const material = materials.get(layer.materialId);
    const to = at + layer.thickness;
    if (material) bands.push({ from: at, to, material });
    at = to;
  }
  // The stored thickness is the rounded sum; the last face is the wall face exactly.
  if (bands.length) bands.at(-1)!.to = wall.thickness / 2;
  return bands;
}

/**
 * Insulation symbol (DIN 1356-1): a zigzag across the whole layer, one tooth per layer
 * thickness, from x0 to x1 in the wall's local frame.
 */
export function insulationZigzag(
  band: { from: number; to: number },
  x0: number,
  x1: number,
): { x: number; y: number }[] {
  const step = Math.max(band.to - band.from, 1e-3);
  const points: { x: number; y: number }[] = [];
  const start = Math.floor(x0 / step) * step;
  for (let i = 0, x = start; x <= x1 + step; i++, x = start + i * step)
    points.push({ x, y: i % 2 === 0 ? band.from : band.to });
  return points;
}
