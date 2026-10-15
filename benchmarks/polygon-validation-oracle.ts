// Frozen pre-optimization validator (main 6e4df27). Test/measurement oracle only.
import type { Point2 } from "../src/geometry/primitives/point.ts";
import { intersectSegments } from "../src/geometry/intersections/segments.ts";
import { projectDirection } from "../src/geometry/projections/direction.ts";
import {
  coordinatesCompatible,
  pointsCompatible,
  MAX_MODEL_TOLERANCE_METRES,
} from "../src/geometry/tolerances/model.ts";

export type PolygonValidation =
  | { valid: true; signedArea: number; winding: "clockwise" | "counterclockwise" }
  | {
      valid: false;
      reason:
        | "too-few-vertices"
        | "non-finite-coordinate"
        | "zero-edge"
        | "edge-contact"
        | "zero-area"
        | "numeric-range";
      /** Zero-based vertex/edge indices, where applicable. Edge i starts at vertex i. */
      indices: readonly number[];
    };

function onSegment(point: Point2, a: Point2, b: Point2): boolean {
  const projected = projectDirection(point, a, { x: b.x - a.x, y: b.y - a.y });
  if (!projected || !pointsCompatible(point, projected)) return false;
  return (["x", "y"] as const).every((axis) => {
    const low = Math.min(a[axis], b[axis]),
      high = Math.max(a[axis], b[axis]);
    return (
      (point[axis] >= low || coordinatesCompatible(point[axis], low)) &&
      (point[axis] <= high || coordinatesCompatible(point[axis], high))
    );
  });
}

/**
 * One simple, implicitly closed ring in metres, with no repeated closing vertex.
 * No repair, reordering or mutation. Both windings and redundant straight vertices
 * are allowed; holes, self-touching and overlapping edges are not.
 * Uses model compatibility (never screen snap tolerance). O(n²), for validation
 * at action boundaries, not pointer-time snapping. Unrepresentable arithmetic fails closed.
 */
export function validateSimplePolygon(vertices: readonly Point2[]): PolygonValidation {
  return validatePolygon(vertices, allEdgePairs(vertices.length));
}

function* allEdgePairs(count: number): Generator<readonly [number, number]> {
  for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) yield [i, j];
}

function validatePolygon(
  vertices: readonly Point2[],
  pairs: Iterable<readonly [number, number]>,
): PolygonValidation {
  const fail = (
    reason: Extract<PolygonValidation, { valid: false }>["reason"],
    ...indices: number[]
  ): PolygonValidation => ({ valid: false, reason, indices });
  for (let i = 0; i < vertices.length; i++) {
    if (![vertices[i]!.x, vertices[i]!.y].every(Number.isFinite))
      return fail("non-finite-coordinate", i);
  }
  const count = vertices.length;
  if (count < 3) return fail("too-few-vertices");
  for (let i = 0; i < count; i++) {
    const a = vertices[i]!,
      b = vertices[(i + 1) % count]!;
    if (pointsCompatible(a, b)) return fail("zero-edge", i);
  }

  // Translate before products to avoid area cancellation at large world offsets.
  const origin = vertices[0]!;
  const local = vertices.map((p) => ({ x: p.x - origin.x, y: p.y - origin.y }));
  let twiceArea = 0;
  for (let i = 0; i < count; i++) {
    const a = local[i]!,
      b = local[(i + 1) % count]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const term = a.x * b.y - a.y * b.x;
    if (!Number.isFinite(length) || !Number.isFinite(term)) return fail("numeric-range");
    twiceArea += term;
  }
  if (!Number.isFinite(twiceArea)) return fail("numeric-range");

  // Conservative broad phase only. Both segments can accept a contact within
  // the model tolerance, so retain pairs within twice its maximum. Never use
  // a screen-space snap distance or change the exact narrow-phase predicates.
  const bounds = vertices.map((a, i) => {
    const b = vertices[(i + 1) % count]!;
    return {
      minX: Math.min(a.x, b.x),
      maxX: Math.max(a.x, b.x),
      minY: Math.min(a.y, b.y),
      maxY: Math.max(a.y, b.y),
    };
  });
  const margin = 2 * MAX_MODEL_TOLERANCE_METRES;
  for (const [i, j] of pairs) {
    const first = bounds[i]!,
      second = bounds[j]!;
    if (
      first.minX - second.maxX > margin ||
      second.minX - first.maxX > margin ||
      first.minY - second.maxY > margin ||
      second.minY - first.maxY > margin
    )
      continue;
    const a = vertices[i]!,
      b = vertices[(i + 1) % count]!;
    const c = vertices[j]!,
      d = vertices[(j + 1) % count]!;
    if (j === i + 1) {
      // The shared vertex is allowed, backtracking along either edge is not.
      if (onSegment(a, c, d) || onSegment(d, a, b)) return fail("edge-contact", i, j);
    } else if (i === 0 && j === count - 1) {
      if (onSegment(b, c, d) || onSegment(c, a, b)) return fail("edge-contact", i, j);
    } else if (
      intersectSegments(a, b, c, d) ||
      onSegment(a, c, d) ||
      onSegment(b, c, d) ||
      onSegment(c, a, b) ||
      onSegment(d, a, b)
    ) {
      return fail("edge-contact", i, j);
    }
  }
  // Collinear/near-collinear edges are rejected above using model tolerances.
  const signedArea = twiceArea / 2;
  if (signedArea === 0) return fail("zero-area");
  return { valid: true, signedArea, winding: signedArea > 0 ? "counterclockwise" : "clockwise" };
}
