import { faceTriangles } from "../src/geometry/solids/face-triangles.ts";
import { triangleDepth } from "../src/geometry/projections/triangle-depth.ts";
import type { Vector3 } from "../src/geometry/projections/orthographic.ts";
import type { DisplaySurfaces } from "../src/rendering/viewport/layer-display.ts";
import type { ProjectionState } from "../src/rendering/viewport/projection-state.ts";
import type { WindowSelectionSurface } from "../src/rendering/viewport/window-selection.ts";
import type { ElementTarget } from "../src/application/selection/target.ts";
type Triangle = { points: Vector3[]; target: ElementTarget; bounds: number[] };
/** Isolated, immutable displayed-projection index; never used by production picking. */
export function preparePicking(
  solid: DisplaySurfaces,
  windows: readonly WindowSelectionSurface[],
  projection: ProjectionState,
) {
  const triangles: Triangle[] = [],
    buckets = Array.from({ length: 1024 }, () => [] as number[]),
    wide: number[] = [];
  const cell = (v: number) => Math.max(0, Math.min(31, Math.floor((v + 1) * 16)));
  const add = (points: Vector3[], target: ElementTarget) => {
    if (!points.flat().every(Number.isFinite)) return;
    const xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    // triangleDepth permits barycentric weights down to -1e-9: up to two negative weights.
    const ex =
      2e-9 * (maxX - minX) + Number.EPSILON * 16 * Math.max(1, Math.abs(minX), Math.abs(maxX));
    const ey =
      2e-9 * (maxY - minY) + Number.EPSILON * 16 * Math.max(1, Math.abs(minY), Math.abs(maxY));
    const bounds = [minX - ex, maxX + ex, minY - ey, maxY + ey];
    if (bounds[1]! < -1 || bounds[0]! > 1 || bounds[3]! < -1 || bounds[2]! > 1) return;
    const id = triangles.length;
    triangles.push({ points, target: { ...target }, bounds });
    const x0 = cell(bounds[0]!),
      x1 = cell(bounds[1]!),
      y0 = cell(bounds[2]!),
      y1 = cell(bounds[3]!);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 64) {
      wide.push(id);
      return;
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) buckets[y * 32 + x]!.push(id);
  };
  for (const face of solid.faces) {
    const points = face.vertices.map(projection.project);
    for (const [a, b, c] of faceTriangles(points.length))
      add([points[a]!, points[b]!, points[c]!], { kind: "wall", id: face.wallId });
  }
  for (const w of windows) {
    const p = w.vertices.map(projection.project);
    for (const [a, b, c] of [
      [0, 1, 2],
      [0, 2, 3],
    ])
      add([p[a!]!, p[b!]!, p[c!]!], { kind: "window", id: w.id });
  }
  return {
    triangleCount: triangles.length,
    query(
      current: DisplaySurfaces,
      currentWindows: readonly WindowSelectionSurface[],
      currentProjection: ProjectionState,
      x: number,
      y: number,
    ) {
      if (current !== solid || currentWindows !== windows || currentProjection !== projection)
        throw Error("Stale displayed picking context");
      if (![x, y].every(Number.isFinite) || Math.abs(x) > 1 || Math.abs(y) > 1)
        return { target: null, depth: null, tested: 0 };
      const ids = [...buckets[cell(y) * 32 + cell(x)]!, ...wide].sort((a, b) => a - b);
      let depth = Infinity,
        target: ElementTarget | null = null,
        tested = 0;
      for (const id of ids) {
        const t = triangles[id]!,
          b = t.bounds;
        if (x < b[0]! || x > b[1]! || y < b[2]! || y > b[3]!) continue;
        tested++;
        const hit = triangleDepth(t.points[0]!, t.points[1]!, t.points[2]!, x, y);
        if (hit !== null && hit < depth) {
          depth = hit;
          target = t.target;
        }
      }
      return { target: target ? { ...target } : null, depth: target ? depth : null, tested };
    },
  };
}
