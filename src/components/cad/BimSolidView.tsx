import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import { CAD_SHIMMER } from "@/rendering/viewport/highlight";
import { useSolidPicking } from "./useSolidPicking";
import {
  windowSelectionSurfaces,
  windowSelectionEdges,
} from "@/rendering/viewport/window-selection";
import type { SnapCandidate } from "@/constraints/snapping/engine";
import { selectedWallAxis, WALL_AXIS_COLOR } from "@/rendering/viewport/wall-axis";
import { createSolidRenderer as createRenderer } from "@/rendering/viewport/solid-renderer";
import { cornerPreviewSurfaces } from "@/rendering/viewport/corner-preview";
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
import { isSelectionClick } from "@/lib/bim/picking";
import { SolidSnapPreview } from "./SolidSnapPreview";
import { orientationFloor } from "@/rendering/viewport/orientation-floor";
import { selectionEdges } from "@/rendering/viewport/selection-outline";
import { useSolidInference } from "./useSolidInference";
import { previewEdit, supportsWallWorkplaneEdit } from "@/application/direct-edit/controller";
import type { BimPlanProps } from "./BimPlan";

const viewportOf = (canvas: HTMLCanvasElement) => {
  const { left, top, width, height } = canvas.getBoundingClientRect();
  return { left, top, width, height };
};

export function BimSolidView({
  cornerPreview,
  project,
  visibility,
  selection: requestedSelection,
  selections,
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
  visibility?: LayerVisibilityPolicy;
  projectionFrame?: ProjectionFrame;
  snap?: boolean;
} & Pick<
  BimPlanProps,
  | "selections"
  | "gridSettings"
  | "editSession"
  | "numericTarget"
  | "snapping"
  | "ortho"
  | "onEditAim"
  | "onEditCommit"
  | "interactive"
  | "cornerPreview"
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
  const [aim, setAim] = useState<{
    session: typeof editSession;
    point: Point;
    candidate: SnapCandidate | null;
  } | null>(null);
  const baseSolid = useMemo(() => {
    const base = buildSolid(project);
    return cornerPreview?.base === project
      ? cornerPreviewSurfaces(project, base, cornerPreview)
      : base;
  }, [project, cornerPreview]);
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
  const targetCandidate =
    numericTarget === undefined && aim?.session === editSession ? aim?.candidate : undefined;
  const previewProject = useMemo(() => {
    if (editSession && target) {
      try {
        return previewEdit(editSession, project, selection, target, targetCandidate);
      } catch {
        /* Keep committed model on invalid input. */
      }
    }
    return project;
  }, [editSession, target, targetCandidate, project, selection]);
  const previewSolid = useMemo(
    () => (previewProject === project ? baseSolid : buildSolid(previewProject)),
    [previewProject, project, baseSolid],
  );
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
  const axis =
    previewProjection && !error
      ? selectedWallAxis(
          previewProject,
          selection,
          (id) => isLayerVisible(project, visibility, id),
          previewProjection,
        )
      : null;
  const selectedWalls = useMemo(
    () =>
      new Set(
        (selections ?? (selection ? [selection] : []))
          .filter((t) => t.kind === "wall" && isLayerVisible(project, visibility, t.id))
          .map((t) => t.id),
      ),
    [selections, selection, project, visibility],
  );
  const windowSurfaces = useMemo(
    () => windowSelectionSurfaces(previewProject, (id) => isLayerVisible(project, visibility, id)),
    [previewProject, project, visibility],
  );
  const pickDisplayed = useSolidPicking(
    solid,
    windowSurfaces,
    !editSession && previewProject === project && !cornerPreview,
  );
  const selectedWindows = useMemo(
    () =>
      new Set(
        (selections ?? (selection ? [selection] : []))
          .filter((t) => t.kind === "window")
          .map((t) => t.id),
      ),
    [selections, selection],
  );
  const outline = useMemo(
    () =>
      [...selectedWalls].flatMap((id) =>
        selectionEdges(solid.faces.filter((face) => face.wallId === id)),
      ),
    [solid, selectedWalls],
  );
  const windowOutline = useMemo(
    () => windowSelectionEdges(windowSurfaces, selectedWindows),
    [windowSurfaces, selectedWindows],
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
      setAim(null);
      drag.current = null;
      renderer.current?.dispose();
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
      setAim(null);
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
    setAim(null);
    setViewProjection(renderer.current ? projection : null);
  }, [frame, camera, revision]);
  useEffect(() => {
    displayed.current = null;
    if (renderer.current && previewProjection) {
      try {
        renderer.current.draw(solid, previewProjection, selectedWalls, outline, windowOutline);
        displayed.current = { solid, projection: previewProjection };
      } catch (e) {
        setError(e instanceof Error ? e.message : "3D unavailable");
        setViewProjection(null);
      }
    }
  }, [solid, previewProjection, selectedWalls, revision, outline, windowOutline]);
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
        className={`relative z-10 h-full w-full touch-none outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/40 ${moving && !pan ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setPreviewClient(null);
            setAim(null);
            setPreviewReset((n) => n + 1);
          }
          const delta = 0.12;
          if (
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-", "="].includes(event.key)
          ) {
            event.preventDefault();
            setPreviewClient(null);
            setAim(null);
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
          setAim(null);
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
                  setAim({
                    session: editSession,
                    point: result.point,
                    candidate: result.candidate,
                  });
                  onEditAim?.(editSession, result.point);
                }
              }
            } else {
              setPreviewClient(null);
              setAim(null);
            }
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
                if (result) onEditCommit?.(editSession, result.point, result.candidate);
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
                undefined,
                event.ctrlKey || event.metaKey,
              );
              if (canvas.hasPointerCapture(event.pointerId))
                canvas.releasePointerCapture(event.pointerId);
              return;
            }
            const point = projection.toNdc({ x: event.clientX, y: event.clientY });
            const hit = pickDisplayed(projection, point.x, point.y);
            onSelect(
              hit,
              { x: event.clientX, y: event.clientY },
              undefined,
              undefined,
              undefined,
              event.ctrlKey || event.metaKey,
            );
          }
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onLostPointerCapture={() => {
          setPreviewClient(null);
          setAim(null);
          drag.current = null;
        }}
        onPointerCancel={() => {
          setPreviewClient(null);
          setAim(null);
          drag.current = null;
        }}
        onPointerLeave={() => {
          setPreviewClient(null);
          setAim(null);
        }}
        onBlur={() => {
          setPreviewClient(null);
          setAim(null);
        }}
        onWheel={(event) => {
          setPreviewClient(null);
          setAim(null);
          onCamera({
            ...camera,
            zoom: Math.max(0.2, Math.min(5, camera.zoom * Math.exp(-event.deltaY * 0.001))),
          });
        }}
      />
      {axis && previewProjection && (
        <svg
          aria-label={`Wandachse 3D ${axis.wallId}`}
          role="img"
          className="pointer-events-none absolute inset-0 z-10"
          width={previewProjection.viewport.width}
          height={previewProjection.viewport.height}
        >
          <line
            x1={axis.start.x}
            y1={axis.start.y}
            x2={axis.end.x}
            y2={axis.end.y}
            stroke={WALL_AXIS_COLOR}
            style={CAD_SHIMMER}
            strokeWidth={2.5}
          />
        </svg>
      )}
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
