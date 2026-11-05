import {
  objectSolids,
  objectSymbol,
  type PlacedObject,
} from "../../domain/elements/object/model.ts";

type Size = Pick<PlacedObject, "catalogId" | "width" | "depth" | "height"> &
  Partial<Pick<PlacedObject, "mirrored" | "options" | "finishes">>;
type P = { x: number; y: number };
/** One filled face in unit-free preview coordinates, y down; `shade` 0 dark … 1 light. */
export type PreviewFace = { points: P[]; shade: number; color?: string };
export type PreviewBounds = { minX: number; minY: number; width: number; height: number };

const place = (o: Size) => ({
  ...o,
  position: { x: 0, y: 0 },
  rotation: 0,
  baseOffset: 0,
});
function bounds(points: readonly P[]): PreviewBounds {
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  const minX = Math.min(...xs),
    minY = Math.min(...ys);
  return {
    minX,
    minY,
    width: Math.max(...xs) - minX || 1,
    height: Math.max(...ys) - minY || 1,
  };
}

/** The plan symbol for the library window, y down (docs/OBJEKTBIBLIOTHEK.md, M1). */
export function objectPlanPreview(o: Size) {
  const lines = objectSymbol(place(o)).map((line) => ({
    closed: line.closed,
    points: line.points.map((p) => ({ x: p.x, y: -p.y })),
  }));
  return { lines, bounds: bounds(lines.flatMap((l) => l.points)) };
}

const COS = Math.cos(Math.PI / 6),
  SIN = Math.sin(Math.PI / 6);
/** Seen from front right above: +x runs right and down, +y right and up, z up. */
const project = (p: P, z: number): P => ({ x: (p.x + p.y) * COS, y: (p.x - p.y) * SIN - z });

/**
 * The object's solids as a small view from front right above: per solid its top and the sides
 * towards the viewer, far solids first. A drawing of the same solids as the 3D body, no renderer.
 */
export function objectAxonometricPreview(o: Size) {
  const solids = objectSolids(place(o)).map((solid) => {
    const n = solid.ring.length;
    const mid = {
      x: solid.ring.reduce((sum, c) => sum + c.x, 0) / n,
      y: solid.ring.reduce((sum, c) => sum + c.y, 0) / n,
    };
    return { ...solid, depth: mid.x - mid.y + (solid.top + solid.bottom) / 2 };
  });
  solids.sort((a, b) => a.depth - b.depth);
  const faces: PreviewFace[] = [];
  for (const { ring, bottom, top, color } of solids) {
    const own = color ? { color } : {};
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!,
        c = ring[(i + 1) % ring.length]!;
      const length = Math.hypot(c.x - a.x, c.y - a.y) || 1;
      const nx = (c.y - a.y) / length,
        ny = -(c.x - a.x) / length;
      // Rings run counterclockwise; the viewer stands towards +x, −y.
      if (nx - ny <= 1e-9) continue;
      faces.push({
        ...own,
        shade: 0.42 * nx * nx + 0.62 * ny * ny,
        points: [project(a, bottom), project(c, bottom), project(c, top), project(a, top)],
      });
    }
    faces.push({ ...own, shade: 0.9, points: ring.map((p) => project(p, top)) });
  }
  return { faces, bounds: bounds(faces.flatMap((f) => f.points)) };
}
