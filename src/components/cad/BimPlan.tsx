import type { DimensionStyle } from "./DimensionStyleFields";
import { TextGraphic } from "./TextGraphic";
import type { PlanText } from "@/domain/elements/text/model";
import { DimensionGraphic } from "./DimensionGraphic";
import { StairPlanGraphic } from "./StairPlanGraphic";
import { SectionPlanGraphic } from "./SectionPlanGraphic";
import { LineLengthHelper } from "./LineLengthHelper";
import type { LocalSnapSources } from "@/application/snapping/local-sources";
import type { LengthDirection } from "@/application/lines/actions";
import {
  sectionLookTo,
  sectionSymbolHeight,
  type Section,
  type SectionSymbolSize,
} from "@/domain/views/sections";
import {
  stairDirectionTo,
  stairGeometry,
  stairPlan,
  stairTurnTo,
  type Stair,
} from "@/domain/elements/stair/model";
import { defaultCutFill, type CutFill } from "./cut-fill";
import { snapPointLabel } from "@/application/snapping/point-label";
import { capturedVertex } from "@/application/direct-edit/transforms";
import {
  dragSectionGrip,
  sectionGripPoint,
  type SectionGrip,
} from "@/application/sections/actions";
import {
  capturedStart,
  closesAtStart,
  MIN_CLOSING_POINTS,
} from "@/application/drawing/path-closure";
import type { ElementKind } from "../../application/selection/target.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { columnOutline } from "../../domain/elements/column/model.ts";
import type { WorkingViewContext } from "@/application/views/working-context";
import type { HatchPatternSize } from "@/domain/elements/hatch/model";
import { HatchPattern } from "./HatchPattern";
import type { HatchPatternDefinition } from "@/domain/elements/hatch/pattern";
import { createDoubleSecondaryClick } from "@/application/input/double-secondary";
import { AngleMeasurementOverlay } from "./AngleMeasurementOverlay";
import type { AngleMeasurement } from "@/application/measurement/angle";
import { CAD_SHIMMER, CAD_TURQUOISE } from "@/rendering/viewport/highlight";
import { AreaMeasurementOverlay } from "./AreaMeasurementOverlay";
import type { AreaMeasurement } from "@/application/measurement/area";
import { DistanceOverlay } from "./DistanceOverlay";
import type { DistanceMeasurement } from "@/application/measurement/distance";
import { PlanSceneRun } from "./PlanSceneRun";
import { derivePlanScene, planSceneRuns, type PlanRun } from "@/rendering/viewport/plan-scene";
import type { GeometryPreview } from "@/domain/project/geometry-scope";
import { useSelectionMarquee } from "./useSelectionMarquee";
import {
  planElementCaption,
  planSelectionShapes,
  shapesAt,
} from "@/rendering/viewport/selection-shapes";
import { useOverlapCycle } from "./useOverlapCycle";

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
  createTracedToolSourceQuery,
  toolPinnedReferences,
} from "@/application/tools/snapping";
import type { ToolSnapPolicy } from "@/application/tools/snapping";
import { useHoverReference } from "./useHoverReference";
import { getLocalSnapSources } from "@/application/snapping/local-sources";
import { panPlan, planScaleBar, planViewBox, zoomPlan } from "@/rendering/viewport/plan-camera";
import type { PlanCamera, ViewSize } from "@/rendering/viewport/plan-camera";
import { previewEdit } from "@/application/direct-edit/controller";
import { previewOverlapHint } from "@/application/openings/overlap-hint";
import type { EditSession } from "@/application/direct-edit/session";
import type { Point, Project } from "@/domain/project/schema";
import type { Selection } from "./bim-view";
import { linePath } from "@/lib/bim/lines";

export type BimPlanProps = {
  pickupScope?: object;
  /** Right-click menu (docs/KONTEXTMENUE.md): on an element or on empty canvas (null). When
   * set it replaces the former double right-click pickup, which moves into the menu. */
  onContextMenu?: (target: NonNullable<Selection> | null, x: number, y: number) => void;
  /** Double click on an element while selecting: its settings window (docs/EINSTELLUNGSFENSTER.md). */
  onElementSettings?: (target: NonNullable<Selection>) => void;
  onPickup?: (target: NonNullable<Selection>) => void;
  draftContour?: ((point: Point) => Point[]) | undefined;
  placement?:
    | {
        measurement?: DistanceMeasurement | undefined;
        angleMeasurement?: AngleMeasurement | undefined;
        areaMeasurement?: AreaMeasurement | undefined;
        finish?: (() => void) | undefined;
        target: Point | null | undefined;
        previewProject?: ToolInteraction["previewProject"];
        geometryPreview?: ToolInteraction["geometryPreview"];
        axisConstraint?: ToolInteraction["axisConstraint"];
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
  viewContext: WorkingViewContext;
  snapping?: ToolSnapPolicy | null;
  selection: Selection;
  selections?: SelectionSet;
  onSelectMany?: (targets: SelectionSet) => void;
  drawing: boolean;
  endpointSnap?: boolean;
  hoverDwellMs?: number;
  start: Point | null;
  draftPoints?: Point[];
  /** False while the draft holds no segment yet (only the click of this double click): a double
   * click then opens the element under the cursor instead of finishing (docs/BAUZUSTAND.md). */
  draftFinishable?: boolean;
  /** Text being typed (docs/TEXT.md): drawn live at its insertion point. */
  textPreview?: Omit<PlanText, "id" | "layerId"> | undefined;
  /** Stair being drawn (docs/TREPPE.md, TR2/TR3): start on the drawing axis; the pointer gives
   * the run direction, then for L and U the side of the turn; the full stair follows live. */
  stairDraft?:
    | {
        start: Point;
        /** Set by the second click of an L or U: the pointer now chooses the turn. */
        direction: number | null;
        values: Omit<Stair, "id" | "start" | "direction">;
        storeyHeight: number | null;
      }
    | undefined;
  /** Sections of the building, shown in every storey's plan (docs/SCHNITT.md, SC2). */
  sections?: readonly Section[] | undefined;
  /** Double click on a section line opens its window. */
  onSectionSettings?: ((id: string) => void) | undefined;
  /** Transparency trace (S4): outlines of another storey under the plan, optional snapping. */
  tracing?:
    | {
        walls: Point[][];
        columns: Point[][];
        color: string;
        opacity: number;
        snap: { sources: LocalSnapSources; ids: ReadonlySet<string> } | null;
      }
    | null
    | undefined;
  /** Model point of the click that selected the element; picks the segment of a line (S3). */
  selectionAnchor?: Point | null | undefined;
  /** Length helper of a selected line: new length of a segment (docs/LINIEN.md, S3). */
  onLineLength?:
    | ((lineId: string, segment: number, length: number, direction: LengthDirection) => void)
    | undefined;
  /** Selected section line (SC5): highlighted with grips at both ends and in the middle. */
  selectedSectionId?: string | null | undefined;
  /** Click on a section line selects it; null when the click selects nothing. */
  onSectionSelect?: ((id: string | null) => void) | undefined;
  /** A grip was dragged: the new line of the section (one undo step). */
  onSectionLine?: ((id: string, line: { start: Point; end: Point }) => void) | undefined;
  /** Section being drawn: start, then end; the pointer gives the end, then the viewing side. */
  sectionDraft?:
    | {
        start: Point;
        end: Point | null;
        mark: string;
        symbolSize: SectionSymbolSize;
        kind?: "elevation";
      }
    | undefined;
  /** Running dimension chain (docs/MASSKETTE.md): line position, points so far, direction. */
  dimensionDraft?:
    | {
        orientation: "horizontal" | "vertical";
        line: Point | null;
        points: readonly Point[];
        /** Editing an existing chain: "line" moves its dimension line with the pointer,
         * "remove" shows its points to click; adding behaves like drawing. */
        mode?: "add" | "remove" | "line" | undefined;
        /** Terminator, figures and height of the chain being drawn or edited. */
        style?: DimensionStyle | undefined;
      }
    | undefined;
  /** The drawing tool closes by a click on its start point (docs/POLYGON_REGELN.md, Regel 3). */
  closeAtStart?: boolean;
  /** Roof tool guide: reference line and rise side; null rise follows the cursor (ROOF D3). */
  roofGuide?: { start: Point; end: Point; rise: "left" | "right" | null } | null;
  draftFill?: Hatch["fill"] | undefined;
  draftPattern?: HatchPatternDefinition | null | undefined;
  draftPatternRotation?: number | undefined;
  draftPatternSize?: HatchPatternSize | undefined;
  gridSettings?: GridSettings;
  wallOutlineWidth?: number;
  /** Fill of cut walls and roof cuts (docs/SCHNITTDARSTELLUNG.md). */
  cutFill?: CutFill;
  /** Neubau red, Abbruch yellow (docs/BAUZUSTAND.md). */
  showRenovation?: boolean;
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
  /** Click on a corner grip: true when the workspace started moving that corner (Regel 1). */
  onCornerPick?: (selection: NonNullable<Selection>, index: number, anchor: Point) => boolean;
  onEditCancel?: () => void;
  onPoint: (point: Point, candidate?: SnapCandidate | null) => void;
  onFinish?: () => void;
};

export function BimPlan({
  pickupScope,
  onPickup,
  onContextMenu,
  onElementSettings,
  draftContour,
  placement,
  drawingPreview,
  drawingProjectAt,
  cornerPreview,
  referenceSelection,
  referenceScope,
  interactive = true,
  project,
  viewContext,
  snapping: requestedSnapping = null,
  selection: requestedSelection,
  selections,
  onSelectMany,
  drawing,
  endpointSnap = false,
  hoverDwellMs = DEFAULT_HOVER_DWELL_MS,
  start,
  draftPoints = [],
  draftFinishable = true,
  dimensionDraft,
  stairDraft,
  sections,
  onSectionSettings,
  selectedSectionId,
  onSectionSelect,
  onSectionLine,
  selectionAnchor,
  onLineLength,
  tracing,
  sectionDraft,
  textPreview,
  closeAtStart = false,
  roofGuide = null,
  draftFill,
  draftPattern,
  draftPatternRotation,
  draftPatternSize,
  snap,
  gridSettings = defaultGridSettings,
  wallOutlineWidth = 1,
  cutFill = defaultCutFill,
  showRenovation = false,
  ortho,
  onSelect,
  onPoint,
  onFinish,
  editSession: requestedEditSession,
  onEditCommit,
  onContourStretch,
  onCornerPick,
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
  const { scale: scaleContext, visibility } = viewContext;
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
  // Dragging a grip of the selected section line (SC5); the preview replaces the stored line.
  const sectionDrag = useRef<{
    id: string;
    grip: SectionGrip;
    pointerId: number;
    line: { start: Point; end: Point };
  } | null>(null);
  const [sectionPreview, setSectionPreview] = useState<{
    id: string;
    start: Point;
    end: Point;
  } | null>(null);
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
  const traceSnap = tracing?.snap ?? null;
  const sourceQuery = useMemo(
    () =>
      visibility && traceSnap
        ? createTracedToolSourceQuery(project, visibility, visibility.context, snapping, traceSnap)
        : visibility
          ? createVisibleToolSourceQuery(project, visibility, visibility.context, snapping)
          : createToolSourceQuery(modelSources, snapping),
    [modelSources, snapping, project, visibility, traceSnap],
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
  // A point caught on the transparency trace (S4) is a plain point: it belongs to another
  // storey, so it must never become a join or host target of the working storey.
  const resolvePointer = (point: Point, shift = shiftHeld) => {
    const result = resolveLockedSnap(
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
    // Keep the snapped point and its marker, drop only what ties it to the other storey.
    return result.candidate?.sourceEntityId && traceSnap?.ids.has(result.candidate.sourceEntityId)
      ? {
          ...result,
          candidate: {
            ...result.candidate,
            sourceEntityId: null,
            sourceFeature: "trace",
            sourceReferences: [],
          },
        }
      : result;
  };
  const pointerSnap = hover ? resolvePointer(hover) : null;
  // Regel 3: near its start a closable drawing aims exactly at the start (preview = click).
  const startTarget =
    drawing && closeAtStart && hover
      ? capturedStart(draftPoints, hover, camera.pixelsPerMetre, "polygon")
      : null;
  const resolvedHover = startTarget
    ? { point: startTarget, candidate: null }
    : placement?.target !== undefined
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
      : ((resolvedHover?.candidate &&
          snapPointLabel(
            project,
            resolvedHover.candidate.sourceEntityId,
            resolvedHover.candidate.sourceFeature,
          )) ??
        "Endpunkt"),
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
  // Regel 2: near another corner of the edited element the corner itself wins over all snaps.
  const resolveEditPointer = (point: Point, shift = shiftHeld) => {
    const corner = editSession ? capturedVertex(editSession, point, camera.pixelsPerMetre) : null;
    return corner ? { point: corner, candidate: null } : resolvePointer(point, shift);
  };
  const resolvedEdit =
    numericTarget !== undefined
      ? numericTarget
        ? { point: numericTarget, candidate: null }
        : null
      : editSession && editPointer?.session === editSession
        ? resolveEditPointer(editPointer.point)
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
  // Overlapping openings stay allowed; placement and edit previews only show a hint.
  const overlapHint = useMemo(
    () => (placementProject || preview ? previewOverlapHint(project, shown) : ""),
    [placementProject, preview, project, shown],
  );
  const hintPoint = editSession ? resolvedEdit?.point : resolvedHover?.point;
  const allowsShown = useMemo(
    () => drawingWallVisibility(project, shown, visibility),
    [project, shown, visibility],
  );
  const scene = useMemo(
    () => derivePlanScene(shown, allowsShown, project.hatchPatterns),
    [shown, allowsShown, project.hatchPatterns],
  );
  const previewScene = useMemo(
    () =>
      geometryPreview
        ? derivePlanScene(geometryPreview.geometry, allowsShown, project.hatchPatterns)
        : null,
    [geometryPreview, allowsShown, project.hatchPatterns],
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
    const wall = storeyOf(project).walls.find((item) => item.id === selection.id);
    if (wall)
      handles.push(
        ...wallPlanHandles(
          wall,
          storeyOf(project).wallJoins.some(
            (j) => j.first.wallId === wall.id || j.second.wallId === wall.id,
          ),
        ),
      );
  } else if (selection?.kind === "hatch") {
    storeyOf(project)
      .hatches.find((h) => h.id === selection.id)
      ?.points.forEach((point, index) =>
        handles.push({ point, index, label: `Schraffurecke ${index + 1}` }),
      );
  } else if (selection?.kind === "room") {
    storeyOf(project)
      .rooms?.find((r) => r.id === selection.id)
      ?.points.forEach((point, index) =>
        handles.push({ point, index, label: `Raumecke ${index + 1}` }),
      );
  } else if (selection?.kind === "roof") {
    storeyOf(project)
      .roofs?.find((r) => r.id === selection.id)
      ?.points.forEach((point, index) =>
        handles.push({ point, index, label: `Dachecke ${index + 1}` }),
      );
  } else if (selection?.kind === "slab") {
    storeyOf(project)
      .slabs?.find((s) => s.id === selection.id)
      ?.points.forEach((point, index) =>
        handles.push({ point, index, label: `Deckenecke ${index + 1}` }),
      );
  } else if (selection?.kind === "line") {
    const line = storeyOf(project).lines?.find((item) => item.id === selection.id);
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
  } else if (selection?.kind === "column") {
    // E1: corners of a rectangular column, the centre of a round one; a click moves the column
    // with that point as its handle.
    const column = storeyOf(project).columns?.find((c) => c.id === selection.id);
    if (column)
      (column.shape.kind === "circle" ? [column.position] : columnOutline(column)).forEach(
        (point, index) => handles.push({ point, index, label: `Stützenecke ${index + 1}` }),
      );
  } else if (selection?.kind === "stair") {
    // E1: corners of the stair outline; a click moves the stair with that corner as its handle.
    const stair = storeyOf(project).stairs?.find((s) => s.id === selection.id);
    if (stair) {
      const g = stairGeometry(stair, storeyOf(project).height ?? null);
      (g ? stairPlan(stair, g).outline : [stair.start]).forEach((point, index) =>
        handles.push({ point, index, label: `Treppenecke ${index + 1}` }),
      );
    }
  }
  const pointFromEvent = (event: React.MouseEvent<SVGSVGElement>) => {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return resolvePointer({ x: point.x, y: -point.y }, event.shiftKey);
  };
  const secondary = useRef(createDoubleSecondaryClick());
  const pickupContext = useMemo(
    () => ({
      project,
      visibility,
      drawing,
      placement,
      editSession,
      selecting,
      pan,
      interactive,
      pickupScope,
    }),
    [
      project,
      visibility,
      drawing,
      placement,
      editSession,
      selecting,
      pan,
      interactive,
      pickupScope,
    ],
  );
  const contextMenuReady = () =>
    !!onContextMenu &&
    interactive &&
    !editSession &&
    !selecting &&
    !pan &&
    !placement &&
    !drawing &&
    !referenceSelection?.selecting;
  const selectProps = (kind: ElementKind, id: string) => ({
    role: "button",
    tabIndex: drawing ? -1 : 0,
    "aria-label": `Select ${kind} ${id}`,
    "aria-pressed": selectedIds.has(id),
    onContextMenu: (event: React.MouseEvent) => {
      if (contextMenuReady()) {
        event.preventDefault();
        event.stopPropagation();
        onContextMenu!({ kind, id }, event.clientX, event.clientY);
        return;
      }
      if (
        !onPickup ||
        !interactive ||
        editSession ||
        selecting ||
        pan ||
        placement ||
        (drawing && start)
      ) {
        secondary.current.reset();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (
        secondary.current.click({
          key: `${kind}:${id}`,
          context: pickupContext,
          x: event.clientX,
          y: event.clientY,
          time: event.timeStamp,
        })
      )
        onPickup({ kind, id });
    },
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
      secondary: (kind: NonNullable<Selection>["kind"], id: string, event: React.MouseEvent) =>
        latestSelect.current(kind, id).onContextMenu(event),
      click: (kind: NonNullable<Selection>["kind"], id: string, event: React.MouseEvent) =>
        latestSelect.current(kind, id).onClick(event),
      key: (kind: NonNullable<Selection>["kind"], id: string, event: React.KeyboardEvent) =>
        latestSelect.current(kind, id).onKeyDown(event),
    }),
    [],
  );
  const renderRun = (run: PlanRun) => (
    <PlanSceneRun
      scaleContext={scaleContext}
      key={`${run.kind}:${run.ids[0]}`}
      {...run}
      scene={run.affected && previewScene ? previewScene : scene}
      selectedIds={selectedIds}
      drawing={drawing}
      placement={!!placement}
      pixelsPerMetre={camera.pixelsPerMetre}
      wallOutlineWidth={wallOutlineWidth}
      cutFill={cutFill}
      showRenovation={showRenovation}
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
  // Tab cycling through overlapping elements (docs/TAB_AUSWAHL.md); select tool only.
  const overlap = useOverlapCycle(
    interactive &&
      !placement &&
      !drawing &&
      !editSession &&
      !selecting &&
      !pan &&
      !referenceSelection?.selecting,
    shapes,
    camera.pixelsPerMetre,
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
      onPointerDownCapture={(event) => {
        if (event.button !== 2) secondary.current.reset();
        marquee.down(event);
      }}
      onContextMenu={(event) => {
        secondary.current.reset();
        if (!contextMenuReady()) return;
        event.preventDefault();
        onContextMenu!(null, event.clientX, event.clientY);
      }}
      onKeyDownCapture={() => secondary.current.reset()}
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
        const dragged = sectionDrag.current;
        if (dragged?.pointerId === event.pointerId) {
          sectionDrag.current = null;
          gripClick.current = true;
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
          const line = sectionPreview?.id === dragged.id ? sectionPreview : null;
          setSectionPreview(null);
          if (
            line &&
            (line.start.x !== dragged.line.start.x ||
              line.start.y !== dragged.line.start.y ||
              line.end.x !== dragged.line.end.x ||
              line.end.y !== dragged.line.end.y)
          )
            onSectionLine?.(dragged.id, { start: line.start, end: line.end });
          return;
        }
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
              const snapped = resolveEditPointer(result.point, event.shiftKey);
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
        if (sectionDrag.current) {
          sectionDrag.current = null;
          setSectionPreview(null);
        }
        navigation.current = null;
        if (gripDrag.current) {
          gripDrag.current = null;
          onEditCancel?.();
        }
      }}
      onPointerCancel={() => {
        marquee.cancel();
        if (sectionDrag.current) {
          sectionDrag.current = null;
          setSectionPreview(null);
        }
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
        // Overlapping elements: the click selects the Tab pre-selection, not the topmost one.
        const chosen = overlap.preselected;
        if (chosen && (event.target as Element).closest("[data-plan-pick]")) {
          event.preventDefault();
          event.stopPropagation();
          overlap.clear();
          latestSelect.current(chosen.kind, chosen.id).onClick(event);
          return;
        }
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
        const sectionGrip = sectionDrag.current;
        if (sectionGrip?.pointerId === event.pointerId) {
          const raw = rawPoint(event);
          if (!raw) return;
          // Snaps like drawing; Shift keeps the direction of the line, so ends only change length.
          const to = resolvePointer(raw, false).point;
          const line = dragSectionGrip(sectionGrip.line, sectionGrip.grip, to, event.shiftKey);
          if (line) setSectionPreview({ id: sectionGrip.id, ...line });
          return;
        }
        if (pan || selecting) return overlap.clear();
        overlap.move(gripDrag.current ? null : rawPoint(event));
        if (gripDrag.current && gripDrag.current.gesture.pointerId !== event.pointerId) return;
        const drawingPoint = draggedPoint(event)?.point ?? rawPoint(event);
        if (endpointSnap || editSession) setHover(drawingPoint);
        if (placement && drawingPoint)
          placement.aim(resolvePointer(drawingPoint, event.shiftKey).point);
        if (drawing && drawingPoint)
          onDrawingAim?.(
            (closeAtStart
              ? capturedStart(draftPoints, drawingPoint, camera.pixelsPerMetre, "polygon")
              : null) ?? resolvePointer(drawingPoint, event.shiftKey).point,
          );
        if (editSession) {
          const point = drawingPoint;
          if (point) {
            setEditPointer({ session: editSession, point });
            onEditAim?.(editSession, resolveEditPointer(point, event.shiftKey).point);
          }
        }
      }}
      onPointerLeave={() => {
        overlap.clear();
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
              const snapped = resolveEditPointer(point, event.shiftKey);
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
          const raw = closeAtStart ? rawPoint(event) : null;
          const start = raw
            ? capturedStart(draftPoints, raw, camera.pixelsPerMetre, "polygon")
            : null;
          const point = start ?? (drawingTarget !== undefined ? drawingTarget : snap?.point);
          if (point) onPoint(point, start || drawingTarget !== undefined ? null : snap?.candidate);
        } else if ((event.target as Element).closest("[data-section-id]") && onSectionSelect) {
          // A section line belongs to no storey: it has its own selection (SC5).
          event.currentTarget.focus();
          onSectionSelect(
            (event.target as Element).closest("[data-section-id]")!.getAttribute("data-section-id"),
          );
        } else if (event.target === event.currentTarget) {
          onSelect(null);
          onSectionSelect?.(null);
        }
      }}
      onDoubleClick={(event) => {
        if (selecting || pan || navigationClick.current) return;
        if (placement?.finish && interactive) {
          event.preventDefault();
          placement.finish();
          return;
        }
        if (drawing && onFinish && draftFinishable) {
          event.preventDefault();
          onFinish();
          return;
        }
        // A section line belongs to no storey and is not an element: it opens its own window.
        const sectionId = (event.target as Element)
          .closest("[data-section-id]")
          ?.getAttribute("data-section-id");
        if (sectionId && onSectionSettings && !editSession && (!drawing || !draftFinishable)) {
          event.preventDefault();
          onSectionSettings(sectionId);
          return;
        }
        // Selecting, or a drawing tool without a started draft: the element under the cursor (or
        // the Tab pre-selection) opens its window.
        const idleDrawing = drawing && !!onFinish && !draftFinishable;
        if (!onElementSettings || (drawing && !idleDrawing) || placement || editSession) return;
        if (!interactive) return;
        // Overlays of a selected element (axis, grips) lie on top, so the element is found
        // geometrically under the cursor, like the Tab cycling; the DOM target is the fallback.
        const node = (event.target as Element).closest("[data-plan-pick]");
        const kind = node?.getAttribute("data-kind"),
          id = node?.getAttribute("data-id");
        const point = rawPoint(event);
        const hit = point ? shapesAt(shapes, point, 6 / camera.pixelsPerMetre)[0] : undefined;
        const picked =
          overlap.preselected ??
          hit?.target ??
          (kind && id ? ({ kind, id } as NonNullable<Selection>) : null);
        if (!picked) return;
        event.preventDefault();
        onElementSettings(picked);
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
      <g>
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
        {tracing && (
          <g aria-label="Transparenzpause" pointerEvents="none" opacity={tracing.opacity}>
            {[...tracing.walls, ...tracing.columns].map((outline, i) => (
              <polygon
                key={i}
                points={outline.map((p) => `${p.x},${-p.y}`).join(" ")}
                fill={tracing.color}
                fillOpacity={0.35}
                stroke={tracing.color}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            ))}
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
                // Regel 1: a click moves the corner at once, also wall ends and corners and the
                // corners of columns and stairs (E1); right click keeps every point action.
                if (onCornerPick?.(selection, index, point)) return;
                onSelect(selection, { x: event.clientX, y: event.clientY }, index, point);
              }}
              onContextMenu={(event) => {
                event.preventDefault();
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
        {placement?.angleMeasurement && (
          <AngleMeasurementOverlay
            measurement={placement.angleMeasurement}
            aim={resolvedHover?.point ?? null}
            pixelsPerMetre={camera.pixelsPerMetre}
          />
        )}
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
        {drawing &&
          draftFill &&
          (draftPoints.length >= 2 || constructedContour.length >= 3) &&
          (() => {
            const points = draftContour
              ? constructedContour
              : [...draftPoints, ...(resolvedHover ? [resolvedHover.point] : [])];
            return (
              <g pointerEvents="none">
                <polygon
                  points={points.map((p) => `${p.x},${-p.y}`).join(" ")}
                  fill={draftPattern ? "transparent" : draftFill.color}
                  fillOpacity={draftFill.opacity}
                  stroke="var(--primary)"
                  strokeWidth={1}
                  strokeDasharray="5 4"
                  vectorEffect="non-scaling-stroke"
                />
                {draftPattern && points.length >= 3 && (
                  <HatchPattern
                    hatch={{
                      points,
                      fill: draftFill,
                      pattern: {
                        patternId: draftPattern.id,
                        ...(draftPatternRotation === undefined
                          ? {}
                          : { rotation: draftPatternRotation }),
                        ...(draftPatternSize ?? { mode: "model" as const }),
                        origin: {
                          x: Math.min(...points.map((p) => p.x)),
                          y: Math.min(...points.map((p) => p.y)),
                        },
                      },
                    }}
                    context={scaleContext}
                    definition={draftPattern}
                    pixelsPerMetre={camera.pixelsPerMetre}
                  />
                )}
              </g>
            );
          })()}
        {selection?.kind === "line" &&
          onLineLength &&
          !drawing &&
          !editSession &&
          (() => {
            const line = (storeyOf(project).lines ?? []).find((l) => l.id === selection.id);
            if (!line) return null;
            // The segment nearest to the click that selected the line; the first without one.
            const distance = (a: Point, b: Point, p: Point) => {
              const dx = b.x - a.x,
                dy = b.y - a.y;
              const t = Math.max(
                0,
                Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)),
              );
              return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
            };
            let segment = 0;
            if (selectionAnchor)
              line.points.slice(1).forEach((b, i) => {
                const a = line.points[i]!;
                const best = line.points[segment + 1]!;
                if (
                  distance(a, b, selectionAnchor) <
                  distance(line.points[segment]!, best, selectionAnchor)
                )
                  segment = i;
              });
            const a = line.points[segment]!,
              b = line.points[segment + 1]!;
            if (Math.hypot(b.x - a.x, b.y - a.y) < 1e-9) return null;
            return (
              <LineLengthHelper
                key={`${line.id}:${segment}`}
                start={a}
                end={b}
                pixelsPerMetre={camera.pixelsPerMetre}
                onLength={(length, direction) => onLineLength(line.id, segment, length, direction)}
              />
            );
          })()}
        {sections?.map((stored) => {
          const section =
            sectionPreview?.id === stored.id ? { ...stored, ...sectionPreview } : stored;
          const chosen = selectedSectionId === section.id && !drawing && !editSession;
          return (
            <g key={section.id} aria-label={`Schnitt ${section.mark}-${section.mark}`}>
              <SectionPlanGraphic
                section={section}
                pixelsPerMetre={camera.pixelsPerMetre}
                height={sectionSymbolHeight(section.symbolSize, scaleContext.denominator)}
                color={chosen ? "#0284c7" : "var(--foreground)"}
                pick={!!onSectionSettings}
              />
              {chosen &&
                (["start", "end", "move"] as const).map((grip) => {
                  const point = sectionGripPoint(section, grip);
                  return (
                    <circle
                      key={grip}
                      data-section-grip={grip}
                      cx={point.x}
                      cy={-point.y}
                      r={5 / camera.pixelsPerMetre}
                      fill="white"
                      stroke="#0284c7"
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                      role="button"
                      aria-label={
                        grip === "move"
                          ? `Schnitt ${section.mark}-${section.mark} verschieben`
                          : `Schnitt ${section.mark}-${section.mark} ${grip === "start" ? "Anfang" : "Ende"} ziehen`
                      }
                      className={grip === "move" ? "cursor-move" : "cursor-pointer"}
                      onPointerDown={(event) => {
                        if (event.button !== 0 || pan || !interactive || !onSectionLine) return;
                        if (!svg.current) return;
                        event.preventDefault();
                        event.stopPropagation();
                        svg.current.focus();
                        gripClick.current = false;
                        navigationClick.current = false;
                        sectionDrag.current = {
                          id: stored.id,
                          grip,
                          pointerId: event.pointerId,
                          line: { start: stored.start, end: stored.end },
                        };
                        svg.current.setPointerCapture(event.pointerId);
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      <title>
                        {grip === "move"
                          ? "Ziehen verschiebt die Schnittlinie"
                          : "Ziehen verlängert, kürzt oder dreht die Linie · Shift: nur Länge"}
                      </title>
                    </circle>
                  );
                })}
            </g>
          );
        })}
        {drawing &&
          sectionDraft &&
          (() => {
            const aim = resolvedHover?.point;
            const end = sectionDraft.end ?? aim;
            if (
              !end ||
              Math.hypot(end.x - sectionDraft.start.x, end.y - sectionDraft.start.y) < 1e-6
            )
              return null;
            const look =
              sectionDraft.end && aim
                ? sectionLookTo(sectionDraft.start, sectionDraft.end, aim)
                : "left";
            return (
              <g aria-label="Schnitt in Arbeit" opacity={0.85}>
                <SectionPlanGraphic
                  section={{
                    start: sectionDraft.start,
                    end,
                    look,
                    mark: sectionDraft.mark,
                    ...(sectionDraft.kind ? { kind: sectionDraft.kind } : {}),
                  }}
                  pixelsPerMetre={camera.pixelsPerMetre}
                  height={sectionSymbolHeight(sectionDraft.symbolSize, scaleContext.denominator)}
                  color="#0284c7"
                />
              </g>
            );
          })()}
        {drawing && textPreview && (
          <g aria-label="Text in Arbeit" opacity={0.85}>
            <TextGraphic
              text={textPreview}
              denominator={scaleContext.denominator}
              pixelsPerMetre={camera.pixelsPerMetre}
            />
          </g>
        )}
        {drawing &&
          stairDraft &&
          (() => {
            const aim = resolvedHover?.point;
            const direction =
              stairDraft.direction ?? (aim ? stairDirectionTo(stairDraft.start, aim) : null) ?? 0;
            const turn =
              stairDraft.direction !== null && aim
                ? stairTurnTo(stairDraft.start, direction, aim)
                : stairDraft.values.turn;
            const g = stairGeometry(stairDraft.values, stairDraft.storeyHeight);
            if (!g) return null;
            const stair = { ...stairDraft.values, turn, start: stairDraft.start, direction };
            return (
              <g aria-label="Treppe in Arbeit" opacity={0.85}>
                <StairPlanGraphic
                  plan={stairPlan(stair, g, 1 - stairDraft.values.baseOffset)}
                  pixelsPerMetre={camera.pixelsPerMetre}
                  color="#0284c7"
                  width={1.5}
                />
              </g>
            );
          })()}
        {drawing && dimensionDraft && (
          <g pointerEvents="none" aria-label="Maßkette in Arbeit">
            {dimensionDraft.line && (
              <DimensionGraphic
                orientation={dimensionDraft.orientation}
                offset={(() => {
                  const line =
                    dimensionDraft.mode === "line" && resolvedHover
                      ? resolvedHover.point
                      : dimensionDraft.line;
                  return dimensionDraft.orientation === "horizontal" ? line.y : line.x;
                })()}
                points={[
                  ...dimensionDraft.points,
                  ...(resolvedHover && !dimensionDraft.mode ? [resolvedHover.point] : []),
                  ...(resolvedHover && dimensionDraft.mode === "add" ? [resolvedHover.point] : []),
                ]}
                denominator={scaleContext.denominator}
                pixelsPerMetre={camera.pixelsPerMetre}
                color="#0284c7"
                terminator={dimensionDraft.style?.terminator}
                units={dimensionDraft.style?.units}
                textSize={dimensionDraft.style?.textSize}
              />
            )}
            {(() => {
              // The dimension line position: a dashed guide through the first click.
              const p =
                dimensionDraft.mode === "line"
                  ? (resolvedHover?.point ?? dimensionDraft.line)
                  : (dimensionDraft.line ?? resolvedHover?.point);
              if (!p) return null;
              const far = 1e4;
              return dimensionDraft.orientation === "horizontal" ? (
                <line
                  x1={p.x - far}
                  y1={-p.y}
                  x2={p.x + far}
                  y2={-p.y}
                  stroke="#0284c7"
                  strokeOpacity={0.5}
                  strokeWidth={1 / camera.pixelsPerMetre}
                  strokeDasharray={`${6 / camera.pixelsPerMetre} ${4 / camera.pixelsPerMetre}`}
                />
              ) : (
                <line
                  x1={p.x}
                  y1={-p.y - far}
                  x2={p.x}
                  y2={-p.y + far}
                  stroke="#0284c7"
                  strokeOpacity={0.5}
                  strokeWidth={1 / camera.pixelsPerMetre}
                  strokeDasharray={`${6 / camera.pixelsPerMetre} ${4 / camera.pixelsPerMetre}`}
                />
              );
            })()}
            {dimensionDraft.points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={-p.y}
                r={(dimensionDraft.mode === "remove" ? 5 : 3) / camera.pixelsPerMetre}
                fill={dimensionDraft.mode === "remove" ? "#dc2626" : "#0284c7"}
              />
            ))}
          </g>
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
        {drawing &&
          roofGuide &&
          (() => {
            const { start, end } = roofGuide;
            const length = Math.hypot(end.x - start.x, end.y - start.y);
            const left = { x: -(end.y - start.y) / length, y: (end.x - start.x) / length };
            const aim = resolvedHover?.point;
            const side =
              roofGuide.rise ??
              (aim &&
              (end.x - start.x) * (aim.y - start.y) - (end.y - start.y) * (aim.x - start.x) < 0
                ? "right"
                : "left");
            const rise = side === "left" ? left : { x: -left.x, y: -left.y };
            const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
            const tip = {
              x: mid.x + (rise.x * 48) / camera.pixelsPerMetre,
              y: mid.y + (rise.y * 48) / camera.pixelsPerMetre,
            };
            return (
              <g pointerEvents="none" aria-label="Bezugslinie und Steigrichtung">
                <line
                  x1={start.x}
                  y1={-start.y}
                  x2={end.x}
                  y2={-end.y}
                  stroke="#0284c7"
                  strokeWidth={2}
                  strokeDasharray="8 3 2 3"
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={mid.x}
                  y1={-mid.y}
                  x2={tip.x}
                  y2={-tip.y}
                  stroke="#0284c7"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx={tip.x} cy={-tip.y} r={4 / camera.pixelsPerMetre} fill="#0284c7" />
                <text
                  x={tip.x}
                  y={-tip.y - 8 / camera.pixelsPerMetre}
                  fontSize={11 / camera.pixelsPerMetre}
                  fill="#0284c7"
                >
                  {roofGuide.rise ? "steigt" : "Klick: steigt hierhin"}
                </text>
              </g>
            );
          })()}
        {drawing && closeAtStart && draftPoints.length >= MIN_CLOSING_POINTS && (
          <circle
            role="img"
            aria-label="Startpunkt: Klick schließt den Umriss"
            cx={draftPoints[0]!.x}
            cy={-draftPoints[0]!.y}
            r={6 / camera.pixelsPerMetre}
            fill={
              resolvedHover && closesAtStart(draftPoints, resolvedHover.point, "polygon")
                ? "var(--primary)"
                : "var(--background)"
            }
            stroke="var(--primary)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        )}
        {overlapHint && !editError && hintPoint && (
          <text
            role="status"
            x={hintPoint.x}
            y={-hintPoint.y - 18 / camera.pixelsPerMetre}
            fontSize={12 / camera.pixelsPerMetre}
            fill="#b45309"
            pointerEvents="none"
          >
            {overlapHint}
          </text>
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
        {overlap.state && (
          <g pointerEvents="none" aria-label="Übereinanderliegende Elemente">
            {(() => {
              // Thin turquoise outline of the pre-selected element in its real shape, no fill.
              const shape = overlap.preselected && overlap.shapeOf(overlap.preselected);
              if (!shape) return null;
              const points = shape.points.map((p) => `${p.x},${-p.y}`).join(" ");
              const Outline = shape.closed === false ? "polyline" : "polygon";
              return (
                <Outline
                  aria-label="Vorauswahl"
                  points={points}
                  fill="none"
                  stroke={CAD_TURQUOISE}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })()}
            {(() => {
              // Collapsed: one short line. Expanded (after Tab): the elements with a small bar
              // in front of the pre-selection. Screen-constant size like the snap label.
              const s = 1 / camera.pixelsPerMetre;
              const { cycle, point } = overlap.state;
              const rows = cycle.expanded
                ? cycle.targets.map((t) => planElementCaption(project, t))
                : [`${cycle.targets.length} Elemente · Tab`];
              const x = point.x + 12 * s,
                y = -point.y + 12 * s,
                line = 13,
                left = cycle.expanded ? 12 : 6;
              const width = (Math.max(...rows.map((r) => r.length)) * 5.6 + left + 8) * s;
              return (
                <g aria-label={cycle.expanded ? "Tab-Auswahl" : "Hinweis mehrere Elemente"}>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={(rows.length * line + 6) * s}
                    rx={4 * s}
                    fill="var(--background)"
                    fillOpacity={0.94}
                    stroke={CAD_TURQUOISE}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                  {rows.map((row, i) => {
                    const chosen = cycle.expanded && i === cycle.index;
                    return (
                      <g key={i}>
                        {chosen && (
                          <rect
                            aria-label="Vorauswahl-Markierung"
                            x={x + 5 * s}
                            y={y + (i * line + 4.5) * s}
                            width={3 * s}
                            height={10 * s}
                            rx={1.5 * s}
                            fill={CAD_TURQUOISE}
                          />
                        )}
                        <text
                          x={x + left * s}
                          y={y + (i * line + 13) * s}
                          fontSize={10 * s}
                          fontWeight={chosen ? 600 : 400}
                          fill="var(--foreground)"
                        >
                          {row}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
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
          (selecting ||
            referenceSelection.selected ||
            (endpointSnap && snap && density.paused)) && (
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
                  const wi = storeyOf(project).walls.findIndex((w) => w.id === r.entityId);
                  const li = storeyOf(project).lines?.findIndex((l) => l.id === r.entityId) ?? -1;
                  if (referenceSelection.mode === "points")
                    return `${wi >= 0 ? `Wand ${wi + 1}` : li >= 0 ? `Linie ${li + 1}` : "Hilfsreferenz"} · ${r.kind === "midpoint" ? "Mittelpunkt" : "Punkt"} (${r.point.x.toFixed(2)}; ${r.point.y.toFixed(2)})`;
                  return wi >= 0
                    ? `Wand ${wi + 1} · Achse`
                    : `Linie ${li + 1} · Teilsegment ${Number(r.feature.match(/segment-(\d+)/)?.[1] ?? 0) + 1}`;
                }}
              />
            </foreignObject>
          )}
      </g>
    </svg>
  );
}
