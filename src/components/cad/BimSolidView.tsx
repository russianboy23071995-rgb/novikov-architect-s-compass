import { createProjectionFrame, projectOrthographic } from "@/geometry/projections/orthographic";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildSolid } from "@/lib/bim/geometry";
import type { Camera, Solid } from "@/lib/bim/geometry";
import type { Project, Point } from "@/lib/bim/model";
import type { Selection } from "./bim-view";
import { isSelectionClick, pickWall } from "@/lib/bim/picking";

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
    draw(solid: Solid, camera: Camera, selectedWall: string | undefined) {
      const width = Math.max(1, Math.round(canvas.clientWidth * Math.min(devicePixelRatio, 2)));
      const height = Math.max(1, Math.round(canvas.clientHeight * Math.min(devicePixelRatio, 2)));
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
      const frame = createProjectionFrame(solid);
      for (const face of solid.faces) {
        const light =
          0.5 +
          0.5 * Math.max(0, face.normal[0] * 0.3 - face.normal[1] * 0.4 + face.normal[2] * 0.866);
        const tint = face.wallId === selectedWall ? [0.38, 0.65, 0.78] : [0.72, 0.75, 0.79];
        for (const index of [0, 1, 2, 0, 2, 3])
          data.push(
            ...projectOrthographic(face.vertices[index]!, frame, camera, width / height),
            ...tint.map((v) => v * light),
          );
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
}: {
  project: Project;
  selection: Selection;
  camera: Camera;
  onCamera: (camera: Camera) => void;
  pan: boolean;
  onSelect: (selection: Selection, anchor?: Point) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createRenderer> | null>(null);
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
      renderer.current = null;
      setError("Graphics context lost. Waiting for restoration; the model is retained.");
    };
    setup();
    const observer = new ResizeObserver(() => setRevision((n) => n + 1));
    observer.observe(canvas);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", setup);
    return () => {
      observer.disconnect();
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
    renderer.current?.draw(solid, camera, selectedWall);
  }, [solid, camera, selection, project, revision]);
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
            const bounds = event.currentTarget.getBoundingClientRect();
            const id = pickWall(
              solid,
              camera,
              bounds.width / bounds.height,
              (2 * (event.clientX - bounds.left)) / bounds.width - 1,
              1 - (2 * (event.clientY - bounds.top)) / bounds.height,
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
