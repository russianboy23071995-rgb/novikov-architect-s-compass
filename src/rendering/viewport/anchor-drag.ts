import type { Point2 } from "../../geometry/primitives/point.ts";

/** Pointer gesture only. Snapping, constraints and commits remain in Application. */
export type AnchorDrag = {
  pointerId: number;
  origin: Point2;
  pointerStart: Point2;
  screenStart: Point2;
};

export function anchorDragTarget(
  drag: AnchorDrag,
  pointerId: number,
  point: Point2,
  screen: Point2,
) {
  if (drag.pointerId !== pointerId) return null;
  return {
    point: {
      x: drag.origin.x + point.x - drag.pointerStart.x,
      y: drag.origin.y + point.y - drag.pointerStart.y,
    },
    moved: Math.hypot(screen.x - drag.screenStart.x, screen.y - drag.screenStart.y) >= 3,
  };
}
