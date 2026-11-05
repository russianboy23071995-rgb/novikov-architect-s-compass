import {
  objectBoxes,
  objectSymbol,
  type PlacedObject,
} from "../../domain/elements/object/model.ts";

type Size = Pick<PlacedObject, "catalogId" | "width" | "depth" | "height" | "mirrored">;
type P = { x: number; y: number };
/** One filled face in unit-free preview coordinates, y down; `shade` 0 dark … 1 light. */
export type PreviewFace = { points: P[]; shade: number };
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
 * The object's boxes as a small view from front right above: per box the top and the two faces
 * towards the viewer, far boxes first. A drawing of the same boxes as the 3D body, no renderer.
 */
export function objectAxonometricPreview(o: Size) {
  const boxes = objectBoxes(place(o)).map(({ corners, bottom, top }) => {
    const mid = {
      x: corners.reduce((n, c) => n + c.x, 0) / corners.length,
      y: corners.reduce((n, c) => n + c.y, 0) / corners.length,
    };
    return { corners, bottom, top, depth: mid.x - mid.y + (top + bottom) / 2 };
  });
  boxes.sort((a, b) => a.depth - b.depth);
  const faces: PreviewFace[] = [];
  for (const { corners, bottom, top } of boxes) {
    const xs = corners.map((c) => c.x),
      ys = corners.map((c) => c.y);
    const x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      y0 = Math.min(...ys),
      y1 = Math.max(...ys);
    faces.push({
      shade: 0.62,
      points: [
        project({ x: x0, y: y0 }, bottom),
        project({ x: x1, y: y0 }, bottom),
        project({ x: x1, y: y0 }, top),
        project({ x: x0, y: y0 }, top),
      ],
    });
    faces.push({
      shade: 0.42,
      points: [
        project({ x: x1, y: y0 }, bottom),
        project({ x: x1, y: y1 }, bottom),
        project({ x: x1, y: y1 }, top),
        project({ x: x1, y: y0 }, top),
      ],
    });
    faces.push({
      shade: 0.9,
      points: [
        project({ x: x0, y: y0 }, top),
        project({ x: x1, y: y0 }, top),
        project({ x: x1, y: y1 }, top),
        project({ x: x0, y: y1 }, top),
      ],
    });
  }
  return { faces, bounds: bounds(faces.flatMap((f) => f.points)) };
}
