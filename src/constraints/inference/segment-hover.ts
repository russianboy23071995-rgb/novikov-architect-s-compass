import type { Point2 } from "../../geometry/primitives/point.ts";
import type { SnapReference } from "../snapping/engine.ts";

/** Stable segment identity across small pointer motion; distance is in screen pixels. */
export function hoveredSegment(
  cursor: Point2,
  sources: readonly SnapReference[],
  pixelsPerMetre: number,
  radiusPx = 10,
): SnapReference | null {
  let best: SnapReference | null = null,
    distance = radiusPx;
  for (const ref of sources) {
    if (!ref.segment) continue;
    const { start, end } = ref.segment,
      dx = end.x - start.x,
      dy = end.y - start.y,
      ll = dx * dx + dy * dy;
    if (!ll) continue;
    const t = ((cursor.x - start.x) * dx + (cursor.y - start.y) * dy) / ll;
    if (t < 0 || t > 1) continue;
    const d = Math.hypot(cursor.x - start.x - t * dx, cursor.y - start.y - t * dy) * pixelsPerMetre;
    if (d <= distance) {
      best = ref;
      distance = d;
    }
  }
  return best;
}
/** Tracked segment directions are available through every active construction origin. */
export function withParallelDirections(references: readonly SnapReference[]): SnapReference[] {
  const directions = references.filter((r) => r.segment).flatMap((r) => r.directions ?? []);
  return references.map((r) => ({ ...r, parallelDirections: directions }));
}
