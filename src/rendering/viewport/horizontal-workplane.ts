import {
  createProjectionFrame,
  horizontalProjectionAxes,
  projectOrthographic,
} from "../../geometry/projections/orthographic.ts";
import type {
  OrthographicCamera,
  ProjectionBounds,
} from "../../geometry/projections/orthographic.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import type { Box2 } from "../../geometry/spatial/box-index.ts";

export type ProjectionResult<T> =
  { status: "ok"; value: T } | { status: "invalid-input" | "ill-conditioned" | "precision-loss" };
export type CssViewport = { left: number; top: number; width: number; height: number };
// Numerical guard, not a model tolerance or permission to widen snapping.
export const MAX_WORKPLANE_CONDITION = 1e6;
export const MAX_INVERSE_ERROR_METRES = 1e-6;
const finite = (...values: number[]) => values.every(Number.isFinite);
const ok = <T>(value: T): ProjectionResult<T> => ({ status: "ok", value });

/** Client CSS coordinates, with the exact aspect used to render NDC (possibly rounded backbuffer aspect).
 * Captures immutable frame/camera/viewport snapshots; no scene, React or BIM state is retained.
 */
export function createHorizontalWorkplaneProjection(
  bounds: ProjectionBounds,
  inputCamera: OrthographicCamera,
  inputViewport: CssViewport,
  renderAspect: number,
  height = 0,
) {
  const camera = { ...inputCamera },
    viewport = { ...inputViewport };
  const frame = createProjectionFrame(bounds);
  if (
    !finite(
      ...bounds.min,
      ...bounds.max,
      ...frame.center,
      frame.radius,
      camera.yaw,
      camera.pitch,
      camera.zoom,
      camera.panX,
      camera.panY,
      viewport.left,
      viewport.top,
      viewport.width,
      viewport.height,
      renderAspect,
      height,
    ) ||
    bounds.min.some((v, i) => v > bounds.max[i]!) ||
    camera.zoom <= 0 ||
    viewport.width <= 0 ||
    viewport.height <= 0 ||
    renderAspect <= 0
  )
    return { status: "invalid-input" as const };
  const css = (x: number, y: number): ProjectionResult<Point2> => {
    if (!finite(x, y)) return { status: "invalid-input" };
    const projected = projectOrthographic([x, y, height], frame, camera, renderAspect);
    const point = {
      x: viewport.left + ((projected[0] + 1) * viewport.width) / 2,
      y: viewport.top + ((1 - projected[1]) * viewport.height) / 2,
    };
    return finite(point.x, point.y) ? ok(point) : { status: "precision-loss" };
  };
  const anchor = css(frame.center[0], frame.center[1]);
  if (anchor.status !== "ok") return anchor;
  const axes = horizontalProjectionAxes(frame, camera, renderAspect);
  const raw = [
    (axes.u[0] * viewport.width) / 2,
    (axes.v[0] * viewport.width) / 2,
    (-axes.u[1] * viewport.height) / 2,
    (-axes.v[1] * viewport.height) / 2,
  ];
  const scale = Math.max(...raw.map(Math.abs));
  if (!finite(...raw, scale) || scale <= 0) return { status: "ill-conditioned" as const };
  const [a, b, c, d] = raw.map((v) => v / scale) as [number, number, number, number];
  const determinant = a * d - b * c;
  const trace = a * a + b * b + c * c + d * d;
  const largest = Math.sqrt(
    (trace + Math.sqrt(Math.max(0, trace * trace - 4 * determinant * determinant))) / 2,
  );
  const smallest = Math.abs(determinant) / largest;
  const condition = largest / smallest;
  if (!Number.isFinite(condition) || condition > MAX_WORKPLANE_CONDITION)
    return { status: "ill-conditioned" as const };
  const inverse = [
    d / determinant / scale,
    -b / determinant / scale,
    -c / determinant / scale,
    a / determinant / scale,
  ];
  const inverseNorm = Math.max(
    Math.abs(inverse[0]!) + Math.abs(inverse[1]!),
    Math.abs(inverse[2]!) + Math.abs(inverse[3]!),
  );
  if (!finite(...inverse, inverseNorm)) return { status: "ill-conditioned" as const };
  const toPlane = (
    screen: Point2,
  ): ProjectionResult<{ point: Point2; errorBoundMetres: number }> => {
    if (!finite(screen.x, screen.y)) return { status: "invalid-input" };
    const dx = screen.x - anchor.value.x,
      dy = screen.y - anchor.value.y;
    const u = inverse[0]! * dx + inverse[1]! * dy,
      v = inverse[2]! * dx + inverse[3]! * dy;
    const point = { x: frame.center[0] + u, y: frame.center[1] + v };
    // Conservative roundoff allowance for projection, subtraction and inverse arithmetic.
    // Does not include human pointer accuracy, CSS quantization or inaccurate source data.
    const screenMagnitude = Math.max(
      1,
      Math.abs(screen.x),
      Math.abs(screen.y),
      Math.abs(anchor.value.x),
      Math.abs(anchor.value.y),
    );
    const worldMagnitude = Math.max(
      1,
      ...frame.center.map(Math.abs),
      Math.abs(height),
      Math.abs(u),
      Math.abs(v),
    );
    const errorBoundMetres = 32 * Number.EPSILON * (screenMagnitude * inverseNorm + worldMagnitude);
    if (!finite(point.x, point.y, errorBoundMetres) || errorBoundMetres > MAX_INVERSE_ERROR_METRES)
      return { status: "precision-loss" };
    return ok({ point, errorBoundMetres });
  };
  const queryBounds = (screen: Point2, radiusPx: number): ProjectionResult<Box2> => {
    if (!finite(screen.x, screen.y, radiusPx) || radiusPx < 0) return { status: "invalid-input" };
    const points: Point2[] = [];
    let padding = 0;
    for (const x of [-radiusPx, radiusPx])
      for (const y of [-radiusPx, radiusPx]) {
        const result = toPlane({ x: screen.x + x, y: screen.y + y });
        if (result.status !== "ok") return result;
        points.push(result.value.point);
        padding = Math.max(padding, result.value.errorBoundMetres);
      }
    return ok({
      minX: Math.min(...points.map((p) => p.x)) - padding,
      maxX: Math.max(...points.map((p) => p.x)) + padding,
      minY: Math.min(...points.map((p) => p.y)) - padding,
      maxY: Math.max(...points.map((p) => p.y)) + padding,
    });
  };
  return {
    status: "ok" as const,
    value: Object.freeze({
      frame,
      height,
      condition,
      toScreen: (point: Point2) => css(point.x, point.y),
      toPlane,
      queryBounds,
    }),
  };
}
