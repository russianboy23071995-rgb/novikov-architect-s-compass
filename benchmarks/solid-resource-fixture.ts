import type { DisplaySurfaces } from "../src/rendering/viewport/layer-display.ts";
import { createProjectionState } from "../src/rendering/viewport/projection-state.ts";
export function resourceFixture(count: number): DisplaySurfaces {
  return {
    min: [0, 0, 0],
    max: [count, 1, 3],
    faces: Array.from({ length: count }, (_, i) => ({
      wallId: `w${i}`,
      normal: [0, -1, 0],
      vertices: [
        [i, 0, 0],
        [i + 0.8, 0, 0],
        [i + 0.8, 0, 3],
        [i, 0, 3],
      ],
    })),
  };
}
export const resourceProjection = () =>
  createProjectionState(
    { center: [0, 0, 0], radius: 10, depthRadius: 50 },
    { yaw: 0.6, pitch: 0.6, zoom: 1, panX: 0, panY: 0 },
    { left: 0, top: 0, width: 600, height: 400 },
    { width: 1200, height: 800 },
  )!;
/** Command recorder, not a substitute for browser pixel verification. */
export function recordingCanvas() {
  const stats = {
    programs: 0,
    buffers: 0,
    fullBytes: 0,
    partialBytes: 0,
    deletedPrograms: 0,
    deletedBuffers: 0,
  };
  let serial = 0;
  const methods: Record<string, unknown> = {
    createProgram: () => {
      stats.programs++;
      return { id: serial++ };
    },
    createShader: () => ({ id: serial++ }),
    createBuffer: () => {
      stats.buffers++;
      return { id: serial++ };
    },
    getShaderParameter: () => true,
    getProgramParameter: () => true,
    getAttribLocation: () => 0,
    getUniformLocation: () => ({}),
    bufferData: (_target: number, data: Float32Array) => {
      stats.fullBytes += data.byteLength;
    },
    bufferSubData: (_target: number, _offset: number, data: Float32Array) => {
      stats.partialBytes += data.byteLength;
    },
    deleteProgram: () => {
      stats.deletedPrograms++;
    },
    deleteBuffer: () => {
      stats.deletedBuffers++;
    },
  };
  const gl = new Proxy(methods, { get: (target, key: string) => target[key] ?? (() => undefined) });
  const canvas = { width: 0, height: 0, getContext: () => gl } as unknown as HTMLCanvasElement;
  return { canvas, stats };
}
