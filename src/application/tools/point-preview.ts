import type { Point2 } from "../../geometry/primitives/point.ts";

/** One disposable preview per bound interaction. Guards run even on cache hits.
 * Create a new instance when the immutable action context changes. Confirmation
 * must evaluate the action afresh, never commit this presentation result.
 */
export function createPointPreview<T>(evaluate: (point: Point2) => T, guard: () => void) {
  let last: { x: number; y: number; value: T } | undefined;
  return {
    get(point: Point2): T {
      try {
        guard();
        if (last && last.x === point.x && last.y === point.y) return last.value;
        last = undefined;
        const value = evaluate(point);
        last = { x: point.x, y: point.y, value };
        return value;
      } catch (error) {
        last = undefined;
        throw error;
      }
    },
    clear() {
      last = undefined;
    },
  };
}
