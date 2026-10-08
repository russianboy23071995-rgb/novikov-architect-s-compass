import { CAD_SHIMMER } from "@/rendering/viewport/highlight";
import { AreaMeasurementOverlay } from "./AreaMeasurementOverlay";
import type { AreaMeasurement } from "@/application/measurement/area";
import { DistanceOverlay } from "./DistanceOverlay";
import type { DistanceMeasurement } from "@/application/measurement/distance";
import { PlanSceneRun } from "./PlanSceneRun";
import { derivePlanScene, planSceneRuns, type PlanRun } from "@/rendering/viewport/plan-scene";
import type { GeometryPreview } from "@/domain/project/geometry-scope";
import { useSelectionMarquee } from "./useSelectionMarquee";
import { planSelectionShapes } from "@/rendering/viewport/selection-shapes";
import type { SelectionSet } from "@/application/selection/state";
import type { ToolInteraction } from "@/application/tools/interaction";
import { drawingWallVisibility } from "@/rendering/viewport/layer-display";
import type { SnapCandidate } from "@/constraints/snapping/engine";
import { useShiftSnapLock } from "./useShiftSnapLock";
import { WALL_AXIS_COLOR, wallAxisAnchor, wallPlanHandles } from "@/rendering/viewport/wall-axis";
import type { CornerPreview } from "@/application/walls/corner-preview";
import { anchorDragTarget, type AnchorDrag } from "@/rendering/viewport/anchor-drag";
import {
  defaultGridSettings,
  gridSpacing,
  type GridSettings,
} from "@/application/snapping/grid-settings";
import { validateSimplePolygon } from "@/geometry/polygons/simple-polygon";
import { closedContour } from "@/application/direct-edit/contour";
import { pointsCompatible } from "@/geometry/tolerances/model";
import type { Hatch } from "@/domain/elements/hatch/model";
import { isLayerVisible } from "@/application/layers/visibility";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import type { ReferenceSelectionBinding } from "./useReferenceSelection";
import { ReferenceSelectionPanel } from "./ReferenceSelectionPanel";
import { referenceKey } from "@/constraints/inference/construction-reference";
import {
  pickContourEdge,
  pickReferencePoints,
  pickReferenceSegments,
} from "@/rendering/viewport/reference-picking";
import { segmentKey } from "@/application/snapping/reference-selection";
import { useSnapDensity } from "./useSnapDensity";
import { cursorGuide } from "@/constraints/guides/directions";
import { DEFAULT_HOVER_DWELL_MS } from "@/constraints/inference/hover-reference";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  createToolSourceQuery,
  createVisibleToolSourceQuery,
  toolPinnedReferences,
} from "@/application/tools/snapping";
import type { ToolSnapPolicy } from "@/application/tools/snapping";
import { useHoverReference } from "./useHoverReference";
import { getLocalSnapSources } from "@/application/snapping/local-sources";
import { panPlan, planScaleBar, planViewBox, zoomPlan } from "@/rendering/viewport/plan-camera";
import type { PlanCamera, ViewSize } from "@/rendering/viewport/plan-camera";
import { previewEdit } from "@/application/direct-edit/controller";
import type { EditSession } from "@/lib/bim/direct-edit";
import type { Point, Project } from "@/lib/bim/model";
import type { Selection } from "./bim-view";
import { linePath } from "@/lib/bim/lines";

export type BimPlanProps = {
  draftContour?: ((point: Point) => Point[]) | undefined;
  placement?:
    | {
        measurement?: DistanceMeasurement | undefined;
        areaMeasurement?: AreaMeasurement | undefined;
        finish?: (() => void) | undefined;
        target: Point | null | undefined;
        previewProject?: ToolInteraction["previewProject"];
        geometryPreview?: ToolInteraction["geometryPreview"];
        aim: (point: Point) => void;
        pick: (point: Point, candidate?: SnapCandidate | null) => void;
      }
    | undefined;
  drawingPreview?: Project | undefined;
  drawingProjectAt?: ToolInteraction["previewProject"];
  cornerPreview?: CornerPreview;
  referenceSelection?: ReferenceSelectionBinding | undefined;
  referenceScope?: object | undefined;
  interactive?: boolean;
  project: Project;
  visibility?: LayerVisibilityPolicy;
  snapping?: ToolSnapPolicy | null;
  selection: Selection;
  selections?: SelectionSet;
  onSelectMany?: (targets: SelectionSet) => void;
  drawing: boolean;
  endpointSnap?: boolean;
  hoverDwellMs?: number;
  start: Point | null;
  draftPoints?: Point[];
  draftFill?: Hatch["fill"] | undefined;
  gridSettings?: GridSettings;
  wallOutlineWidth?: number;
  snap: boolean;
  ortho: boolean;
  onSelect: (
    selection: Selection,
    anchor?: Point,
    index?: number,
    modelPoint?: Point,
    edgeIndex?: number,
    toggle?: boolean,
  ) => void;
  editSession?: EditSession | null;
  numericTarget?: Point | null | undefined;
  drawingTarget?: Point | null | undefined;
  onDrawingAim?: ((point: Point) => void) | undefined;
  onEditAim?: (session: EditSession, point: Point) => void;
  onEditDirection?: (session: EditSession, point: Point, candidate?: SnapCandidate | null) => void;
  onEditCommit?: (session: EditSession, point: Point, candidate?: SnapCandidate | null) => void;
  onContourStretch?: (selection: NonNullable<Selection>, index: number, anchor: Point) => void;
  onEditCancel?: () => void;
  onPoint: (point: Point, candidate?: SnapCandidate | null) => void;
  onFinish?: () => void;
};

export function BimPlan({
  draftContour,
  placement,
  drawingPreview,
  drawingProjectAt,
  cornerPreview,
  referenceSelection,
  referenceScope,
  interactive = true,
  project,
  visibility,
  snapping: requestedSnapping = null,
  selection: requestedSelection,
  selections,
  onSelectMany,
  drawing,
  endpointSnap = false,
  hoverDwellMs = DEFAULT_HOVER_DWELL_MS,
  start,
  draftPoints = [],
  draftFill,
  snap,
  gridSettings = defaultGridSettings,
  wallOutlineWidth = 1,
  ortho,
  onSelect,
  onPoint,
  onFinish,
  editSession: requestedEditSession,
  onEditCommit,
  onContourStretch,
  onEditCancel,
  numericTarget,
  drawingTarget,
  onDrawingAim,
  onEditAim,
  onEditDirection,
  camera,
  viewSize,
  onCamera,
  pan,
  grid,
}: BimPlanProps & {
  camera: PlanCamera;
  viewSize: ViewSize;
  onCamera: (camera: PlanCamera) => void;
  pan: boolean;
  grid: boolean;
}) {
  const editSession =
    requestedEditSession && isLayerVisible(project, visibility, requestedEditSession.target.id)
      ? requestedEditSession
      : null;
  const snapping = requestedEditSession && !editSession ? null : requestedSnapping;
  const selection =
    requestedSelection && isLayerVisible(project, visibility, requestedSelection.id)
      ? requestedSelection
      : null;
  const visibilitySession = useMemo(
    () => ({ referenceScope, visibility, project, snapping }),
    [referenceScope, visibility, project, snapping],
  );
  const selecting = referenceSelection?.selecting ?? false;
  const selectedSegments = referenceSelection?.selected ?? null;
  const svg = useRef<SVGSVGElement>(null);
  const gripDrag = useRef<{
    gesture: AnchorDrag;
    base: Project;
    target: NonNullable<Selection>;
    index: number;
  } | null>(null);
  const gripClick = useRef(false);
  const matchingGrip = useCallback(() => {
    const drag = gripDrag.current;
    return (
      drag &&
      editSession &&
      editSession.base === drag.base &&
      editSession.target.id === drag.target.id &&
      editSession.target.kind === drag.target.kind &&
      editSession.action === "edge" &&
      editSession.index === drag.index &&
      editSession.anchor.x === drag.gesture.origin.x &&
      editSession.anchor.y === drag.gesture.origin.y
    );
  }, [editSession]);
  useEffect(() => {
    // Escape, model/visibility/selection changes invalidate a captured gesture.
    if (gripDrag.current && !matchingGrip()) {
      const id = gripDrag.current.gesture.pointerId;
      gripDrag.current = null;
      if (svg.current?.hasPointerCapture(id)) svg.current.releasePointerCapture(id);
    }
  }, [editSession, project, selection, matchingGrip]);
  const gridId = useId();
  const gridStep = planScaleBar(camera.pixelsPerMetre).metres;
  const navigation = useRef<{ pointerId: number; x: number; y: number; camera: PlanCamera } | null>(
    null,
  );
  const navigationClick = useRef(false);
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      if (navigation.current) return;
      const bounds = element.getBoundingClientRect();
      const delta =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewSize.height : 1);
      onCamera(
        zoomPlan(camera, viewSize, Math.exp(-Math.max(-300, Math.min(300, delta)) * 0.002), {
          x: event.clientX - bounds.x,
          y: event.clientY - bounds.y,
        }),
      );
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [camera, viewSize, onCamera]);
  const editDown = useRef<EditSession | null>(null);
  const [hover, setHover] = useState<Point | null>(null);
  const [referenceReset, setReferenceReset] = useState(0);
  const [shiftHeld, setShiftHeld] = useState(false);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (selecting || !interactive) return;
      if (
        event.target instanceof Element &&
        event.target.closest('[role="dialog"],[role="alertdialog"]')
      )
        return;
      if (event.key === "Shift" && !event.repeat) setShiftHeld(event.type === "keydown");
      if (event.key === "Escape" && event.type === "keydown") {
        setHover(null);
        setReferenceReset((value) => value + 1);
      }
    };
    const clear = () => setShiftHeld(false);
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", key);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", key);
      window.removeEventListener("blur", clear);
    };
  }, [selecting, interactive]);
  useEffect(() => setHover(null), [endpointSnap, camera, editSession]);
  const pinnedReferences = useMemo(() => toolPinnedReferences(snapping), [snapping]);
  const modelSources = useMemo(() => getLocalSnapSources(project), [project]);
  const sourceQuery = useMemo(
    () =>
      visibility
        ? createVisibleToolSourceQuery(project, visibility, visibility.context, snapping)
        : createToolSourceQuery(modelSources, snapping),
    [modelSources, snapping, project, visibility],
  );
  const density = useSnapDensity(
    sourceQuery,
    pan ? null : hover,
    camera.pixelsPerMetre,
    endpointSnap && snap && interactive,
    referenceReset,
    camera,
    selectedSegments,
  );
  const references = pinnedReferences;
  const trackingContext = useMemo(
    () => ({
      enabled: endpointSnap && snap && interactive,
      sessionKey: visibilitySession,
      acceptReference: sourceQuery.accepts,
      references,
      sourceQuery,
      intersectionsPaused: density.paused,
      selectedSegments,
      suspended: selecting || pan,
      pixelsPerMetre: camera.pixelsPerMetre,
      camera,
      viewSize,
      resetKey: referenceReset,
      pinnedReferences,
    }),
    [
      endpointSnap,
      snap,
      interactive,
      visibilitySession,
      pan,
      references,
      sourceQuery,
      density.paused,
      selectedSegments,
      selecting,
      camera,
      viewSize,
      referenceReset,
      pinnedReferences,
    ],
  );
  const {
    references: activeReferences,
    guideDirections,
    guideCursor,
    previewPoints,
    acquirePoints,
  } = useHoverReference(hover, trackingContext, hoverDwellMs);
  const activeReference = activeReferences.at(-1) ?? null;
  const resolveLockedSnap = useShiftSnapLock(visibilitySession, referenceReset);
  const resolvePointer = (point: Point, shift = shiftHeld) =>
    resolveLockedSnap(
      snapping,
      point,
      {
        references,
        sourceQuery,
        intersectionsPaused: density.paused,
        selectedSegments,
        pixelsPerMetre: camera.pixelsPerMetre,
        enabled: snap,
        endpointRadiusPx: 10,
        includeInteractionTargets: true,
        gridSpacing: gridSpacing(gridSettings),
        activeReference,
        activeReferences,
        guideDirections,
      },
      { ortho, shift, featureSnap: endpointSnap },
    );
  const pointerSnap = hover ? resolvePointer(hover) : null;
  const resolvedHover =
    placement?.target !== undefined
      ? placement.target
        ? { point: placement.target, candidate: null }
        : null
      : drawingTarget !== undefined
        ? drawingTarget
          ? {
              point: drawingTarget,
              candidate: null,
            }
          : null
        : numericTarget !== undefined
          ? null
          : pointerSnap;
  let constructedContour: Point[] = [];
  if (draftContour && resolvedHover) {
    try {
      constructedContour = draftContour(resolvedHover.point);
    } catch {
      /* incomplete shape */
    }
  }
  const snapLabels = {
    midpoint: "Mittelpunkt",
    "segment-intersection": "Segmentschnittpunkt",
    parallel: "Parallel",
    endpoint: resolvedHover?.candidate?.sourceReferences?.[0]?.dependencies
      ? "Hilfspunkt"
      : "Endpunkt",
    grid: "Raster",
    horizontal: "Horizontal",
    vertical: "Vertikal",
    extension: "Verlängerung",
    perpendicular: "Lotrecht",
    angle: `${resolvedHover?.candidate?.angleDegrees ?? 45}°`,
    intersection: "Schnittpunkt",
    "axis-intersection": "Achsenschnittpunkt",
  };
  const [editPointer, setEditPointer] = useState<{ session: EditSession; point: Point } | null>(
    null,
  );
  const rawPoint = (event: { clientX: number; clientY: number }) => {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: point.x, y: -point.y };
  };
  const draggedPoint = (event: { pointerId: number; clientX: number; clientY: number }) => {
    const point = rawPoint(event),
      drag = gripDrag.current;
    return point && drag && matchingGrip()
      ? anchorDragTarget(drag.gesture, event.pointerId, point, {
          x: event.clientX,
          y: event.clientY,
        })
      : null;
  };
  const selectedRing =
    selection && !drawing && !editSession ? closedContour(project, selection) : null;
  // Winding is shared by all grips; never revalidate the whole ring per side.
  const selectedShape = useMemo(
    () => (selectedRing ? validateSimplePolygon(selectedRing) : null),
    [selectedRing],
  );
  const resolvedEdit =
    numericTarget !== undefined
      ? numericTarget
        ? { point: numericTarget, candidate: null }
        : null
      : editSession && editPointer?.session === editSession
        ? resolvePointer(editPointer.point)
        : null;
  let preview: Project | null = null;
  let editError = "";
  if (editSession && resolvedEdit) {
    try {
      preview = previewEdit(
        editSession,
        project,
        selection,
        resolvedEdit.point,
        resolvedEdit.candidate,
      );
    } catch {
      editError = "Ungültiges Ziel: Geometrie und Fenstergrenzen prüfen.";
    }
  }
  const drawingPoint = resolvedHover?.point;
  const drawingCandidate = resolvedHover?.candidate;
  const drawingResult = useMemo(() => {
    if (
      !drawing ||
      !drawingProjectAt ||
      !drawingPoint ||
      !start ||
      pointsCompatible(start, drawingPoint)
    )
      return { project: null, error: "" };
    try {
      return { project: drawingProjectAt(drawingPoint, drawingCandidate), error: "" };
    } catch (error) {
      return {
        project: null,
        error: error instanceof Error ? error.message : "Ungueltiges Wandziel.",
      };
    }
  }, [drawing, drawingProjectAt, drawingPoint, drawingCandidate, start]);
  let placementProject: Project | null = null;
  if (placement?.previewProject) {
    const point = placement.target === undefined ? pointerSnap?.point : placement.target;
    if (point) {
      try {
        placementProject = placement.previewProject(point, pointerSnap?.candidate);
      } catch (error) {
        editError = error instanceof Error ? error.message : "Ungültiges Ziel.";
      }
    }
  }
  let geometryPreview: GeometryPreview | null = null;
  if (placement?.geometryPreview) {
    const point = placement.target === undefined ? pointerSnap?.point : placement.target;
    if (point)
      try {
        geometryPreview = placement.geometryPreview.evaluate(point);
      } catch (error) {
        editError = error instanceof Error ? error.message : "Ungültiges Ziel.";
      }
  }
  const shown =
    placementProject ??
    preview ??
    drawingResult.project ??
    (drawing ? drawingPreview : null) ??
    project;
  const allowsShown = useMemo(
    () => drawingWallVisibility(project, shown, visibility),
    [project, shown, visibility],
  );
  const scene = useMemo(() => derivePlanScene(shown, allowsShown), [shown, allowsShown]);
  const previewScene = useMemo(
    () => (geometryPreview ? derivePlanScene(geometryPreview.geometry, allowsShown) : null),
    [geometryPreview, allowsShown],
  );
  const sceneRuns = useMemo(
    () => planSceneRuns(scene, placement?.geometryPreview?.replacedIds ?? []),
    [scene, placement?.geometryPreview?.replacedIds],
  );
  const plan = previewScene?.plan ?? scene.plan;
  const canPick = useCallback(
    (id: string) => isLayerVisible(project, visibility, id),
    [project, visibility],
  );
  const handles: { point: Point; index: number; label: string; axis?: boolean }[] = [];
  if (selection?.kind === "wall") {
    const wall = project.storey.walls.find((item) => item.id === selection.id);
    if (wall)
      handles.push(
        ...wallPlanHandles(
          wall,
          project.storey.wallJoins.some(
            (j) => j.first.wallId === wall.id || j.second.wallId === wall.id,
          ),
        ),
      );
  } else if (selection?.kind === "hatch") {
    project.storey.hatches
      .find((h) => h.id === selection.id)
      ?.points.forEach((point, index) =>
        handles.push({ point, index, label: `Schraffurecke ${index + 1}` }),
      );
  } else if (selection?.kind === "line") {
    const line = project.storey.lines?.find((item) => item.id === selection.id);
    line?.points.forEach((point, index) => {
      if (
        index === line.points.length - 1 &&
        index > 1 &&
        point.x === line.points[0]!.x &&
        point.y === line.points[0]!.y
      )
        return;
      handles.push({ point, index, label: `Linienpunkt ${index + 1}` });
    });
  }
  const pointFromEvent = (event: React.MouseEvent<SVGSVGElement>) => {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return resolvePointer({ x: point.x, y: -point.y }, event.shiftKey);
  };
  const selectProps = (kind: "wall" | "window" | "line" | "hatch" | "reference", id: string) => ({
    role: "button",
    tabIndex: drawing ? -1 : 0,
    "aria-label": `Select ${kind} ${id}`,
    "aria-pressed": selectedIds.has(id),
    onClick: (event: React.MouseEvent) => {
      if (!drawing && !editSession) {
        event.stopPropagation();
        const point = rawPoint(event);
        const ring = closedContour(project, { kind, id });
        const edge = point && ring ? pickContourEdge(ring, point, camera.pixelsPerMetre) : null;
        onSelect(
          { kind, id },
          { x: event.clientX, y: event.clientY },
          undefined,
          edge?.point ?? point ?? undefined,
          edge?.index,
          event.ctrlKey || event.metaKey,
        );
      }
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (!drawing && !editSession && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        onSelect(
          { kind, id },
          undefined,
          undefined,
          undefined,
          undefined,
          event.ctrlKey || event.metaKey,
        );
      }
    },
  });
  const listPosition = referenceSelection?.hits.length ? referenceSelection.position : null;
  const selectedIds = useMemo(
    () => new Set((selections ?? (selection ? [selection] : [])).map((t) => t.id)),
    [selections, selection],
  );
  const latestSelect = useRef(selectProps);
  latestSelect.current = selectProps;
  const sceneHandlers = useMemo(
    () => ({
      click: (kind: NonNullable<Selection>["kind"], id: string, event: React.MouseEvent) =>
        latestSelect.current(kind, id).onClick(event),
      key: (kind: NonNullable<Selection>["kind"], id: string, event: React.KeyboardEvent) =>
        latestSelect.current(kind, id).onKeyDown(event),
    }),
    [],
  );
  const renderRun = (run: PlanRun) => (
    <PlanSceneRun
      key={`${run.kind}:${run.ids[0]}`}
      {...run}
      scene={run.affected && previewScene ? previewScene : scene}
      selectedIds={selectedIds}
      drawing={drawing}
      placement={!!placement}
      pixelsPerMetre={camera.pixelsPerMetre}
      wallOutlineWidth={wallOutlineWidth}
      cornerGeometry={cornerPreview?.base === shown ? cornerPreview.geometry : undefined}
      allowsShown={allowsShown}
      canPick={canPick}
      handlers={sceneHandlers}
    />
  );
  const shapes = useMemo(
    () =>
      planSelectionShapes(project).filter((s) => isLayerVisible(project, visibility, s.target.id)),
    [project, visibility],
  );
  const marquee = useSelectionMarquee(
    interactive && !placement && !drawing && !editSession && !selecting && !pan,
    visibility ?? project,
    shapes,
    onSelectMany,
  );
  const panelX = listPosition
    ? Math.max(
        12,
        Math.min(
          viewSize.width - 452,
          (listPosition.x - camera.center.x) * camera.pixelsPerMetre + viewSize.width / 2 + 12,
        ),
      )
    : 12;
  const panelY = listPosition
    ? Math.max(
        12,
        Math.min(
          viewSize.height - 272,
          (-listPosition.y + camera.center.y) * camera.pixelsPerMetre + viewSize.height / 2 + 12,
        ),
      )
    : 12;
  return (
    <svg
      ref={svg}
      aria-label="BIM floor plan"
      tabIndex={0}
      viewBox={planViewBox(camera, viewSize)}
      preserveAspectRatio="none"
      onPointerDownCapture={marquee.down}
      onPointerMoveCapture={marquee.move}
      onPointerUpCapture={marquee.up}
      onPointerDown={(event) => {
        navigationClick.current = event.button === 1 || (pan && event.button === 0);
        if (navigationClick.current) {
          event.preventDefault();
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          navigation.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            camera,
          };
          editDown.current = null;
          return;
        }
        editDown.current = editSession ?? null;
      }}
      onPointerUp={(event) => {
        const drag = gripDrag.current;
        if (drag?.gesture.pointerId === event.pointerId) {
          const result = draggedPoint(event);
          gripDrag.current = null;
          gripClick.current = true;
          editDown.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
          if (result?.moved && editSession) {
            try {
              const snapped = resolvePointer(result.point, event.shiftKey);
              onEditCommit?.(editSession, snapped.point, snapped.candidate);
            } catch {
              /* Keep the shared edit session available for correction. */
            }
          }
          return;
        }
        if (navigation.current?.pointerId === event.pointerId) {
          navigation.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onLostPointerCapture={() => {
        marquee.cancel();
        navigation.current = null;
        if (gripDrag.current) {
          gripDrag.current = null;
          onEditCancel?.();
        }
      }}
      onPointerCancel={() => {
        marquee.cancel();
        navigation.current = null;
        editDown.current = null;
        if (gripDrag.current) {
          gripDrag.current = null;
          onEditCancel?.();
        }
      }}
      onClickCapture={(event) => {
        marquee.click(event);
        if (event.defaultPrevented) return;
        if (gripClick.current) {
          gripClick.current = false;
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if ((event.target as Element).closest("[data-reference-panel]")) return;
        if (selecting && referenceSelection && !navigationClick.current && !pan) {
          event.preventDefault();
          event.stopPropagation();
          const point = rawPoint(event);
          if (!point) return;
          const local = sourceQuery.inspect(point, camera.pixelsPerMetre, 10);
          const hits =
            referenceSelection.mode === "points"
              ? pickReferencePoints(local.references, point, camera.pixelsPerMetre)
              : pickReferenceSegments(local.segments, point, camera.pixelsPerMetre);
          if (hits.length === 1) referenceSelection.toggle(hits[0]!);
          else referenceSelection.hitsAt(hits, point);
          return;
        }
        if (placement && interactive && !navigationClick.current && !pan) {
          event.preventDefault();
          event.stopPropagation();
          if (placement.finish && event.detail > 1) return;
          const resolved = pointFromEvent(event);
          const point = placement.target === undefined ? resolved?.point : placement.target;
          if (point)
            placement.pick(point, placement.target === undefined ? resolved?.candidate : null);
          return;
        }
        if (navigationClick.current || pan) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onAuxClick={(event) => event.preventDefault()}
      className={`h-full w-full touch-none outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/40 ${pan ? "cursor-grab" : drawing ? "cursor-crosshair" : ""}`}
      onPointerMove={(event) => {
        if (!interactive) return;
        setShiftHeld(event.shiftKey);
        const active = navigation.current;
        if (active && active.pointerId === event.pointerId) {
          onCamera(
            panPlan(active.camera, { x: event.clientX - active.x, y: event.clientY - active.y }),
          );
          return;
        }
        if (pan || selecting) return;
        if (gripDrag.current && gripDrag.current.gesture.pointerId !== event.pointerId) return;
        const drawingPoint = draggedPoint(event)?.point ?? rawPoint(event);
        if (endpointSnap || editSession) setHover(drawingPoint);
        if (placement && drawingPoint)
          placement.aim(resolvePointer(drawingPoint, event.shiftKey).point);
        if (drawing && drawingPoint)
          onDrawingAim?.(resolvePointer(drawingPoint, event.shiftKey).point);
        if (editSession) {
          const point = drawingPoint;
          if (point) {
            setEditPointer({ session: editSession, point });
            onEditAim?.(editSession, resolvePointer(point, event.shiftKey).point);
          }
        }
      }}
      onPointerLeave={() => {
        if (selecting) return;
        setHover(null);
        setEditPointer(null);
      }}
      onClick={(event) => {
        if (editSession) {
          if (numericTarget !== undefined) return;
          if (editDown.current !== editSession) return;
          editDown.current = null;
          const point = rawPoint(event);
          if (point) {
            setEditPointer({ session: editSession, point });
            try {
              const snapped = resolvePointer(point, event.shiftKey);
              const target = snapped.point;
              if (onEditDirection) onEditDirection(editSession, target, snapped.candidate);
              else onEditCommit?.(editSession, target, snapped.candidate);
            } catch {
              /* Invalid preview stays editable. */
            }
          }
          return;
        }
        if (drawing) {
          event.currentTarget.focus();
          if (onFinish && event.detail > 1) return;
          const snap = pointFromEvent(event);
          const point = drawingTarget !== undefined ? drawingTarget : snap?.point;
          if (point) onPoint(point, drawingTarget !== undefined ? null : snap?.candidate);
        } else if (event.target === event.currentTarget) onSelect(null);
      }}
      onDoubleClick={(event) => {
        if (selecting || pan || navigationClick.current) return;
        if (placement?.finish && interactive) {
          event.preventDefault();
          placement.finish();
          return;
        }
        if (drawing && onFinish) {
          event.preventDefault();
          onFinish();
        }
      }}
      onKeyDown={(event) => {
        if (selecting) return;
        if (event.key === "Escape") {
          marquee.cancel();
          navigation.current = null;
          setHover(null);
        }
        if (pan) return;
        if (drawing && onFinish && event.key === "Enter") {
          event.preventDefault();
          onFinish();
        }
      }}
    >
      {grid && (
        <g pointerEvents="none">
          <defs>
            <pattern id={gridId} width={gridStep} height={gridStep} patternUnits="userSpaceOnUse">
              <path
                d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`}
                fill="none"
                stroke="var(--muted-foreground)"
                strokeOpacity={0.15}
                strokeWidth={1 / camera.pixelsPerMetre}
              />
            </pattern>
          </defs>
          <rect
            x={camera.center.x - viewSize.width / camera.pixelsPerMetre / 2}
            y={-camera.center.y - viewSize.height / camera.pixelsPerMetre / 2}
            width={viewSize.width / camera.pixelsPerMetre}
            height={viewSize.height / camera.pixelsPerMetre}
            fill={`url(#${gridId})`}
          />
        </g>
      )}
      {marquee.box && (
        <rect
          aria-label="Auswahlrahmen"
          pointerEvents="none"
          x={Math.min(marquee.box.a.x, marquee.box.b.x)}
          y={-Math.max(marquee.box.a.y, marquee.box.b.y)}
          width={Math.abs(marquee.box.a.x - marquee.box.b.x)}
          height={Math.abs(marquee.box.a.y - marquee.box.b.y)}
          fill="#38bdf8"
          fillOpacity={0.08}
          stroke="#38bdf8"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {sceneRuns.filter((run) => run.kind !== "line").map(renderRun)}
      {selection?.kind === "wall" &&
        plan.walls
          .filter((wall) => wall.id === selection.id)
          .map((wall) => (
            <g key={`axis-${wall.id}`}>
              <line
                role="img"
                aria-label={`Wandachse ${wall.id}`}
                x1={wall.start.x}
                y1={-wall.start.y}
                x2={wall.end.x}
                y2={-wall.end.y}
                stroke={WALL_AXIS_COLOR}
                style={CAD_SHIMMER}
                strokeWidth={2.5}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
              <line
                {...selectProps("wall", wall.id)}
                aria-label="Wandachse auswählen"
                x1={wall.start.x}
                y1={-wall.start.y}
                x2={wall.end.x}
                y2={-wall.end.y}
                stroke="transparent"
                strokeWidth={12}
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer outline-none focus-visible:stroke-sky-300/40"
                onClick={(event) => {
                  if (drawing || editSession) return;
                  event.stopPropagation();
                  const raw = rawPoint(event);
                  onSelect(
                    { kind: "wall", id: wall.id },
                    { x: event.clientX, y: event.clientY },
                    undefined,
                    raw ? wallAxisAnchor(wall, raw) : wall.start,
                    undefined,
                    event.ctrlKey || event.metaKey,
                  );
                }}
              />
            </g>
          ))}
      {!selection &&
        plan.walls
          .filter((w) => selectedIds.has(w.id))
          .map((w) => (
            <line
              key={`selected-axis:${w.id}`}
              aria-label={`Wandachse ${w.id}`}
              x1={w.start.x}
              y1={-w.start.y}
              x2={w.end.x}
              y2={-w.end.y}
              stroke={WALL_AXIS_COLOR}
              style={CAD_SHIMMER}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          ))}
      {sceneRuns.filter((run) => run.kind === "line").map(renderRun)}
      {!drawing &&
        !editSession &&
        selection &&
        selectedRing?.map((a, edgeIndex, ring) => {
          const b = ring[(edgeIndex + 1) % ring.length]!;
          const point = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const length = Math.hypot(b.x - a.x, b.y - a.y);
          const sign = selectedShape?.valid && selectedShape.signedArea > 0 ? 1 : -1;
          const nx = (-(b.y - a.y) / length) * sign,
            ny = ((b.x - a.x) / length) * sign;
          const size = Math.min(1 / camera.pixelsPerMetre, length / 40);
          const cx = point.x + nx * 12 * size,
            cy = point.y + ny * 12 * size;
          const arrow = (along: number, across: number) =>
            `${cx + nx * along * size - ny * across * size},${-(cy + ny * along * size + nx * across * size)}`;
          return (
            <g
              key={`edge-${edgeIndex}`}
              role="button"
              tabIndex={0}
              aria-label={`Konturseite ${edgeIndex + 1} strecken`}
              className="cursor-grab outline-none focus-visible:stroke-blue-800"
              onPointerDown={(event) => {
                if (event.button !== 0 || pan || selecting || !interactive || !onContourStretch)
                  return;
                const start = rawPoint(event);
                if (!start || !svg.current) return;
                event.preventDefault();
                event.stopPropagation();
                svg.current.focus();
                gripClick.current = false;
                navigationClick.current = false;
                gripDrag.current = {
                  base: project,
                  target: selection,
                  index: edgeIndex,
                  gesture: {
                    pointerId: event.pointerId,
                    origin: point,
                    pointerStart: start,
                    screenStart: { x: event.clientX, y: event.clientY },
                  },
                };
                svg.current.setPointerCapture(event.pointerId);
                onContourStretch(selection, edgeIndex, point);
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onKeyDown={(event) => {
                if (
                  (event.key === "Enter" || event.key === " ") &&
                  interactive &&
                  !pan &&
                  !selecting
                ) {
                  event.preventDefault();
                  event.stopPropagation();
                  onContourStretch?.(selection, edgeIndex, point);
                }
              }}
            >
              <circle cx={cx} cy={-cy} r={10 / camera.pixelsPerMetre} fill="transparent" />
              <path
                d={`M ${arrow(-6, 0)} L ${arrow(6, 0)} M ${arrow(-2, -3)} L ${arrow(-6, 0)} L ${arrow(-2, 3)} M ${arrow(2, -3)} L ${arrow(6, 0)} L ${arrow(2, 3)}`}
                fill="none"
                stroke="#0284c7"
                strokeWidth={2}
                className="cursor-pointer outline-none focus-visible:stroke-blue-800"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            </g>
          );
        })}
      {!drawing &&
        !editSession &&
        selection &&
        handles.map(({ point, index, label, axis }) => (
          <circle
            key={label}
            cx={point.x}
            cy={-point.y}
            r={5 / camera.pixelsPerMetre}
            fill={axis ? WALL_AXIS_COLOR : "white"}
            stroke={axis ? WALL_AXIS_COLOR : "#0284c7"}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            role="button"
            tabIndex={0}
            aria-label={label}
            className="cursor-pointer outline-none focus:stroke-foreground"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(selection, { x: event.clientX, y: event.clientY }, index, point);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                const bounds = event.currentTarget.getBoundingClientRect();
                onSelect(selection, { x: bounds.x, y: bounds.y }, index, point);
              }
            }}
          />
        ))}
      {placement?.areaMeasurement && (
        <AreaMeasurementOverlay
          measurement={placement.areaMeasurement}
          aim={resolvedHover?.point ?? null}
          pixelsPerMetre={camera.pixelsPerMetre}
        />
      )}
      {placement?.measurement && (
        <DistanceOverlay
          measurement={placement.measurement}
          aim={resolvedHover?.point ?? null}
          pixelsPerMetre={camera.pixelsPerMetre}
        />
      )}
      {editSession && resolvedEdit && (
        <g pointerEvents="none">
          <line
            x1={editSession.anchor.x}
            y1={-editSession.anchor.y}
            x2={resolvedEdit.point.x}
            y2={-resolvedEdit.point.y}
            stroke={editError ? "#dc2626" : "#0284c7"}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            strokeDasharray="5 4"
          />
          <circle
            cx={resolvedEdit.point.x}
            cy={-resolvedEdit.point.y}
            r={5 / camera.pixelsPerMetre}
            fill={editError ? "#dc2626" : "#0284c7"}
          />
          {editError && (
            <text
              role="alert"
              x={resolvedEdit.point.x}
              y={-resolvedEdit.point.y - 0.15}
              fontSize={0.13}
              fill="#dc2626"
            >
              {editError}
            </text>
          )}
        </g>
      )}
      {drawing && draftFill && (draftPoints.length >= 2 || constructedContour.length >= 3) && (
        <polygon
          points={(draftContour
            ? constructedContour
            : [...draftPoints, ...(resolvedHover ? [resolvedHover.point] : [])]
          )
            .map((p) => `${p.x},${-p.y}`)
            .join(" ")}
          fill={draftFill.color}
          fillOpacity={draftFill.opacity}
          stroke="var(--primary)"
          strokeWidth={1}
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}
      {drawing && draftPoints.length > 0 && (
        <polyline
          points={draftPoints.map((p) => `${p.x},${-p.y}`).join(" ")}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={0.025}
          pointerEvents="none"
        />
      )}
      {(drawingResult.error || (placement && editError)) && resolvedHover && (
        <text
          role="alert"
          x={resolvedHover.point.x}
          y={-resolvedHover.point.y - 18 / camera.pixelsPerMetre}
          fontSize={12 / camera.pixelsPerMetre}
          fill="#dc2626"
          pointerEvents="none"
        >
          {drawingResult.error || editError}
        </text>
      )}
      {drawing && start && (
        <g pointerEvents="none">
          <circle
            cx={start.x}
            cy={-start.y}
            r={6 / camera.pixelsPerMetre}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          {resolvedHover && (
            <line
              x1={start.x}
              y1={-start.y}
              x2={resolvedHover.point.x}
              y2={-resolvedHover.point.y}
              stroke="var(--primary)"
              strokeWidth={0.025}
              strokeDasharray="0.1 0.05"
            />
          )}
        </g>
      )}
      {!pan &&
        snap &&
        guideCursor &&
        activeReferences.map((reference) => {
          const guide = cursorGuide(guideCursor, reference, guideDirections);
          const extension =
            40 / camera.pixelsPerMetre / Math.hypot(guide.direction.x, guide.direction.y);
          return (
            <line
              key={JSON.stringify([reference.entityId, reference.feature])}
              aria-label="Referenzhilfslinie"
              data-guide-kind={guide.kind}
              pointerEvents="none"
              x1={guide.origin.x}
              y1={-guide.origin.y}
              x2={guide.point.x + extension * guide.direction.x}
              y2={-guide.point.y - extension * guide.direction.y}
              stroke="#929aa3"
              strokeWidth={1}
              strokeOpacity={0.7}
              strokeDasharray="6 4"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      {!pan &&
        activeReferences.map((reference) => (
          <g
            key={`${reference.entityId}/${reference.feature}`}
            pointerEvents="none"
            aria-label="Aktive Hover-Referenz"
          >
            {reference.segment && (
              <line
                aria-label="Erfasste Linienreferenz"
                x1={reference.segment.start.x}
                y1={-reference.segment.start.y}
                x2={reference.segment.end.x}
                y2={-reference.segment.end.y}
                stroke="#929aa3"
                strokeWidth={3}
                strokeDasharray="6 4"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <circle
              cx={reference.point.x}
              cy={-reference.point.y}
              r={10.5 / camera.pixelsPerMetre}
              fill="none"
              stroke="#929aa3"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      {!pan && endpointSnap && (
        <g pointerEvents="none">
          {" "}
          {resolvedHover?.candidate?.guideOrigin && (
            <line
              aria-label="Temporäre Hilfslinie"
              x1={resolvedHover.candidate.guideOrigin.x}
              y1={-resolvedHover.candidate.guideOrigin.y}
              x2={resolvedHover.point.x}
              y2={-resolvedHover.point.y}
              stroke="#929aa3"
              strokeWidth={1}
              strokeDasharray="6 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {resolvedHover?.candidate?.secondaryGuideOrigin && (
            <line
              aria-label="Zweite temporäre Hilfslinie"
              x1={resolvedHover.candidate.secondaryGuideOrigin.x}
              y1={-resolvedHover.candidate.secondaryGuideOrigin.y}
              x2={resolvedHover.point.x}
              y2={-resolvedHover.point.y}
              stroke="#929aa3"
              strokeWidth={1}
              strokeDasharray="6 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </g>
      )}
      {!pan &&
        endpointSnap &&
        resolvedHover?.candidate &&
        (drawing || resolvedHover.candidate.kind !== "grid") && (
          <g
            pointerEvents="none"
            aria-label={`Fanghilfe ${resolvedHover.candidate.sourceFeature === "t-axis" ? "T-Anschluss" : snapLabels[resolvedHover.candidate.kind]}`}
          >
            {resolvedHover.candidate.kind === "midpoint" ? (
              <path
                d={`M ${resolvedHover.point.x} ${-resolvedHover.point.y - 5 / camera.pixelsPerMetre} l ${5 / camera.pixelsPerMetre} ${9 / camera.pixelsPerMetre} h ${-10 / camera.pixelsPerMetre} Z`}
                fill="none"
                stroke="#0284c7"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <circle
                cx={resolvedHover.point.x}
                cy={-resolvedHover.point.y}
                r={4 / camera.pixelsPerMetre}
                fill="none"
                stroke="#0284c7"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            )}
            <text
              x={resolvedHover.point.x + 9 / camera.pixelsPerMetre}
              y={-resolvedHover.point.y - 9 / camera.pixelsPerMetre}
              fontSize={12 / camera.pixelsPerMetre}
              fill="#0284c7"
            >
              {resolvedHover.candidate.sourceFeature === "t-axis"
                ? "T-Anschluss"
                : snapLabels[resolvedHover.candidate.kind]}
            </text>
          </g>
        )}
      {selecting && (
        <g pointerEvents="none">
          <rect
            x={camera.center.x - viewSize.width / camera.pixelsPerMetre / 2}
            y={-camera.center.y - viewSize.height / camera.pixelsPerMetre / 2}
            width={viewSize.width / camera.pixelsPerMetre}
            height={viewSize.height / camera.pixelsPerMetre}
            fill="var(--background)"
            opacity={0.65}
          />
          {referenceSelection?.mode === "points" &&
            referenceSelection.points
              .filter((r) => isLayerVisible(project, visibility, r.entityId))
              .map((r) => (
                <circle
                  key={referenceKey(r)}
                  cx={r.point.x}
                  cy={-r.point.y}
                  r={8 / camera.pixelsPerMetre}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth={2 / camera.pixelsPerMetre}
                />
              ))}
          {modelSources.allSegments
            .filter((s) => isLayerVisible(project, visibility, s.source.entityId))
            .filter(
              (s) =>
                referenceSelection?.state.draft?.includes(segmentKey(s.source)) ||
                (referenceSelection?.hot &&
                  segmentKey(referenceSelection.hot) === segmentKey(s.source)),
            )
            .map((s) => (
              <line
                key={segmentKey(s.source)}
                x1={s.start.x}
                y1={-s.start.y}
                x2={s.end.x}
                y2={-s.end.y}
                stroke="#64748b"
                strokeWidth={3 / camera.pixelsPerMetre}
              />
            ))}
        </g>
      )}
      {referenceSelection &&
        (selecting || referenceSelection.selected || (endpointSnap && snap && density.paused)) && (
          <foreignObject
            transform={`translate(${camera.center.x - viewSize.width / camera.pixelsPerMetre / 2 + panelX / camera.pixelsPerMetre} ${-camera.center.y - viewSize.height / camera.pixelsPerMetre / 2 + panelY / camera.pixelsPerMetre}) scale(${1 / camera.pixelsPerMetre})`}
            width={Math.min(440, viewSize.width - 24)}
            height={selecting ? 340 : 90}
          >
            <ReferenceSelectionPanel
              binding={referenceSelection}
              pointsEnabled={trackingContext.enabled}
              pointPreview={previewPoints(referenceSelection.points)}
              onApplyPoints={() => {
                const points = referenceSelection.points;
                const valid = points.every(
                  (r) =>
                    isLayerVisible(project, visibility, r.entityId) &&
                    modelSources.lookup(referenceKey(r)) &&
                    (!snapping || snapping.sources([r]).length > 0),
                );
                if (valid && acquirePoints(points)) referenceSelection.cancel();
              }}
              paused={endpointSnap && snap && density.paused}
              label={(r) => {
                const wi = project.storey.walls.findIndex((w) => w.id === r.entityId);
                const li = project.storey.lines?.findIndex((l) => l.id === r.entityId) ?? -1;
                if (referenceSelection.mode === "points")
                  return `${wi >= 0 ? `Wand ${wi + 1}` : li >= 0 ? `Linie ${li + 1}` : "Hilfsreferenz"} · ${r.kind === "midpoint" ? "Mittelpunkt" : "Punkt"} (${r.point.x.toFixed(2)}; ${r.point.y.toFixed(2)})`;
                return wi >= 0
                  ? `Wand ${wi + 1} · Achse`
                  : `Linie ${li + 1} · Teilsegment ${Number(r.feature.match(/segment-(\d+)/)?.[1] ?? 0) + 1}`;
              }}
            />
          </foreignObject>
        )}
    </svg>
  );
}
