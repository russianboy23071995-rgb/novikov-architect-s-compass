/** 3D drag rendering trace (diagnostic builds only, docs/performance/DRAG_RENDERING_3D.md). */
export type RenderEvent = { name: string; start: number; ms: number; value?: number };
export const renderEvents: RenderEvent[] = [];
(globalThis as { renderEvents?: RenderEvent[] }).renderEvents = renderEvents;
// gpu=1: wait for the GPU after each draw with a one-pixel read. Separate run, it stalls the pipeline.
const waitForGpu = new URLSearchParams(location.search).get("gpu") === "1";

export function renderSync<T>(name: string, action: () => T): T {
  const start = performance.now();
  try {
    return action();
  } finally {
    renderEvents.push({ name, start, ms: performance.now() - start });
  }
}
export function renderUpload(change: {
  full: Float32Array | null;
  patches: { data: Float32Array }[];
  vertexCount: number;
}) {
  const bytes = change.full
    ? change.full.byteLength
    : change.patches.reduce((n, p) => n + p.data.byteLength, 0);
  const start = performance.now();
  renderEvents.push({
    name: change.full ? "upload-full" : "upload-patch",
    start,
    ms: 0,
    value: bytes,
  });
  renderEvents.push({ name: "triangles", start, ms: 0, value: change.vertexCount / 3 });
}
export function renderGpu(canvas: HTMLCanvasElement) {
  if (!waitForGpu) return;
  const gl = canvas.getContext("webgl")!;
  const start = performance.now();
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  renderEvents.push({ name: "gpu", start, ms: performance.now() - start });
}
export function renderTimed<A extends unknown[], R>(
  name: string,
  action: (...args: A) => R,
  ...args: A
): R {
  const start = performance.now();
  const result = action(...args);
  const value = Array.isArray(result) ? result.length : undefined;
  renderEvents.push({
    name,
    start,
    ms: performance.now() - start,
    ...(value === undefined ? {} : { value }),
  });
  return result;
}
