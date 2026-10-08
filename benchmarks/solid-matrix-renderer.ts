// Isolated camera-only fork of the existing WebGL renderer. Never imported by product code.
// Explicit snapshot replacement; product integration remains a separate step.
import { outlineTriangles } from "../src/rendering/viewport/selection-outline.ts";
import type { OutlineEdge } from "../src/rendering/viewport/selection-outline.ts";
import { cameraMatrix } from "./solid-matrix.ts";
import { faceTriangles } from "../src/geometry/solids/face-triangles.ts";
import type { Vector3 } from "../src/geometry/projections/orthographic.ts";
import type { ProjectionState } from "../src/rendering/viewport/projection-state.ts";
import type { DisplaySurfaces } from "../src/rendering/viewport/layer-display.ts";
function createMatrixResources(
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
    "attribute vec3 position; attribute vec3 color; uniform mat4 camera; varying vec3 vColor; void main(){gl_Position=camera*vec4(position,1.0);vColor=color;}",
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
    color = gl.getAttribLocation(program, "color");
  const cameraUniform = gl.getUniformLocation(program, "camera");
  const data: number[] = [];
  for (const face of solid.faces) {
    const light =
      0.5 + 0.5 * Math.max(0, face.normal[0] * 0.3 - face.normal[1] * 0.4 + face.normal[2] * 0.866);
    const tint = selected.has(face.wallId) ? [0.38, 0.65, 0.78] : [0.72, 0.75, 0.79];
    for (const triangle of faceTriangles(face.vertices.length))
      for (const index of triangle)
        data.push(
          ...face.vertices[index]!.map((v, i) => v - origin[i]!),
          ...tint.map((v) => v * light),
        );
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

  return {
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
        cameraMatrix(projection.frame, projection.camera, projection.aspect, origin),
      );
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(color);
      gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 24, 12);
      gl.drawArrays(gl.TRIANGLES, 0, data.length / 6);
      const border = [
        ...outlineTriangles(outline, projection),
        ...outlineTriangles(windowOutline, projection, 2, [0.25, 0.8, 0.87]),
      ];
      if (border.length) {
        gl.bindBuffer(gl.ARRAY_BUFFER, borderBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(border), gl.DYNAMIC_DRAW);
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

/** Own GPU resources per canvas, keep only the latest immutable display snapshot. */
export function createMatrixRenderer(
  canvas: HTMLCanvasElement,
  initial: DisplaySurfaces,
  initialOrigin: Vector3,
) {
  let solid = initial,
    origin: Vector3 = [...initialOrigin],
    selected = new Set<string>();
  let disposed = false,
    lost = false,
    builds = 0;
  const build = () => {
    builds++;
    return createMatrixResources(canvas, solid, origin, selected);
  };
  let resource: ReturnType<typeof createMatrixResources> | null = build();
  const lose = (event: Event) => {
    event.preventDefault();
    lost = true;
    resource = null;
  };
  const restore = () => {
    if (!disposed) {
      lost = false;
      resource = build();
    }
  };
  canvas.addEventListener("webglcontextlost", lose);
  canvas.addEventListener("webglcontextrestored", restore);
  return {
    get builds() {
      return builds;
    },
    get available() {
      return !disposed && !lost && !!resource;
    },
    update(
      next: DisplaySurfaces,
      nextOrigin: Vector3,
      nextSelected: ReadonlySet<string> = selected,
    ) {
      if (disposed) throw Error("Disposed renderer");
      const unchanged =
        solid === next &&
        origin.every((v, i) => v === nextOrigin[i]) &&
        selected.size === nextSelected.size &&
        [...selected].every((id) => nextSelected.has(id));
      if (unchanged) return;
      solid = next;
      origin = [...nextOrigin];
      selected = new Set(nextSelected);
      resource?.dispose();
      resource = null;
      if (!lost) resource = build();
    },
    draw(
      projection: ProjectionState,
      outline: OutlineEdge[] = [],
      windowOutline: OutlineEdge[] = [],
    ) {
      resource?.draw(projection, outline, windowOutline);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      resource?.dispose();
      resource = null;
      canvas.removeEventListener("webglcontextlost", lose);
      canvas.removeEventListener("webglcontextrestored", restore);
    },
  };
}
