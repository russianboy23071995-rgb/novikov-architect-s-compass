import { faceTriangles } from "../../geometry/solids/face-triangles.ts";
import { triangleDepth } from "../../geometry/projections/triangle-depth.ts";
import type { Vector3 } from "../../geometry/projections/orthographic.ts";
import type { DisplaySurfaces } from "./layer-display.ts";
import type { ProjectionState } from "./projection-state.ts";
import type { WindowSelectionSurface } from "./window-selection.ts";
import type { ElementTarget } from "../../application/selection/target.ts";
type Triangle = {
  points: Vector3[];
  target: ElementTarget;
  min: number[];
  max: number[];
  id: number;
};
type Node = { min: number[]; max: number[]; children?: Node[]; items?: Triangle[] };
/** Camera-independent immutable world BVH. Project only visited bounds, then exact candidates. */
export function* buildWorldPicking(
  solid: DisplaySurfaces,
  windows: readonly WindowSelectionSurface[],
) {
  const items: Triangle[] = [];
  const add = (points: Vector3[], target: ElementTarget) => {
    const min = [0, 1, 2].map((i) => Math.min(...points.map((p) => p[i]!))),
      max = [0, 1, 2].map((i) => Math.max(...points.map((p) => p[i]!)));
    for (let i = 0; i < 3; i++) {
      const e =
        2e-9 * (max[i]! - min[i]!) +
        16 * Number.EPSILON * Math.max(1, Math.abs(min[i]!), Math.abs(max[i]!));
      min[i]! -= e;
      max[i]! += e;
    }
    items.push({
      points: points.map((p) => [...p] as Vector3),
      target: { ...target },
      min,
      max,
      id: items.length,
    });
  };
  for (const f of solid.faces)
    for (const [a, b, c] of faceTriangles(f.vertices.length)) {
      add([f.vertices[a]!, f.vertices[b]!, f.vertices[c]!], { kind: "wall", id: f.wallId });
      yield;
    }
  for (const w of windows)
    for (const [a, b, c] of [
      [0, 1, 2],
      [0, 2, 3],
    ]) {
      add([w.vertices[a!]!, w.vertices[b!]!, w.vertices[c!]!], { kind: "window", id: w.id });
      yield;
    }
  const build = function* (list: Triangle[], depth = 0): Generator<void, Node, void> {
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity];
    for (const t of list) {
      yield;
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i]!, t.min[i]!);
        max[i] = Math.max(max[i]!, t.max[i]!);
      }
    }
    if (list.length <= 8 || depth >= 32) return { min, max, items: list };
    const axis = [0, 1, 2].sort((a, b) => max[b]! - min[b]! - (max[a]! - min[a]!))[0]!;
    const split = (min[axis]! + max[axis]!) / 2,
      left: Triangle[] = [],
      right: Triangle[] = [];
    for (const t of list) {
      ((t.min[axis]! + t.max[axis]!) / 2 < split ? left : right).push(t);
      yield;
    }
    if (!left.length || !right.length) return { min, max, items: list };
    return { min, max, children: [yield* build(left, depth + 1), yield* build(right, depth + 1)] };
  };
  const root = items.length ? yield* build(items) : null;
  return {
    triangleCount: items.length,
    query(
      current: DisplaySurfaces,
      currentWindows: readonly WindowSelectionSurface[],
      projection: ProjectionState,
      x: number,
      y: number,
    ) {
      if (current !== solid || currentWindows !== windows)
        throw Error("Stale model picking context");
      if (![x, y].every(Number.isFinite) || Math.abs(x) > 1 || Math.abs(y) > 1)
        return { target: null, depth: null, tested: 0, nodes: 0 };
      const candidates: Triangle[] = [];
      let nodes = 0;
      const visit = (n: Node) => {
        nodes++;
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (let mask = 0; mask < 8; mask++) {
          const p = projection.project([
            mask & 1 ? n.max[0]! : n.min[0]!,
            mask & 2 ? n.max[1]! : n.min[1]!,
            mask & 4 ? n.max[2]! : n.min[2]!,
          ]);
          minX = Math.min(minX, p[0]);
          maxX = Math.max(maxX, p[0]);
          minY = Math.min(minY, p[1]);
          maxY = Math.max(maxY, p[1]);
        }
        const e =
          32 *
          Number.EPSILON *
          Math.max(1, Math.abs(minX), Math.abs(maxX), Math.abs(minY), Math.abs(maxY));
        if (x < minX - e || x > maxX + e || y < minY - e || y > maxY + e) return;
        if (n.items) {
          for (const item of n.items) candidates.push(item);
        } else n.children!.forEach(visit);
      };
      if (root) visit(root);
      candidates.sort((a, b) => a.id - b.id);
      let depth = Infinity,
        target: ElementTarget | null = null;
      for (const t of candidates) {
        const p = t.points.map(projection.project),
          hit = triangleDepth(p[0]!, p[1]!, p[2]!, x, y);
        if (hit !== null && hit < depth) {
          depth = hit;
          target = t.target;
        }
      }
      return {
        target: target ? { ...target } : null,
        depth: target ? depth : null,
        tested: candidates.length,
        nodes,
      };
    },
  };
}

/** Synchronous adapter for diagnostics; UI uses the cooperative builder. */
export function prepareWorldPicking(
  solid: DisplaySurfaces,
  windows: readonly WindowSelectionSurface[],
) {
  const build = buildWorldPicking(solid, windows);
  let step = build.next();
  while (!step.done) step = build.next();
  return step.value;
}
