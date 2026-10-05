import { defaultGridSettings, gridSpacing } from "@/application/snapping/grid-settings";
import { visibleSurfaces } from "@/rendering/viewport/layer-display";
import { isLayerVisible } from "@/application/layers/visibility";
import type { DisplaySurfaces } from "@/rendering/viewport/layer-display";
import { createProjectionFrame, projectionDepthRadius } from "@/geometry/projections/orthographic";
import type { ProjectionFrame } from "@/geometry/projections/orthographic";
import {
  backbufferSize,
  createProjectionState,
  projectionStateMatches,
} from "@/rendering/viewport/projection-state";
import type { ProjectionState } from "@/rendering/viewport/projection-state";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildSolid } from "@/lib/bim/geometry";
import type { Camera } from "@/lib/bim/geometry";
import type { Project, Point } from "@/lib/bim/model";
import type { Selection } from "./bim-view";
import { isSelectionClick, pickWallInProjection } from "@/lib/bim/picking";
import { SolidSnapPreview } from "./SolidSnapPreview";
import { orientationFloor } from "@/rendering/viewport/orientation-floor";
import { selectionEdges, outlineTriangles } from "@/rendering/viewport/selection-outline";
import type { OutlineEdge } from "@/rendering/viewport/selection-outline";
import { useSolidInference } from "./useSolidInference";
import { previewEdit, supportsWallWorkplaneEdit } from "@/application/direct-edit/controller";
import type { BimPlanProps } from "./BimPlan";

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
    draw(
      solid: DisplaySurfaces,
      projection: ProjectionState,
      selectedWall: string | undefined,
      outline: OutlineEdge[],
    ) {
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
      const border = outlineTriangles(outline, projection);
      if (border.length) {
        gl.depthMask(false);
        gl.depthFunc(gl.LEQUAL);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(border), gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, border.length / 6);
        gl.depthMask(true);
        gl.depthFunc(gl.LESS);
      }
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}

export function BimSolidView({
  project,
  visibility,
  selection: requestedSelection,
  camera,
  onCamera,
  pan,
  onSelect,
  projectionFrame,
  snap = false,
  gridSettings = defaultGridSettings,
  editSession: requestedEditSession,
  numericTarget,
  snapping: requestedSnapping = null,
  ortho = false,
  onEditAim,
  onEditCommit,
  interactive = true,
}: {
  project: Project;
  selection: Selection;
  camera: Camera;
  onCamera: (camera: Camera) => void;
  pan: boolean;
  onSelect: BimPlanProps["onSelect"];
  projectionFrame?: ProjectionFrame;
  snap?: boolean;
} & Pick<
  BimPlanProps,
  | "gridSettings"
  | "editSession"
  | "numericTarget"
  | "snapping"
  | "ortho"
  | "onEditAim"
  | "onEditCommit"
  | "interactive"
  | "visibility"
>) {
  const editSession =
    requestedEditSession && isLayerVisible(project, visibility, requestedEditSession.target.id)
      ? requestedEditSession
      : null;
  const snapping = requestedEditSession && !editSession ? null : requestedSnapping;
  const selection =
    requestedSelection && isLayerVisible(project, visibility, requestedSelection.id)
      ? requestedSelection
      : null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createRenderer> | null>(null);
  const displayed = useRef<{ solid: DisplaySurfaces; projection: ProjectionState } | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    camera: Camera;
    pointerId: number;
    moved: boolean;
    editing: typeof editSession;
    navigation: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [viewProjection, setViewProjection] = useState<ProjectionState | null>(null);
  const [previewClient, setPreviewClient] = useState<(Point & { shift: boolean }) | null>(null);
  const [previewReset, setPreviewReset] = useState(0);
  const [aim, setAim] = useState<{ session: typeof editSession; point: Point } | null>(null);
  const baseSolid = useMemo(() => buildSolid(project), [project]);
  const frame = useMemo(
    () => projectionFrame ?? createProjectionFrame(baseSolid),
    [baseSolid, projectionFrame],
  );
  const moving =
    editSession?.target.kind === "wall" &&
    supportsWallWorkplaneEdit(editSession.target, editSession.action, editSession.index) &&
    editSession.base === project;
  const target =
    numericTarget !== undefined ? numericTarget : aim?.session === editSession ? aim?.point : null;
  const previewSolid = useMemo(() => {
    if (editSession && target) {
      try {
        return buildSolid(previewEdit(editSession, project, selection, target));
      } catch {
        /* Keep committed model on invalid input. */
      }
    }
    return baseSolid;
  }, [baseSolid, editSession, target, project, selection]);
  const solid = useMemo(
    () => visibleSurfaces(previewSolid, (id) => isLayerVisible(project, visibility, id)),
    [previewSolid, project, visibility],
  );
  const depthRadius = Math.max(
    projectionDepthRadius(frame, baseSolid),
    projectionDepthRadius(frame, solid),
  );
  // Only depth changes with the preview. Keep image fitting, pointer coordinates
  // and active construction references stable; all consumers share this snapshot.
  const previewProjection = useMemo(
    () =>
      viewProjection
        ? createProjectionState(
            { ...viewProjection.frame, depthRadius },
            viewProjection.camera,
            viewProjection.viewport,
            viewProjection.backbuffer,
          )
        : null,
    [viewProjection, depthRadius],
  );
  const outline = useMemo(
    () =>
      selection?.kind === "wall"
        ? selectionEdges(solid.faces.filter((face) => face.wallId === selection.id))
        : [],
    [solid, selection],
  );
  const inference = useSolidInference(
    project,
    previewProjection,
    previewClient,
    snap && !error && interactive,
    previewReset,
    moving ? snapping : null,
    moving ? editSession.target.id : undefined,
    ortho,
    previewClient?.shift ?? false,
    visibility,
    moving ? gridSpacing(gridSettings) : null,
  );
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
      setViewProjection(null);
      setPreviewClient(null);
      drag.current = null;
      renderer.current = null;
      setError("Graphics context lost. Waiting for restoration; the model is retained.");
    };
    setup();
    const observer = new ResizeObserver(() => setRevision((n) => n + 1));
    observer.observe(canvas);
    const invalidate = () => {
      displayed.current = null;
      setViewProjection(null);
      setPreviewClient(null);
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
    displayed.current = null;
    const canvas = canvasRef.current!;
    const projection = createProjectionState(
      frame,
      camera,
      viewportOf(canvas),
      backbufferSize(canvas.clientWidth, canvas.clientHeight, devicePixelRatio),
    );
    setPreviewClient(null);
    setViewProjection(renderer.current ? projection : null);
  }, [frame, camera, revision]);
  useEffect(() => {
    const selectedWall =
      selection?.kind === "wall"
        ? selection.id
        : project.storey.windows.find((w) => w.id === selection?.id)?.wallId;
    displayed.current = null;
    if (renderer.current && previewProjection) {
      renderer.current.draw(solid, previewProjection, selectedWall, outline);
      displayed.current = { solid, projection: previewProjection };
    }
  }, [solid, previewProjection, selection, project, revision, outline]);
  return (
    <>
      {previewProjection && !error && (
        <svg
          aria-label="Orientierungsebene z=0"
          className="pointer-events-none absolute inset-0"
          width={previewProjection.viewport.width}
          height={previewProjection.viewport.height}
        >
          <polygon
            points={orientationFloor(baseSolid, previewProjection) ?? ""}
            fill="rgba(120, 134, 145, 0.14)"
            stroke="rgba(120, 134, 145, 0.3)"
            strokeWidth={1}
          />
        </svg>
      )}
      <SolidSnapPreview
        projection={previewProjection}
        enabled={snap && !error && interactive}
        inference={inference}
      />
      <canvas
        ref={canvasRef}
        aria-label="3D walls with window openings"
        role="img"
        tabIndex={0}
        title={
          moving
            ? editSession.action === "move"
              ? "Wand auf z=0 bewegen. Klick fixiert Richtung; Tab für Länge und Winkel. Pan schaltet auf Navigation; Esc bricht ab."
              : "Auf z=0 bearbeiten. Klick übernimmt Ziel; Tab für Maße. Pan schaltet auf Navigation; Esc bricht ab."
            : "Sichtbaren Wandfußpunkt als Bewegungsursprung anklicken. Ziehen dreht oder verschiebt die Ansicht. Pfeiltasten drehen, +/− zoomt."
        }
        className={`relative z-10 h-full w-full touch-none ${moving && !pan ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setPreviewClient(null);
            setPreviewReset((n) => n + 1);
          }
          const delta = 0.12;
          if (
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-", "="].includes(event.key)
          ) {
            event.preventDefault();
            setPreviewClient(null);
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
          setPreviewClient(null);
          if (event.button !== 0 || drag.current || !interactive) return;
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            camera,
            pointerId: event.pointerId,
            moved: false,
            editing: editSession,
            navigation: !moving || pan,
          };
        }}
        onPointerMove={(event) => {
          if (!interactive) return;
          if (!drag.current || !drag.current.navigation) {
            const current = displayed.current;
            const canvas = event.currentTarget;
            if (
              current &&
              current.solid === solid &&
              projectionStateMatches(
                current.projection,
                camera,
                viewportOf(canvas),
                backbufferSize(canvas.clientWidth, canvas.clientHeight, devicePixelRatio),
              )
            ) {
              setPreviewClient({ x: event.clientX, y: event.clientY, shift: event.shiftKey });
              if (moving && !pan) {
                const result = inference.resolve(
                  { x: event.clientX, y: event.clientY },
                  event.shiftKey,
                );
                if (result) {
                  setAim({ session: editSession, point: result.point });
                  onEditAim?.(editSession, result.point);
                }
              }
            } else setPreviewClient(null);
            return;
          }
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
          if (gesture.editing !== editSession || !interactive) return;
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
            if (editSession) {
              // Navigation is never also a target click. Invalid inverse never confirms.
              if (moving && !gesture.navigation) {
                const result = inference.resolve(
                  { x: event.clientX, y: event.clientY },
                  event.shiftKey,
                );
                if (result) onEditCommit?.(editSession, result.point);
              }
              if (canvas.hasPointerCapture(event.pointerId))
                canvas.releasePointerCapture(event.pointerId);
              return;
            }
            const foot = inference.adapter?.query(
              project,
              projection,
              { x: event.clientX, y: event.clientY },
              10,
            );
            const anchor =
              foot?.status === "ok"
                ? foot.candidates.find((c) => c.visibility === "visible")
                : null;
            if (anchor?.sourceEntityId) {
              onSelect(
                { kind: "wall", id: anchor.sourceEntityId },
                { x: event.clientX, y: event.clientY },
                anchor.pointIndex ?? undefined,
                anchor.worldPoint,
              );
              if (canvas.hasPointerCapture(event.pointerId))
                canvas.releasePointerCapture(event.pointerId);
              return;
            }
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
          setPreviewClient(null);
          drag.current = null;
        }}
        onPointerCancel={() => {
          setPreviewClient(null);
          drag.current = null;
        }}
        onPointerLeave={() => setPreviewClient(null)}
        onBlur={() => setPreviewClient(null)}
        onWheel={(event) => {
          setPreviewClient(null);
          onCamera({
            ...camera,
            zoom: Math.max(0.2, Math.min(5, camera.zoom * Math.exp(-event.deltaY * 0.001))),
          });
        }}
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
