import { cameraFocus, orbitAround } from "@/rendering/viewport/camera-navigation";
import type { Vector3 } from "@/geometry/projections/orthographic";
import { createMovementOriginQuery } from "@/rendering/viewport/movement-origin";
import { workingStoreyElevation } from "@/domain/storeys/elevation";
import {
  selectionMoveSurfaces,
  selectionMoveWindows,
} from "@/rendering/viewport/selection-move-preview";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import { CAD_SHIMMER } from "@/rendering/viewport/highlight";
import { useSolidPicking } from "./useSolidPicking";
import {
  buildingWindowSelectionSurfaces,
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
import { buildBuildingSolid } from "@/lib/bim/geometry";
import type { Camera } from "@/lib/bim/geometry";
import type { Project, Point } from "@/lib/bim/model";
import type { Selection } from "./bim-view";
import { isSelectionClick } from "@/lib/bim/picking";
import { SolidSnapPreview } from "./SolidSnapPreview";
import { orientationFloor } from "@/rendering/viewport/orientation-floor";
import { selectionEdges } from "@/rendering/viewport/selection-outline";
import { useSolidInference } from "./useSolidInference";
import { previewEdit, supportsHorizontalWorkplaneEdit } from "@/application/direct-edit/controller";
import type { BimPlanProps } from "./BimPlan";

const viewportOf = (canvas: HTMLCanvasElement) => {
  const { left, top, width, height } = canvas.getBoundingClientRect();
  return { left, top, width, height };
};

export function BimSolidView({
  cornerPreview,
  placement,
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
  | "placement"
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
    button: number;
    navigationMode: "pan" | "orbit";
    pivot: Vector3;
    placementPreview: BimPlanProps["placement"];
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
    const base = buildBuildingSolid(project);
    return cornerPreview?.base === project
      ? cornerPreviewSurfaces(project, base, cornerPreview)
      : base;
  }, [project, cornerPreview]);
  const frame = useMemo(
    () => projectionFrame ?? createProjectionFrame(baseSolid),
    [baseSolid, projectionFrame],
  );
  const moving =
    !!editSession &&
    supportsHorizontalWorkplaneEdit(editSession.target, editSession.action, editSession.index) &&
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
  const [originHeight, setOriginHeight] = useState<number | undefined>();
  useEffect(() => {
    if (!placement) setOriginHeight(undefined);
  }, [placement]);
  const [placementAim, setPlacementAim] = useState<Point | null>(null);
  useEffect(() => setPlacementAim(null), [placement?.geometryPreview]);
  const placementTarget = placement?.target === undefined ? placementAim : placement.target;
  const placementPatch = useMemo(() => {
    if (!placement?.geometryPreview || !placementTarget) return null;
    try {
      return placement.geometryPreview.evaluate(placementTarget);
    } catch {
      return null;
    }
  }, [placement?.geometryPreview, placementTarget]);
  const previewSolid = useMemo(() => {
    if (placementPatch) return selectionMoveSurfaces(baseSolid, project, placementPatch);
    return previewProject === project ? baseSolid : buildBuildingSolid(previewProject);
  }, [previewProject, project, baseSolid, placementPatch]);
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
  const windowSurfaces = useMemo(() => {
    const allows = (id: string) => isLayerVisible(project, visibility, id);
    const base = buildingWindowSelectionSurfaces(previewProject, allows);
    return placementPatch ? selectionMoveWindows(base, project, placementPatch, allows) : base;
  }, [previewProject, project, visibility, placementPatch]);
  const pickDisplayed = useSolidPicking(
    solid,
    windowSurfaces,
    !editSession && !placement && previewProject === project && !cornerPreview,
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
  const windowWorkplane = useMemo(() => {
    if (editSession?.target.kind !== "window") return undefined;
    const opening = project.storeys
      .flatMap((s) => s.windows)
      .find((w) => w.id === editSession.target.id);
    return opening
      ? workingStoreyElevation(project) + opening.sillHeight + opening.height / 2
      : undefined;
  }, [project, editSession]);
  const inference = useSolidInference(
    project,
    previewProjection,
    previewClient,
    snap && !error && interactive,
    previewReset,
    placement?.geometryPreview ? snapping : moving ? snapping : null,
    moving && editSession.target.kind === "wall" ? editSession.target.id : undefined,
    ortho,
    previewClient?.shift ?? false,
    visibility,
    moving || placement?.geometryPreview ? gridSpacing(gridSettings) : null,
    placement?.geometryPreview ? originHeight : windowWorkplane,
  );
  const pickingMovementOrigin = !!placement && !placement.geometryPreview;
  const originQuery = useMemo(
    () =>
      previewProjection && pickingMovementOrigin
        ? createMovementOriginQuery(project, previewProjection, (id) =>
            isLayerVisible(project, visibility, id),
          )
        : null,
    [project, previewProjection, visibility, pickingMovementOrigin],
  );
  const originCandidate = snap && previewClient && originQuery ? originQuery(previewClient) : null;
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
      {originCandidate && previewProjection && (
        <svg
          aria-label="Bewegungsursprung Fangvorschau"
          className="pointer-events-none absolute inset-0 z-20"
          width={previewProjection.viewport.width}
          height={previewProjection.viewport.height}
        >
          <circle
            cx={originCandidate.screen.x - previewProjection.viewport.left}
            cy={originCandidate.screen.y - previewProjection.viewport.top}
            r={10.5}
            fill="none"
            stroke="#aeb5bd"
            strokeWidth={2.5}
          />
        </svg>
      )}
      <canvas
        ref={canvasRef}
        aria-label="3D walls with window openings"
        role="img"
        tabIndex={0}
        title={
          moving
            ? editSession.action === "move"
              ? "Wand auf der Geschossebene bewegen. Klick platziert; Tab für Länge und Winkel. Pan schaltet auf Navigation; Esc bricht ab."
              : "Auf der Geschossebene bearbeiten. Klick übernimmt Ziel; Tab für Maße. Pan schaltet auf Navigation; Esc bricht ab."
            : "Bewegungsursprung frei wählen; sichtbare Wandecken rasten ein. Mausrad gedrückt: verschieben. Strg/Cmd + Mausrad gedrückt: Orbit. Scrollen zoomt."
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
        onAuxClick={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          setPreviewClient(null);
          setAim(null);
          if (![0, 1].includes(event.button) || drag.current || !interactive) return;
          event.preventDefault();
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          const selectedIds = new Set(
            (selections ?? (selection ? [selection] : [])).map((t) => t.id),
          );
          const min = [Infinity, Infinity, Infinity],
            max = [-Infinity, -Infinity, -Infinity];
          const include = (vertices: readonly Vector3[]) => {
            for (const v of vertices)
              for (const i of [0, 1, 2] as const) {
                min[i] = Math.min(min[i]!, v[i]);
                max[i] = Math.max(max[i]!, v[i]);
              }
          };
          for (const face of solid.faces) if (selectedIds.has(face.wallId)) include(face.vertices);
          for (const face of windowSurfaces) if (selectedIds.has(face.id)) include(face.vertices);
          const pivot: Vector3 = Number.isFinite(min[0])
            ? [(min[0]! + max[0]!) / 2, (min[1]! + max[1]!) / 2, (min[2]! + max[2]!) / 2]
            : cameraFocus(frame, camera, displayed.current?.projection.aspect ?? 1);
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            camera,
            pointerId: event.pointerId,
            moved: false,
            editing: editSession,
            placementPreview: placement,
            navigation: event.button === 1 || (!moving && !placement) || pan,
            button: event.button,
            navigationMode:
              event.button === 1
                ? event.ctrlKey || event.metaKey
                  ? "orbit"
                  : "pan"
                : pan
                  ? "pan"
                  : "orbit",
            pivot,
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
              if (placement && !pan) {
                const result = inference.resolve(
                  { x: event.clientX, y: event.clientY },
                  event.shiftKey,
                );
                if (result) {
                  setPlacementAim(result.point);
                  placement.aim(result.point);
                }
              }
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
            drag.current.navigationMode === "pan"
              ? {
                  ...base,
                  panX: base.panX + (dx / event.currentTarget.clientWidth) * 2,
                  panY: base.panY - (dy / event.currentTarget.clientHeight) * 2,
                }
              : orbitAround(
                  frame,
                  base,
                  displayed.current?.projection.aspect ?? 1,
                  drag.current.pivot,
                  dx,
                  dy,
                ),
          );
        }}
        onPointerUp={(event) => {
          const gesture = drag.current;
          if (!gesture || gesture.pointerId !== event.pointerId) return;
          drag.current = null;
          if (
            gesture.editing !== editSession ||
            !interactive ||
            gesture.placementPreview?.geometryPreview !== placement?.geometryPreview ||
            Boolean(gesture.placementPreview) !== Boolean(placement)
          )
            return;
          if (
            gesture.button === 0 &&
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
            if (placement) {
              if (!gesture.navigation) {
                if (placement.geometryPreview) {
                  const result = inference.resolve(
                    { x: event.clientX, y: event.clientY },
                    event.shiftKey,
                  );
                  const point = placement.target === undefined ? result?.point : placement.target;
                  if (point) placement.pick(point, result?.candidate);
                } else {
                  const client = { x: event.clientX, y: event.clientY };
                  const anchor = snap ? originQuery?.(client) : null;
                  const height = anchor?.point[2] ?? workingStoreyElevation(project);
                  const plane = projection.workplane(height);
                  const inverse = plane.status === "ok" ? plane.value.toPlane(client) : null;
                  const point = anchor
                    ? { x: anchor.point[0], y: anchor.point[1] }
                    : inverse?.status === "ok"
                      ? inverse.value.point
                      : null;
                  if (point) {
                    setOriginHeight(height);
                    placement.pick(point);
                  }
                }
              }
              if (canvas.hasPointerCapture(event.pointerId))
                canvas.releasePointerCapture(event.pointerId);
              return;
            }
            if (editSession) {
              // Navigation is never also a target click. Invalid inverse never confirms.
              if (moving && !gesture.navigation) {
                const result = inference.resolve(
                  { x: event.clientX, y: event.clientY },
                  event.shiftKey,
                );
                const point = numericTarget === undefined ? result?.point : numericTarget;
                if (point)
                  onEditCommit?.(
                    editSession,
                    point,
                    numericTarget === undefined ? result?.candidate : undefined,
                  );
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
