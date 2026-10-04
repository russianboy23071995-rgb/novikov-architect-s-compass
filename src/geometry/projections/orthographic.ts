export type Vector3 = readonly [number, number, number];
export type OrthographicCamera = {
  yaw: number;
  pitch: number;
  zoom: number;
  panX: number;
  panY: number;
};
export type ProjectionBounds = { min: Vector3; max: Vector3 };
export type ProjectionFrame = {
  readonly center: Vector3;
  readonly radius: number;
  /** Independent clipping extent; omitted preserves the original projection. */
  readonly depthRadius?: number;
};

/** Camera-independent depth envelope around a pinned image frame. Power-of-two
 * tiers avoid changing projection identity for every small preview movement.
 * The enclosing sphere stays within half of the NDC depth range at any yaw/pitch.
 */
export function projectionDepthRadius(frame: ProjectionFrame, bounds: ProjectionBounds): number {
  const distance = Math.hypot(
    ...frame.center.map((c, i) =>
      Math.max(Math.abs(bounds.min[i]! - c), Math.abs(bounds.max[i]! - c)),
    ),
  );
  const base = frame.depthRadius ?? frame.radius;
  return base * 2 ** Math.max(0, Math.ceil(Math.log2(distance / base)));
}

/** Snapshot of model-independent bounds. Callers validate external numeric inputs. */
export function createProjectionFrame(bounds: ProjectionBounds): ProjectionFrame {
  return Object.freeze({
    center: Object.freeze(bounds.min.map((v, i) => (v + bounds.max[i]!) / 2)) as Vector3,
    radius: Math.max(0.1, Math.hypot(...bounds.max.map((v, i) => v - bounds.min[i]!)) / 2),
  });
}
function factors(frame: ProjectionFrame, camera: OrthographicCamera, aspect: number) {
  return {
    c: Math.cos(camera.yaw),
    s: Math.sin(camera.yaw),
    cp: Math.cos(camera.pitch),
    sp: Math.sin(camera.pitch),
    scale: (0.85 * camera.zoom) / frame.radius,
    wide: Math.max(1, aspect),
    tall: Math.min(1, aspect),
  };
}
/** Z-up world to NDC. Operation ordering preserves the existing renderer and depth values. */
export function projectOrthographic(
  point: Vector3,
  frame: ProjectionFrame,
  camera: OrthographicCamera,
  aspect: number,
): [number, number, number] {
  const x = point[0] - frame.center[0],
    y = point[1] - frame.center[1],
    z = point[2] - frame.center[2];
  const { c, s, cp, sp, scale, wide, tall } = factors(frame, camera, aspect);
  return [
    ((c * x + s * y) * scale) / wide + camera.panX,
    (-s * sp * x + c * sp * y + cp * z) * scale * tall + camera.panY,
    -(s * cp * x - c * cp * y + sp * z) / ((frame.depthRadius ?? frame.radius) * 2),
  ];
}
/** Analytic XY derivatives avoid subtracting projected points with large translations. */
export function horizontalProjectionAxes(
  frame: ProjectionFrame,
  camera: OrthographicCamera,
  aspect: number,
) {
  const { c, s, cp, sp, scale, wide, tall } = factors(frame, camera, aspect);
  return {
    u: [
      (c * scale) / wide,
      -s * sp * scale * tall,
      (-s * cp) / ((frame.depthRadius ?? frame.radius) * 2),
    ] as Vector3,
    v: [
      (s * scale) / wide,
      c * sp * scale * tall,
      (c * cp) / ((frame.depthRadius ?? frame.radius) * 2),
    ] as Vector3,
  };
}
