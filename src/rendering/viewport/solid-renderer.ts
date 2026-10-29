import { CAD_TURQUOISE_RGB } from "./highlight.ts";
import { outlineTriangles } from "./selection-outline.ts";
import type { OutlineEdge } from "./selection-outline.ts";
import { cameraMatrix } from "../../geometry/projections/camera-matrix.ts";
import { createSolidBufferCache, SOLID_VERTEX_FLOATS } from "./solid-buffer.ts";
import type { Vector3 } from "../../geometry/projections/orthographic.ts";
import type { ProjectionState } from "./projection-state.ts";
import type { DisplaySurfaces } from "./layer-display.ts";
export function createMatrixResources(
  canvas: HTMLCanvasElement,
  solid: DisplaySurfaces,
  origin: Vector3,
  selected: ReadonlySet<string>,
) {
  const gl = canvas.getContext("webgl", { antialias: true, alpha: true });
  if (!gl)
    throw new Error("WebGL is unavailable. Use the 2D view or enable graphics acceleration.");
  const shader = (type: number, source: string) => {
    const result = gl.createShader(type)!;
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      gl.deleteShader(result);
      throw new Error("3D shader could not be compiled.");
    }
    return result;
  };
  const vertex = shader(
    gl.VERTEX_SHADER,
    // Higher display priority wins on coincident faces: a depth step far below model
    // precision (1e-5 of the NDC range, about 0.5 mm at 100 m depth) instead of flicker.
    "attribute vec3 position; attribute vec3 color; attribute float priority; uniform mat4 camera; varying vec3 vColor; void main(){gl_Position=camera*vec4(position,1.0);gl_Position.z-=priority*1e-5*gl_Position.w;vColor=color;}",
  );
  const fragment = shader(
    gl.FRAGMENT_SHADER,
    "precision mediump float; varying vec3 vColor; void main(){gl_FragColor=vec4(vColor,1.0);}",
  );
  const program = gl.createProgram()!;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    throw new Error("3D renderer could not be initialized.");
  }
  const buffer = gl.createBuffer(),
    borderBuffer = gl.createBuffer();
  const position = gl.getAttribLocation(program, "position"),
    color = gl.getAttribLocation(program, "color"),
    priority = gl.getAttribLocation(program, "priority");
  const stride = SOLID_VERTEX_FLOATS * 4;
  const cameraUniform = gl.getUniformLocation(program, "camera");
  const cache = createSolidBufferCache();
  let localOrigin: Vector3 = [...origin],
    vertexCount = 0;
  const update = (
    next: DisplaySurfaces,
    nextOrigin: Vector3,
    nextSelected: ReadonlySet<string>,
  ) => {
    const change = cache.update(next, nextOrigin, nextSelected);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    if (change.full) gl.bufferData(gl.ARRAY_BUFFER, change.full, gl.DYNAMIC_DRAW);
    else
      for (const patch of change.patches)
        gl.bufferSubData(gl.ARRAY_BUFFER, patch.offset, patch.data);
    localOrigin = [...nextOrigin];
    vertexCount = change.vertexCount;
  };
  update(solid, origin, selected);

  return {
    update,
    draw(projection: ProjectionState, outline: OutlineEdge[], windowOutline: OutlineEdge[]) {
      const { width, height } = projection.backbuffer;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.DEPTH_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.uniformMatrix4fv(
        cameraUniform,
        false,
        cameraMatrix(projection.frame, projection.camera, projection.aspect, localOrigin),
      );
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(color);
      gl.vertexAttribPointer(color, 3, gl.FLOAT, false, stride, 12);
      gl.enableVertexAttribArray(priority);
      gl.vertexAttribPointer(priority, 1, gl.FLOAT, false, stride, 24);
      gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
      const border = [
        ...outlineTriangles(outline, projection),
        ...outlineTriangles(windowOutline, projection, 3, [0.72, 0.93, 0.94]),
        ...outlineTriangles(windowOutline, projection, 1.5, CAD_TURQUOISE_RGB),
      ];
      if (border.length) {
        gl.bindBuffer(gl.ARRAY_BUFFER, borderBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(border), gl.DYNAMIC_DRAW);
        // Outline triangles carry no priority: constant 0 instead of the solid buffer.
        gl.disableVertexAttribArray(priority);
        gl.vertexAttrib1f(priority, 0);
        gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 24, 12);
        gl.uniformMatrix4fv(
          cameraUniform,
          false,
          new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        );
        gl.depthMask(false);
        gl.depthFunc(gl.LEQUAL);
        gl.drawArrays(gl.TRIANGLES, 0, border.length / 6);
        gl.depthMask(true);
        gl.depthFunc(gl.LESS);
      }
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteBuffer(borderBuffer);
      gl.deleteProgram(program);
    },
  };
}

/** Canvas owns context events; one program and two buffers survive displayed snapshots. */
export function createSolidRenderer(canvas: HTMLCanvasElement) {
  if (!canvas.getContext("webgl", { antialias: true, alpha: true }))
    throw new Error("WebGL is unavailable. Use the 2D view or enable graphics acceleration.");
  let resource: ReturnType<typeof createMatrixResources> | null = null;
  let previous: DisplaySurfaces | null = null,
    origin: Vector3 = [0, 0, 0],
    selected = new Set<string>(),
    disposed = false;
  return {
    draw(
      solid: DisplaySurfaces,
      projection: ProjectionState,
      nextSelected: ReadonlySet<string>,
      outline: OutlineEdge[],
      windows: OutlineEdge[],
    ) {
      if (disposed) throw Error("Disposed renderer");
      const nextOrigin = projection.frame.center;
      if (
        previous !== solid ||
        !origin.every((v, i) => v === nextOrigin[i]) ||
        selected.size !== nextSelected.size ||
        ![...selected].every((id) => nextSelected.has(id))
      ) {
        if (resource) resource.update(solid, nextOrigin, nextSelected);
        else resource = createMatrixResources(canvas, solid, nextOrigin, nextSelected);
        previous = solid;
        origin = [...nextOrigin];
        selected = new Set(nextSelected);
      }
      resource!.draw(projection, outline, windows);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      resource?.dispose();
      resource = null;
      previous = null;
    },
  };
}
