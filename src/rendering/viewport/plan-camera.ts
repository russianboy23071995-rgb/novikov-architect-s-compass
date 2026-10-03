import type { Point2 as Point } from "../../geometry/primitives/point.ts";

export type PlanCamera = { center: Point; pixelsPerMetre: number };
export type ViewSize = { width: number; height: number };
export const clampScale = (scale: number) => Math.max(0.1, Math.min(10000, scale));

export function fitPlan(bounds: string, size: ViewSize): PlanCamera {
  const [x, y, width, height] = bounds.split(" ").map(Number) as [number, number, number, number];
  return {
    center: { x: x + width / 2, y: -y - height / 2 },
    pixelsPerMetre: clampScale(Math.min(size.width / width, size.height / height)),
  };
}

export function planViewBox(camera: PlanCamera, size: ViewSize): string {
  const width = size.width / camera.pixelsPerMetre;
  const height = size.height / camera.pixelsPerMetre;
  return `${camera.center.x - width / 2} ${-camera.center.y - height / 2} ${width} ${height}`;
}

/** CSS pixels relative to the drawing surface; independent of device pixel ratio. */
export function screenToPlan(camera: PlanCamera, size: ViewSize, screen: Point): Point {
  return {
    x: camera.center.x + (screen.x - size.width / 2) / camera.pixelsPerMetre,
    y: camera.center.y - (screen.y - size.height / 2) / camera.pixelsPerMetre,
  };
}

export function zoomPlan(
  camera: PlanCamera,
  size: ViewSize,
  factor: number,
  anchor: Point = { x: size.width / 2, y: size.height / 2 },
): PlanCamera {
  const fixed = screenToPlan(camera, size, anchor);
  const scale = clampScale(camera.pixelsPerMetre * factor);
  return {
    pixelsPerMetre: scale,
    center: {
      x: fixed.x - (anchor.x - size.width / 2) / scale,
      y: fixed.y + (anchor.y - size.height / 2) / scale,
    },
  };
}

export function panPlan(camera: PlanCamera, delta: Point): PlanCamera {
  return {
    ...camera,
    center: {
      x: camera.center.x - delta.x / camera.pixelsPerMetre,
      y: camera.center.y + delta.y / camera.pixelsPerMetre,
    },
  };
}

export function planScaleBar(scale: number): { metres: number; pixels: number } {
  const target = 100 / scale;
  const power = 10 ** Math.floor(Math.log10(target));
  const fraction = target / power;
  const metres = (fraction >= 5 ? 5 : fraction >= 2 ? 2 : 1) * power;
  return { metres, pixels: metres * scale };
}
