import { z } from "zod";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";
import { contains } from "../../../geometry/polygons/contains.ts";

export const MAX_TERRAIN_POINTS = 5000;
const finite = z.number().finite();
const heightPoint = z.object({ x: finite, y: finite, z: finite.min(-500).max(9000) }).strict();
export type TerrainPoint = z.infer<typeof heightPoint>;

/**
 * Gelände (docs/GELAENDE.md, L43): one surface of the project, held by its ground storey. The
 * outline carries a height at every corner, `points` are height points inside it. Heights are
 * metres from the ±0,00 of the project. The body reaches `depth` below the lowest point.
 */
export const terrainSchema = z
  .object({
    id: z.string().trim().min(1),
    layerId: z.string().trim().min(1),
    outline: z.array(heightPoint).min(3).max(MAX_TERRAIN_POINTS),
    points: z.array(heightPoint).max(MAX_TERRAIN_POINTS),
    depth: finite.min(0.05).max(100),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional(),
    /** Distance of the contour lines in the plan, in metres. */
    contourStep: finite.min(0.05).max(50).optional(),
  })
  .strict()
  .superRefine((terrain, ctx) => {
    const check = validateSimplePolygon(terrain.outline);
    if (!check.valid)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["outline"],
        message: `Ungültiger Geländeumriss: ${check.reason}`,
      });
    terrain.points.forEach((p, i) => {
      if (!contains(terrain.outline, p))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["points", i],
          message: "Höhenpunkte müssen innerhalb des Geländeumrisses liegen.",
        });
    });
  });
export type Terrain = z.infer<typeof terrainSchema>;

export const TERRAIN_DEFAULTS = { depth: 1, color: "#8fa876", contourStep: 0.5 } as const;

type Triangle = readonly [TerrainPoint, TerrainPoint, TerrainPoint];

/** True when p lies inside the circumcircle of the triangle. */
function inCircle(a: TerrainPoint, b: TerrainPoint, c: TerrainPoint, p: TerrainPoint) {
  const ax = a.x - p.x,
    ay = a.y - p.y,
    bx = b.x - p.x,
    by = b.y - p.y,
    cx = c.x - p.x,
    cy = c.y - p.y;
  const det =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay);
  const turn = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return turn > 0 ? det > 1e-12 : det < -1e-12;
}

/** Outline corners with extra points along long edges, so that the triangles keep to a concave
 * outline. Heights run linearly along an edge. */
function denseOutline(outline: readonly TerrainPoint[]): TerrainPoint[] {
  const xs = outline.map((p) => p.x),
    ys = outline.map((p) => p.y);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const step = size / 24;
  return outline.flatMap((a, i) => {
    const b = outline[(i + 1) % outline.length]!;
    const parts = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
    return Array.from({ length: parts }, (_, k) => {
      const t = k / parts;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
    });
  });
}

/** Bowyer-Watson triangulation of the given points. */
function delaunay(points: readonly TerrainPoint[]): Triangle[] {
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2,
    my = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1);
  const far = [
    { x: mx - 30 * span, y: my - 20 * span, z: 0 },
    { x: mx + 30 * span, y: my - 20 * span, z: 0 },
    { x: mx, y: my + 40 * span, z: 0 },
  ];
  let triangles: [TerrainPoint, TerrainPoint, TerrainPoint][] = [[far[0]!, far[1]!, far[2]!]];
  const key = (a: TerrainPoint, b: TerrainPoint) => `${a.x},${a.y}|${b.x},${b.y}`;
  for (const p of points) {
    const bad = triangles.filter(([a, b, c]) => inCircle(a, b, c, p));
    const edges = new Map<string, [TerrainPoint, TerrainPoint]>();
    for (const [a, b, c] of bad)
      for (const [u, v] of [
        [a, b],
        [b, c],
        [c, a],
      ] as const) {
        // An edge two bad triangles share lies inside the hole.
        if (edges.delete(key(v, u))) continue;
        edges.set(key(u, v), [u, v]);
      }
    const gone = new Set(bad);
    triangles = triangles.filter((t) => !gone.has(t));
    for (const [u, v] of edges.values()) triangles.push([u, v, p]);
  }
  return triangles.filter((t) => !t.some((p) => far.includes(p)));
}

const meshes = new WeakMap<object, Triangle[]>();

/** The surface as triangles, counterclockwise from above, inside the outline only. */
export function terrainMesh(terrain: Pick<Terrain, "outline" | "points">): Triangle[] {
  const known = meshes.get(terrain);
  if (known) return known;
  const seen = new Set<string>();
  const all = [...denseOutline(terrain.outline), ...terrain.points].filter((p) => {
    const key = `${p.x},${p.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const mesh = delaunay(all)
    .filter(([a, b, c]) =>
      contains(terrain.outline, { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 }),
    )
    .map(([a, b, c]): Triangle => {
      const turn = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      return turn > 0 ? [a, b, c] : [a, c, b];
    });
  meshes.set(terrain, mesh);
  return mesh;
}

/** Height of the surface at a plan point, null outside the mesh. */
export function terrainHeightAt(
  terrain: Pick<Terrain, "outline" | "points">,
  point: { x: number; y: number },
): number | null {
  for (const [a, b, c] of terrainMesh(terrain)) {
    const d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (!d) continue;
    const u = ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / d;
    const v = ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / d;
    const w = 1 - u - v;
    if (u >= -1e-9 && v >= -1e-9 && w >= -1e-9) return u * a.z + v * b.z + w * c.z;
  }
  return null;
}

/** The body ends `depth` below the lowest corner or height point. */
export function terrainFloor(terrain: Pick<Terrain, "outline" | "points" | "depth">) {
  return Math.min(...[...terrain.outline, ...terrain.points].map((p) => p.z)) - terrain.depth;
}
