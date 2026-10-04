import { createProjectionFrame } from "@/geometry/projections/orthographic";
import type { ProjectionFrame } from "@/geometry/projections/orthographic";
import {
  backbufferSize,
  createProjectionState,
  projectionStateMatches,
} from "@/rendering/viewport/projection-state";
import type { ProjectionState } from "@/rendering/viewport/projection-state";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildSolid } from "@/lib/bim/geometry";
import type { Camera, Solid } from "@/lib/bim/geometry";
import type { Project, Point } from "@/lib/bim/model";
import type { Selection } from "./bim-view";
import { isSelectionClick, pickWallInProjection } from "@/lib/bim/picking";

const viewportOf = (canvas: HTMLCanvasElement) => {
  const { left, top, width, height } = canvas.getBoundingClientRect();
  return { left, top, width, height };
};

function createRenderer(canvas: HTMLCanvasElement) {
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
    "attribute vec3 position; attribute vec3 color; varying vec3 vColor; void main(){gl_Position=vec4(position,1.0);vColor=color;}",
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
  const buffer = gl.createBuffer();
  const position = gl.getAttribLocation(program, "position"),
    color = gl.getAttribLocation(program, "color");
  return {
    draw(solid: Solid, projection: ProjectionState, selectedWall: string | undefined) {
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
      const data: number[] = [];
      for (const face of solid.faces) {
        const light =
          0.5 +
          0.5 * Math.max(0, face.normal[0] * 0.3 - face.normal[1] * 0.4 + face.normal[2] * 0.866);
        const tint = face.wallId === selectedWall ? [0.38, 0.65, 0.78] : [0.72, 0.75, 0.79];
        for (const index of [0, 1, 2, 0, 2, 3])
          data.push(...projection.project(face.vertices[index]!), ...tint.map((v) => v * light));
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(color);
      gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 24, 12);
      gl.drawArrays(gl.TRIANGLES, 0, data.length / 6);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}

export function BimSolidView({
  project,
  selection,
  camera,
  onCamera,
  pan,
  onSelect,
  projectionFrame,
}: {
  project: Project;
  selection: Selection;
  camera: Camera;
  onCamera: (camera: Camera) => void;
  pan: boolean;
  onSelect: (selection: Selection, anchor?: Point) => void;
  projectionFrame?: ProjectionFrame;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createRenderer> | null>(null);
  const displayed = useRef<{ solid: Solid; projection: ProjectionState } | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    camera: Camera;
    pointerId: number;
    moved: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const solid = useMemo(() => buildSolid(project), [project]);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const setup = () => {
      try {
        renderer.current = createRenderer(canvas);
        setError("");
        setRevision((n) => n + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : "3D unavailable");
      }
    };
    const lost = (event: Event) => {
      event.preventDefault();
      displayed.current = null;
      drag.current = null;
      renderer.current = null;
      setError("Graphics context lost. Waiting for restoration; the model is retained.");
    };
    setup();
    const observer = new ResizeObserver(() => setRevision((n) => n + 1));
    observer.observe(canvas);
    const invalidate = () => {
      displayed.current = null;
      setRevision((n) => n + 1);
    };
    let resolution = window.matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    const dprChanged = () => {
      resolution.removeEventListener("change", dprChanged);
      resolution = window.matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
      resolution.addEventListener("change", dprChanged);
      invalidate();
    };
    resolution.addEventListener("change", dprChanged);
    window.addEventListener("resize", invalidate);
    window.addEventListener("scroll", invalidate, true);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", setup);
    return () => {
      observer.disconnect();
      resolution.removeEventListener("change", dprChanged);
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("scroll", invalidate, true);
      displayed.current = null;
      renderer.current?.dispose();
      renderer.current = null;
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", setup);
    };
  }, []);
  useEffect(() => {
    const selectedWall =
      selection?.kind === "wall"
        ? selection.id
        : project.storey.windows.find((w) => w.id === selection?.id)?.wallId;
    displayed.current = null;
    const canvas = canvasRef.current!;
    const projection = createProjectionState(
      projectionFrame ?? createProjectionFrame(solid),
      camera,
      viewportOf(canvas),
      backbufferSize(canvas.clientWidth, canvas.clientHeight, devicePixelRatio),
    );
    if (renderer.current && projection) {
      renderer.current.draw(solid, projection, selectedWall);
      displayed.current = { solid, projection };
    }
  }, [solid, camera, selection, project, revision, projectionFrame]);
  return (
    <>
      <canvas
        ref={canvasRef}
        aria-label="3D walls with window openings"
        role="img"
        tabIndex={0}
        title="Click a wall to select it; click empty space to clear selection. Drag to orbit or pan. Arrow keys rotate, +/− zoom. Select windows in Navigator."
        className="h-full w-full touch-none cursor-grab active:cursor-grabbing"
        onKeyDown={(event) => {
          const delta = 0.12;
          if (
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-", "="].includes(event.key)
          ) {
            event.preventDefault();
            if (event.key === "ArrowLeft") onCamera({ ...camera, yaw: camera.yaw - delta });
            if (event.key === "ArrowRight") onCamera({ ...camera, yaw: camera.yaw + delta });
            if (event.key === "ArrowUp")
              onCamera({ ...camera, pitch: Math.min(1.45, camera.pitch + delta) });
            if (event.key === "ArrowDown")
              onCamera({ ...camera, pitch: Math.max(-1.45, camera.pitch - delta) });
            if (["+", "=", "-"].includes(event.key))
              onCamera({
                ...camera,
                zoom: Math.max(0.2, Math.min(5, camera.zoom * (event.key === "-" ? 1 / 1.2 : 1.2))),
              });
          }
        }}
        onPointerDown={(event) => {
          if (event.button !== 0 || drag.current) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            camera,
            pointerId: event.pointerId,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          if (!drag.current || drag.current.pointerId !== event.pointerId) return;
          if (
            !drag.current.moved &&
            isSelectionClick(drag.current.x, drag.current.y, event.clientX, event.clientY)
          )
            return;
          drag.current.moved = true;
          const dx = event.clientX - drag.current.x,
            dy = event.clientY - drag.current.y,
            base = drag.current.camera;
          onCamera(
            pan
              ? {
                  ...base,
                  panX: base.panX + (dx / event.currentTarget.clientWidth) * 2,
                  panY: base.panY - (dy / event.currentTarget.clientHeight) * 2,
                }
              : {
                  ...base,
                  yaw: base.yaw + dx * 0.008,
                  pitch: Math.max(-1.45, Math.min(1.45, base.pitch + dy * 0.008)),
                },
          );
        }}
        onPointerUp={(event) => {
          const gesture = drag.current;
          if (!gesture || gesture.pointerId !== event.pointerId) return;
          drag.current = null;
          if (
            !gesture.moved &&
            isSelectionClick(gesture.x, gesture.y, event.clientX, event.clientY) &&
            !error
          ) {
            const canvas = event.currentTarget;
            const current = displayed.current;
            if (
              !current ||
              current.solid !== solid ||
              !projectionStateMatches(
                current.projection,
                camera,
                viewportOf(canvas),
                backbufferSize(canvas.clientWidth, canvas.clientHeight, devicePixelRatio),
              ) ||
              canvas.width !== current.projection.backbuffer.width ||
              canvas.height !== current.projection.backbuffer.height
            ) {
              if (canvas.hasPointerCapture(event.pointerId))
                canvas.releasePointerCapture(event.pointerId);
              setRevision((n) => n + 1);
              return;
            }
            const projection = current.projection;
            const point = projection.toNdc({ x: event.clientX, y: event.clientY });
            const id = pickWallInProjection(
              solid,
              projection.frame,
              projection.camera,
              projection.aspect,
              point.x,
              point.y,
            );
            onSelect(id ? { kind: "wall", id } : null, { x: event.clientX, y: event.clientY });
          }
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onWheel={(event) =>
          onCamera({
            ...camera,
            zoom: Math.max(0.2, Math.min(5, camera.zoom * Math.exp(-event.deltaY * 0.001))),
          })
        }
      />
      {error && (
        <p
          role="alert"
          className="absolute inset-x-4 top-16 rounded bg-popover p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {!solid.faces.length && !error && (
        <p className="absolute left-4 top-16 text-sm">No solid wall material to display.</p>
      )}
    </>
  );
}
