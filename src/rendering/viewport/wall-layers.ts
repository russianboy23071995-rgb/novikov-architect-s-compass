import {
  projectMaterials,
  projectWallAssemblies,
  wallLayers,
  type Material,
  type WallAssembly,
} from "../../domain/elements/wall/assembly.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { intersectLines } from "../../geometry/intersections/lines.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";

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
export type WallLayerBand = { from: number; to: number; material: Material; core: boolean };

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
    if (material) bands.push({ from: at, to, material, core: !!layer.core });
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

type JointWall = { id: string; start: Point2; end: Point2; thickness: number; bodyOffset: number };
/**
 * Core of an incoming wall carried through the host's cover layers at a T joint (docs/WALL_JUNCTIONS.md,
 * L09 U2): profile in the incoming wall's local frame (x along the wall from its body start,
 * y across it, as `wallLayerBands`) and the incoming core bands to fill it with. Plan drawing
 * only; contours, 3D, IFC and quantities keep the plain butt joint. Both walls need a build-up
 * with a load-bearing layer, and the host needs cover layers on the joined side.
 */
export type WallLayerJoint = {
  hostWallId: string;
  wallId: string;
  profile: Point2[];
  bands: WallLayerBand[];
};
export function tJunctionLayerJoints(
  walls: readonly JointWall[],
  tees: readonly { hostWallId: string; incoming: { wallId: string; endpoint: 0 | 1 } }[],
  bandsOf: ReadonlyMap<string, readonly WallLayerBand[]>,
): WallLayerJoint[] {
  const byId = new Map(walls.map((w) => [w.id, w]));
  return tees.flatMap((tee) => {
    const host = byId.get(tee.hostWallId),
      incoming = byId.get(tee.incoming.wallId);
    const hostCore = bandsOf.get(tee.hostWallId)?.filter((b) => b.core) ?? [];
    const bands = bandsOf.get(tee.incoming.wallId) ?? [];
    const core = bands.filter((b) => b.core);
    if (!host || !incoming || !hostCore.length || !core.length) return [];
    const hb = wallBody(host),
      ib = wallBody(incoming);
    const near = tee.incoming.endpoint === 0 ? incoming.start : incoming.end,
      far = tee.incoming.endpoint === 0 ? incoming.end : incoming.start;
    // Side of the host the incoming wall runs away from.
    const side = (far.x - near.x) * hb.normal.x + (far.y - near.y) * hb.normal.y > 0 ? 1 : -1;
    const half = host.thickness / 2;
    const cover =
      side > 0
        ? half - Math.max(...hostCore.map((b) => b.to))
        : Math.min(...hostCore.map((b) => b.from)) + half;
    if (!(cover > 1e-9)) return [];
    const along = { x: hb.normal.y, y: -hb.normal.x },
      dir = { x: ib.normal.y, y: -ib.normal.x };
    const face = hb.corner(0, side);
    const coreFace = {
      x: face.x - side * cover * hb.normal.x,
      y: face.y - side * cover * hb.normal.y,
    };
    const across = (y: number) => ({
      x: ib.start.x + ib.normal.x * y,
      y: ib.start.y + ib.normal.y * y,
    });
    const from = Math.min(...core.map((b) => b.from)),
      to = Math.max(...core.map((b) => b.to));
    const points = [
      intersectLines(across(from), dir, face, along),
      intersectLines(across(from), dir, coreFace, along),
      intersectLines(across(to), dir, coreFace, along),
      intersectLines(across(to), dir, face, along),
    ];
    if (points.some((p) => !p)) return [];
    const profile = (points as Point2[]).map((p) => {
      const dx = p.x - ib.start.x,
        dy = p.y - ib.start.y;
      return { x: dx * dir.x + dy * dir.y, y: dx * ib.normal.x + dy * ib.normal.y };
    });
    // Everything between the outer core faces goes through, e.g. two cores and their gap.
    const through = bands.filter((b) => b.from >= from && b.to <= to);
    return [{ hostWallId: host.id, wallId: incoming.id, profile, bands: through }];
  });
}
