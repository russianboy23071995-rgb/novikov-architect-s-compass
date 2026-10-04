import { projectOrthographic } from "../../geometry/projections/orthographic.ts";
import type {
  ProjectionFrame,
  OrthographicCamera,
  Vector3,
} from "../../geometry/projections/orthographic.ts";
import { createHorizontalWorkplaneFromFrame } from "./horizontal-workplane.ts";
import type { CssViewport } from "./horizontal-workplane.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";

export function backbufferSize(width: number, height: number, dpr: number) {
  return {
    width: Math.max(1, Math.round(width * Math.min(dpr, 2))),
    height: Math.max(1, Math.round(height * Math.min(dpr, 2))),
  };
}

/** One immutable displayed projection; bounds may be explicitly pinned by a future operation. */
export function createProjectionState(
  inputFrame: ProjectionFrame,
  inputCamera: OrthographicCamera,
  inputViewport: CssViewport,
  buffer: { width: number; height: number },
) {
  if (
    ![
      ...inputFrame.center,
      inputFrame.radius,
      ...Object.values(inputCamera),
      ...Object.values(inputViewport),
      buffer.width,
      buffer.height,
    ].every(Number.isFinite) ||
    inputFrame.radius <= 0 ||
    inputCamera.zoom <= 0 ||
    inputViewport.width <= 0 ||
    inputViewport.height <= 0 ||
    !Number.isInteger(buffer.width) ||
    !Number.isInteger(buffer.height) ||
    buffer.width <= 0 ||
    buffer.height <= 0
  )
    return null;
  const frame: ProjectionFrame = Object.freeze({
    center: Object.freeze([...inputFrame.center]) as Vector3,
    radius: inputFrame.radius,
  });
  const camera = Object.freeze({ ...inputCamera }),
    viewport = Object.freeze({ ...inputViewport }),
    backbuffer = Object.freeze({ ...buffer });
  const aspect = backbuffer.width / backbuffer.height;
  return Object.freeze({
    frame,
    camera,
    viewport,
    backbuffer,
    aspect,
    project: (point: Vector3) => projectOrthographic(point, frame, camera, aspect),
    toNdc: (point: Point2) => ({
      x: (2 * (point.x - viewport.left)) / viewport.width - 1,
      y: 1 - (2 * (point.y - viewport.top)) / viewport.height,
    }),
    workplane: (height = 0) =>
      createHorizontalWorkplaneFromFrame(frame, camera, viewport, aspect, height),
  });
}
export type ProjectionState = NonNullable<ReturnType<typeof createProjectionState>>;

/** No stale displayed state may select after camera/layout/backbuffer changes. */
export function projectionStateMatches(
  state: ProjectionState,
  camera: OrthographicCamera,
  viewport: CssViewport,
  buffer: { width: number; height: number },
) {
  return (
    (Object.keys(state.camera) as (keyof OrthographicCamera)[]).every(
      (k) => state.camera[k] === camera[k],
    ) &&
    (Object.keys(state.viewport) as (keyof CssViewport)[]).every(
      (k) => state.viewport[k] === viewport[k],
    ) &&
    state.backbuffer.width === buffer.width &&
    state.backbuffer.height === buffer.height
  );
}
