import { RoomSettingsPanel, RoomToolFields } from "./RoomToolFields";
import { enclosedRoomOutline } from "@/application/rooms/enclosure";
import { nextProjectRoomNumber } from "@/application/rooms/actions";
import { isDefaultHeightLineList } from "@/domain/elements/room/height-line";
import { RoomListPanel } from "./RoomListPanel";
import { ToolSettingsWindow } from "./ToolSettingsWindow";
import { useRememberedPosition } from "./useRememberedPosition";

/** Browser storage keys of the remembered helper positions (docs/HILFSFENSTER.md). */
const DEMAND_MENU_KEY = "novikov.demand-menu.position";
const PRECISION_INPUT_KEY = "novikov.precision-input.position";
import { ELEMENT_KINDS, storeyElements } from "@/domain/elements/registry";
import { trimWallsToRoof, untrimWalls } from "@/application/walls/roof-trim";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CanvasContextMenu, type ContextMenuEntry } from "./CanvasContextMenu";
import {
  clipboardSummary,
  copySelection,
  pasteClipboard,
  type ClipboardContent,
} from "@/application/clipboard/clipboard";
import { planElementCaption } from "@/rendering/viewport/selection-shapes";
import {
  canChangeDisplayOrder,
  changeDisplayOrder,
  DISPLAY_ORDER_LABELS,
} from "@/application/elements/order";
import { RoofSettingsPanel, RoofToolFields } from "./RoofToolFields";
import type { RoofPhase } from "./roof-labels";
import { isVertexTarget } from "@/application/direct-edit/transforms";
import { resolvePathClick, type PathClosure } from "@/application/drawing/path-closure";
import { previewDeleteSelection } from "@/application/elements/delete";
import { RasterBudgetNotice } from "./RasterBudgetNotice";
import { MovementAxisControls } from "./MovementAxisControls";
import { selectWorkingStorey, workingStoreyForTarget } from "@/application/storeys/working-storey";
import { projectElementCounts } from "@/application/storeys/context";
import { storeyOf } from "../../domain/storeys/access.ts";
import { useLocalAutosave } from "./useLocalAutosave";
import { LocalRecoveryStatus } from "./LocalRecoveryStatus";
import { DocumentLayerNotice } from "./DocumentLayerNotice";
import { RecoveryPanel } from "./RecoveryPanel";
import { RecoveryStartupNotice } from "./RecoveryStartupNotice";
import { ensureDocumentFolder } from "@/application/views/documents";
import type { DocumentFraming } from "@/domain/views/documents";
import { documentVisibilityKey } from "@/application/layers/visibility-actions";
import { resolveWorkingView, resolveDocumentView } from "@/application/views/working-context";
import { CadAppearanceProvider } from "./CadAppearanceProvider";
import { PenSetManager } from "./PenSetManager";
import { defaultPenSet } from "@/domain/pens/model";
import { assignPenSet } from "@/application/pens/library";
import { WallDrawingFields } from "./WallDrawingFields";
import { WallRenovationFields } from "./WallRenovationFields";
import { ColumnFields } from "./ColumnFields";
import { DimensionToolFields } from "./DimensionToolFields";
import { TextFields } from "./TextFields";
import { TextEditorOverlay } from "./TextEditorOverlay";
import { addText } from "@/application/texts/actions";
import { planDenominator } from "@/domain/views/scale";
import { addDimension, updateDimension } from "@/application/dimensions/actions";
import { dimensionPointAt } from "@/domain/elements/dimension/model";
import { addColumn, updateColumn } from "@/application/columns/actions";
import { columnValues } from "@/application/columns/defaults";
import { addStair, updateStair } from "@/application/stairs/actions";
import { stairValues } from "@/application/stairs/defaults";
import { stairDirectionTo, stairTurnTo } from "@/domain/elements/stair/model";
import { StairFields } from "./StairFields";
import { wallRenovation } from "@/domain/elements/wall/renovation";
import { setWallRenovation } from "@/application/walls/renovation";
import { useProjectEditing } from "./useProjectEditing";
import { useToolDefaults } from "./useToolDefaults";
import { pickupToolDefaults } from "@/application/tools/pickup";
import { rectangleContour, prepareHatchBoundaries } from "@/application/hatches/construction";
import type { HatchConstruction } from "@/application/hatches/construction";
import { useMeasurement } from "./useMeasurement";
import type { MeasurementMode } from "./useMeasurement";
import { editAnchor } from "@/application/direct-edit/session";
import { propertyFormKey } from "./property-form-key";
import { ReferenceCalibrationControls } from "./ReferenceCalibrationControls";
import { useReferenceCalibration } from "./useReferenceCalibration";
import { useImageImport } from "./useImageImport";
import { WindowPlacementFields } from "./WindowPlacementFields";
import { useWindowPlacement } from "./useWindowPlacement";
import { useDoorPlacement } from "./useDoorPlacement";
import { SlabToolFields } from "./SlabToolFields";
import { DoorPlacementFields } from "./DoorPlacementFields";
import { useSelectionMove } from "./useSelectionMove";
import { useElementSelection } from "./useElementSelection";
import { selectionIndex, selectTargets, type SelectionSet } from "@/application/selection/state";
import type { SnapCandidate } from "@/constraints/snapping/engine";
import { CanvasDisplaySettings } from "./CanvasDisplaySettings";
import { useCanvasDisplaySettings } from "./useCanvasDisplaySettings";
import { beginWallChain, appendWallChain, finishWallChain } from "@/application/drawing/wall-chain";
import type { WallChain } from "@/application/drawing/wall-chain";
import { defaultGridSettings } from "@/application/snapping/grid-settings";
import {
  HatchFillFields,
  HatchPaintFields,
  HatchPatternFields,
  HatchRotationField,
  HatchSizeFields,
} from "./HatchControls";
import { selectedLayerElement } from "@/application/layers/selection";
import { visibleLayerTarget } from "@/application/layers/visibility";
import type { LayerVisibilityContext } from "@/application/layers/visibility";
import { useReferenceSelection } from "./useReferenceSelection";
import { DEFAULT_HOVER_DWELL_MS } from "@/constraints/inference/hover-reference";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PALETTE_GAP, PROPERTIES_HEIGHT, paletteInsets } from "./palette-layout";
import { useNavigatorWidth } from "./useNavigatorWidth";
import { AiCommandBar } from "./AiCommandBar";
import { InteractionInput } from "./InteractionInput";
import { useToolInteraction } from "./useToolInteraction";
import {
  editInteraction,
  editMovementAxis,
  drawingInteraction,
  wallStartSnapPolicy,
} from "@/application/tools/adapters";
import { DemandMenu } from "./DemandMenu";
import { BimInspector } from "./BimInspector";
import { supportsHorizontalWorkplaneEdit } from "@/application/direct-edit/controller";
import { createDrawing } from "@/application/drawing/actions";
import type { EditAction } from "@/application/direct-edit/session";
import { SECTIONS_FOLDER_ID, ProjectNavigator } from "./ProjectNavigator";
import { StatusBar } from "./StatusBar";
import { ToolRail } from "./ToolRail";
import { LineStyleCreator } from "./LineStyleCreator";
import { HatchPatternCreator } from "./HatchPatternCreator";
import { TopToolbar } from "./TopToolbar";
import { ViewportManager } from "./CadViewport";
import { CornerPreviewDialog } from "./CornerPreviewDialog";
import { prepareProjectOpen, requestProjectDownload } from "@/application/project-files/operations";
import { browserProjectDownload } from "@/interop/project-file/browser-download";
import { FloatingPanel } from "./FloatingPanel";
import { exportIfc } from "@/lib/bim/ifc";
import { applySelectionCommand } from "@/application/commands/selection-command";
import type { Point, Project } from "@/domain/project/schema";
import { createStartProject } from "./bim-view";
import type { Selection } from "./bim-view";
import type { ToolId, ViewMode, ViewportLayout } from "./cad-types";
import { LineStyleFields } from "./LineControls";
import { LayerProperties } from "./LayerProperties";
import { LayerManager } from "./LayerManager";
import { CanvasTabs } from "./CanvasTabs";
import {
  canvasModeOf,
  canvasViewOf,
  closeCanvasTab,
  existingCanvasTabs,
  sectionTab,
  tabSectionId,
  withCanvasTab,
  type CanvasView,
} from "@/application/views/canvas-tabs";
import {
  SECTION_TOOL_DEFAULTS,
  addSection,
  nextSectionLabel,
  removeSection,
  updateSection,
} from "@/application/sections/actions";
import { sectionLookTo } from "@/domain/views/sections";
import { SectionFields } from "./SectionFields";
import { SectionProperties } from "./SectionProperties";
import { SectionDrawingView } from "./SectionDrawingView";

export function CadWorkspace({
  layerVisibility,
  initialProject,
}: { layerVisibility?: LayerVisibilityContext; initialProject?: Project } = {}) {
  const capturedPlan = useRef<DocumentFraming | null>(null);
  const onPlanCapture = useCallback((frame: DocumentFraming | null) => {
    capturedPlan.current = frame;
  }, []);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const getPlanCapture = useCallback(() => {
    if (activeDocumentId || !capturedPlan.current) return null;
    const canvas = document
      .querySelector('[aria-label="BIM floor plan"]')
      ?.closest('[aria-label$=" viewport"]');
    if (
      canvas instanceof HTMLElement &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      canvas.animate(
        [
          { boxShadow: "inset 0 0 0 3px rgba(45, 212, 191, 0)", backgroundColor: "transparent" },
          {
            boxShadow: "inset 0 0 0 3px rgba(45, 212, 191, 0.85)",
            backgroundColor: "rgba(45, 212, 191, 0.12)",
          },
          { boxShadow: "inset 0 0 0 3px rgba(45, 212, 191, 0)", backgroundColor: "transparent" },
        ],
        { duration: 700, easing: "ease-out" },
      );
    return capturedPlan.current;
  }, [activeDocumentId]);
  const [penSetsOpen, setPenSetsOpen] = useState(false);
  const [lineCreatorOpen, setLineCreatorOpen] = useState(false);
  const [hatchLibraryOpen, setHatchLibraryOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [roomListOpen, setRoomListOpen] = useState(false);
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>("distance");
  const [tool, setTool] = useState<ToolId>("select");
  const [mode, setMode] = useState<ViewMode>("2D");
  // Canvas tabs (docs/SCHNITT.md, SC1): the active tab is the current mode; a mode without a
  // tab opens one, wherever the mode is switched.
  const [canvasTabs, setCanvasTabs] = useState<CanvasView[]>(["plan"]);
  // A section tab over the model views (docs/SCHNITT.md, SC2); null: the mode's view.
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  // Section tool: start, then end; click 3 chooses the viewing side. Session state only.
  const [sectionStart, setSectionStart] = useState<Point | null>(null);
  const [sectionEnd, setSectionEnd] = useState<Point | null>(null);
  const [sectionDefaults, setSectionDefaults] = useState(SECTION_TOOL_DEFAULTS);
  const [sectionWindow, setSectionWindow] = useState<string | null>(null);
  const [layout, setLayout] = useState<ViewportLayout>("single");
  const [zoomSlot, setZoomSlot] = useState<HTMLDivElement | null>(null);
  const [grid, setGrid] = useState(true);
  const [snap, setSnap] = useState(true);
  const [displaySettingsOpen, setDisplaySettingsOpen] = useState(false);
  const { wallWidth, setWallWidth, cutFill, setCutFill, showRenovation, setShowRenovation } =
    useCanvasDisplaySettings();
  const [gridSettings, setGridSettings] = useState(defaultGridSettings);
  const [ortho, setOrtho] = useState(false);
  const [hoverDwellMs, setHoverDwellMs] = useState(DEFAULT_HOVER_DWELL_MS);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(true);
  const [cornerWall, setCornerWall] = useState<string | null>(null);
  const [editing, dispatchEditing] = useProjectEditing(
    () => ensureDocumentFolder(initialProject ?? createStartProject()),
    activeDocumentId,
  );
  const { history, session: pendingSession } = editing;
  const layerActivation = editing.documentLayerActivation;
  const project = history.present;
  const autosave = useLocalAutosave(project, editing.projectLoad ?? project.id);
  const activeDocument = project.drawingDocuments?.find((d) => d.id === activeDocumentId);
  const viewContext = useMemo(
    () =>
      activeDocument
        ? resolveDocumentView(project, {
            kind: "drawing-document",
            projectId: project.id,
            documentId: activeDocument.id,
          })
        : resolveWorkingView(project, undefined, layerVisibility),
    [project, layerVisibility, activeDocument],
  );
  const visibility = viewContext.visibility;
  const visibilityHistory = activeDocumentId
    ? editing.documentVisibilityHistories?.[documentVisibilityKey(project, activeDocumentId)]
    : editing.visibilityHistory;
  const visibilityScope = activeDocumentId
    ? { kind: "drawing-document" as const, documentId: activeDocumentId }
    : { kind: "bim-project" as const };
  const visibilityNow = useRef({ project, visibility });
  visibilityNow.current = { project, visibility };
  const editSession =
    pendingSession && visibleLayerTarget(project, visibility, pendingSession.target)
      ? pendingSession
      : null;
  useEffect(() => {
    if (pendingSession && !editSession) dispatchEditing({ type: "cancel" });
  }, [pendingSession, editSession, dispatchEditing]);
  const imageInput = useRef<HTMLInputElement>(null);
  const cancelMeasurement = useRef<() => void>(() => {});
  const cancelCalibration = useRef<() => void>(() => {});
  const cancelImage = useRef<() => void>(() => {});
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<{ project: Project; name: string } | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const {
    targets: selections,
    selection,
    choose,
    setSelection,
    selectCommitted,
  } = useElementSelection(project, visibility);
  const groupMove = useSelectionMove(project, selections, visibility, (next) =>
    dispatchEditing({ type: "project", project: next }),
  );
  const cancelGroup = useRef(groupMove.cancel);
  cancelGroup.current = groupMove.cancel;
  const selectedLayerId = selectedLayerElement(project, selection)?.layerId;
  const currentSelection = useRef(selection);
  currentSelection.current = selection;
  const [wallChain, setWallChain] = useState<WallChain | null>(null);
  const activeChain = wallChain?.base === project ? wallChain : null;
  const wallStart = activeChain?.points.at(-1) ?? null;
  const [pathPoints, setPathPoints] = useState<Point[]>([]);
  const [lineKind, setLineKind] = useState<"line" | "polyline">("line");
  const [drawingBase, setDrawingBase] = useState<Project | null>(null);
  // Roof tool (docs/ROOF_ELEMENT.md, D3): reference line, rise side by click, then the outline.
  const [roofLine, setRoofLine] = useState<{ start: Point; end: Point } | null>(null);
  const [roofRise, setRoofRise] = useState<"left" | "right" | null>(null);
  const roofPhase: RoofPhase | null =
    tool === "roof" ? (!roofLine ? "line" : !roofRise ? "side" : "outline") : null;
  // Room tool (docs/ROOM_ELEMENT.md, R2): own construction, by default a click between walls.
  const [roomConstruction, setRoomConstruction] = useState<HatchConstruction | "walls">("walls");
  const roomByWalls = tool === "room" && roomConstruction === "walls";
  // Hatch, slab, roof and room share the outline construction (polygon, rectangle, contour).
  const areaTool =
    tool === "hatch" ||
    tool === "slab" ||
    roofPhase === "outline" ||
    (tool === "room" && !roomByWalls);
  const pathDrawing = tool === "line" || areaTool || roofPhase === "line";
  const [hatchConstruction, setHatchConstruction] = useState<HatchConstruction>("polygon");
  const construction: HatchConstruction =
    tool === "room" && roomConstruction !== "walls" ? roomConstruction : hatchConstruction;
  const findHatchBoundary = useMemo(
    () =>
      areaTool && construction === "boundary" ? prepareHatchBoundaries(project, visibility) : null,
    [areaTool, construction, project, visibility],
  );
  const toolDefaults = useToolDefaults(project);
  const hatchFill = toolDefaults.hatch.fill;
  // Regel 3 (docs/POLYGON_REGELN.md): each click-by-click tool declares how it closes.
  const pathClosure: PathClosure = areaTool
    ? construction === "polygon"
      ? "polygon"
      : "none"
    : tool === "line" && lineKind === "polyline"
      ? "polyline"
      : "none";
  const pathOrigin = pathDrawing ? (pathPoints.at(-1) ?? null) : null;
  const drawingOrigin = tool === "wall" ? wallStart : pathOrigin;
  const [activeViewport, setActiveViewport] = useState(0);
  const [referenceEpoch, setReferenceEpoch] = useState(0);
  const referenceScope = useMemo(
    () => ({
      project,
      visibility,
      editSession,
      tool,
      lineKind,
      mode,
      layout,
      referenceEpoch,
      activeViewport,
    }),
    [
      project,
      visibility,
      editSession,
      tool,
      lineKind,
      mode,
      layout,
      referenceEpoch,
      activeViewport,
    ],
  );
  const referenceSelection = useReferenceSelection(project, referenceScope, visibility);
  const lineAppearance = toolDefaults.line;
  const [modelError, setModelError] = useState("");
  const [exportingIfc, setExportingIfc] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const [notice, setNotice] = useState("Ready");
  const [fullscreen, setFullscreen] = useState(false);
  // Text being typed at its insertion point (docs/TEXT.md); session state only.
  const [textDraft, setTextDraft] = useState<{
    position: Point;
    screen: Point;
    content: string;
  } | null>(null);
  // Running dimension chain (docs/MASSKETTE.md); session state, never model history.
  const [dimensionDraft, setDimensionDraft] = useState<{
    line: Point | null;
    points: Point[];
    lastAt: number;
    /** Editing an existing chain (docs/MASSKETTE.md, M2–M4) instead of drawing a new one. */
    edit?: {
      id: string;
      mode: "add" | "remove" | "line";
      orientation: "horizontal" | "vertical";
      count: number;
    };
  } | null>(null);
  // Stair tool (docs/TREPPE.md, TR2): first click on the drawing axis; session state only.
  const [stairStart, setStairStart] = useState<Point | null>(null);
  // L and U: run direction fixed by click 2; click 3 chooses the side of the turn (TR3).
  const [stairDirection, setStairDirection] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { navigatorWidth, setNavigatorWidth } = useNavigatorWidth();
  const railShown = !fullscreen || !!activeDocumentId;
  const navigatorShown = navigatorOpen && !fullscreen;
  const insets = paletteInsets({
    rail: railShown,
    railCollapsed,
    navigator: navigatorShown,
    navigatorWidth,
  });
  const [demandOpen, setDemandOpen] = useState(false);
  const [pickedPoint, setPickedPoint] = useState<{
    index: number | null;
    anchor: Point | null;
    edgeIndex?: number | null;
  }>({
    index: null,
    anchor: null,
  });
  const propertiesRef = useRef<HTMLElement>(null);
  const [demandPosition, setDemandPosition] = useState<Point>({ x: 160, y: 180 });
  const lastPointer = useRef<Point>({ x: 144, y: 164 });

  const cancelInteraction = useCallback(() => {
    cancelMeasurement.current();
    cancelGroup.current();
    cancelImage.current();
    cancelCalibration.current();
    setReferenceEpoch((value) => value + 1);
    dispatchEditing({ type: "cancel" });
    setWallChain(null);
    setPathPoints([]);
    setRoofLine(null);
    setRoofRise(null);
    setDimensionDraft(null);
    setTextDraft(null);
    setStairStart(null);
    setStairDirection(null);
    setSectionStart(null);
    setSectionEnd(null);
  }, [dispatchEditing]);

  const navigateHistory = useCallback(
    (direction: "undo" | "redo") => {
      cancelInteraction();
      dispatchEditing({ type: direction });
      setSelection(null);
      setDemandOpen(false);
      setTool("select");
      setModelError("");
      setExportMessage("");
    },
    [cancelInteraction, setSelection, dispatchEditing],
  );

  useEffect(() => {
    // The next gesture must anchor to the updated model, not the previous click.
    setPickedPoint({ index: null, anchor: null });
  }, [project]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (referenceSelection.selecting) return;
      if (
        event.target instanceof Element &&
        (event.target.closest(
          'input, textarea, select, [contenteditable=true], [role="dialog"], [role="alertdialog"]',
        ) ||
          event.altKey)
      )
        return;
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        if (key === "z" || key === "y") {
          event.preventDefault();
          if (!event.repeat) navigateHistory(key === "y" || event.shiftKey ? "redo" : "undo");
        } else if ((key === "c" || key === "x" || key === "v") && !event.repeat) {
          if (clipboardShortcut.current?.(key)) event.preventDefault();
        }
        return;
      }
      const map: Record<string, ToolId> = {
        v: "select",
        w: "wall",
        s: "slab",
        l: "line",
        h: "hatch",
        t: "door",
      };
      const next = map[event.key.toLowerCase()];
      if (next) {
        cancelInteraction();
        setTool(next);
        if (
          next === "window" ||
          next === "door" ||
          next === "line" ||
          next === "hatch" ||
          next === "slab" ||
          next === "roof" ||
          next === "room"
        )
          setSelection(null);
        setModelError("");
        if (
          next === "window" ||
          next === "door" ||
          next === "wall" ||
          next === "line" ||
          next === "hatch" ||
          next === "slab" ||
          next === "roof" ||
          next === "room"
        )
          setMode("2D");
      }
      if ((event.key === "Delete" || event.key === "Backspace") && deleteShortcut.current) {
        event.preventDefault();
        if (!event.repeat) deleteShortcut.current();
        return;
      }
      if (event.key === "Escape") {
        cancelInteraction();
        setDemandOpen(false);
        setTool("select");
        setModelError("");
        if (fullscreen) setFullscreen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    fullscreen,
    cancelInteraction,
    referenceSelection.selecting,
    navigateHistory,
    setSelection,
    activeDocumentId,
  ]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    if (media.matches) {
      setNavigatorOpen(false);
      setRailCollapsed(true);
    }
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice("Ready"), 1800);
  };

  const selectTool = (next: ToolId) => {
    cancelInteraction();
    setActiveSectionId(null);
    setTool(next);
    if (next === "window" || next === "door" || next === "measure") setDemandOpen(false);
    if (
      next === "window" ||
      next === "door" ||
      next === "line" ||
      next === "hatch" ||
      next === "slab" ||
      next === "roof" ||
      next === "room" ||
      next === "column" ||
      next === "stair" ||
      next === "section" ||
      next === "dimension" ||
      next === "text"
    )
      setSelection(null);
    setModelError("");
    if (
      next === "measure" ||
      next === "window" ||
      next === "door" ||
      next === "wall" ||
      next === "line" ||
      next === "hatch" ||
      next === "slab" ||
      next === "roof" ||
      next === "room" ||
      next === "column" ||
      next === "stair" ||
      next === "section" ||
      next === "dimension" ||
      next === "text"
    )
      setMode("2D");
  };

  const showSelection = useCallback(
    (next: Selection, anchor?: Point, index?: number, modelPoint?: Point, edgeIndex?: number) => {
      cancelInteraction();
      setPickedPoint({
        index: index ?? null,
        anchor: modelPoint ?? null,
        edgeIndex: edgeIndex ?? null,
      });
      setDemandOpen(Boolean(next));
      if (next && (anchor || next.id !== selection?.id)) {
        const point = anchor ?? lastPointer.current;
        setDemandPosition({ x: point.x + 16, y: point.y + 16 });
      }
      setSelection(next);
      setTool("select");
      setModelError("");
    },
    [cancelInteraction, selection?.id, setSelection],
  );

  const handledProjectLoad = useRef(editing.projectLoad);
  useEffect(() => {
    if (handledProjectLoad.current === editing.projectLoad) return;
    handledProjectLoad.current = editing.projectLoad;
    if (!editing.projectLoad?.accepted) return;
    setActiveDocumentId(null);
    showSelection(null);
    setExportMessage("Projektdatei geladen.");
    setPendingFile(null);
  }, [editing.projectLoad, showSelection]);

  const toggleSelection = (target: NonNullable<Selection>) => {
    const next = selectTargets(selections, [target], "toggle");
    const remaining = next.length === 1 ? next[0]! : null;
    const owner = remaining ? workingStoreyForTarget(project, remaining) : null;
    if (remaining && owner && owner !== storeyOf(project).id) {
      const active = selectWorkingStorey(project, project, owner);
      setActiveDocumentId(null);
      dispatchEditing({ type: "working-storey", base: project, storeyId: owner });
      selectCommitted(active, remaining);
    } else choose(next);
  };

  const selectElement = (
    next: Selection,
    anchor?: Point,
    index?: number,
    modelPoint?: Point,
    edgeIndex?: number,
    toggle = false,
  ) => {
    if (
      next &&
      !visibleLayerTarget(visibilityNow.current.project, visibilityNow.current.visibility, next)
    )
      return;
    const targetStorey = next ? workingStoreyForTarget(project, next) : null;
    if (next && targetStorey && targetStorey !== storeyOf(project).id) {
      if (toggle) {
        cancelInteraction();
        toggleSelection(next);
        setDemandOpen(true);
        setPickedPoint({ index: null, anchor: null, edgeIndex: null });
        const point = anchor ?? lastPointer.current;
        setDemandPosition({ x: point.x + 16, y: point.y + 16 });
        setTool("select");
        return;
      }
      try {
        const active = selectWorkingStorey(project, project, targetStorey);
        cancelInteraction();
        setActiveDocumentId(null);
        dispatchEditing({ type: "working-storey", base: project, storeyId: targetStorey });
        selectCommitted(active, next);
        setPickedPoint({
          index: index ?? null,
          anchor: modelPoint ?? null,
          edgeIndex: edgeIndex ?? null,
        });
        setDemandOpen(true);
        const point = anchor ?? lastPointer.current;
        setDemandPosition({ x: point.x + 16, y: point.y + 16 });
        setTool("select");
        setModelError("");
      } catch (error) {
        setModelError(error instanceof Error ? error.message : "Geschoss nicht verfügbar.");
      }
      return;
    }
    if (toggle && next) {
      cancelInteraction();
      toggleSelection(next);
      setDemandOpen(true);
      const point = anchor ?? lastPointer.current;
      setDemandPosition({ x: point.x + 16, y: point.y + 16 });
      setPickedPoint({ index: null, anchor: null, edgeIndex: null });
      setTool("select");
    } else showSelection(next, anchor, index, modelPoint, edgeIndex);
  };

  const selectMany = (targets: SelectionSet) => {
    cancelInteraction();
    choose(targets);
    setDemandOpen(targets.length > 0);
    setDemandPosition({ x: lastPointer.current.x + 16, y: lastPointer.current.y + 16 });
    setPickedPoint({ index: null, anchor: null, edgeIndex: null });
    setTool("select");
  };
  const startEdit = (action: EditAction) => {
    setDemandOpen(false);
    if (!selection || selection.kind === "reference") return;
    const inSolid = mode === "3D" && activeViewport === 0;
    // Slabs and roofs: outline edited in the plan, moved as a whole (SLAB_/ROOF_ELEMENT.md).
    // Columns move as a whole too (docs/STUETZEN.md, P3).
    const area =
      selection.kind === "slab" ||
      selection.kind === "roof" ||
      selection.kind === "room" ||
      selection.kind === "column" ||
      selection.kind === "stair" ||
      selection.kind === "dimension" ||
      selection.kind === "text";
    const solidMove =
      inSolid && !area && supportsHorizontalWorkplaneEdit(selection, action, pickedPoint.index);
    if (
      (action === "move" && (selection.kind === "wall" || area)) ||
      (!inSolid && area && (action === "x" || action === "y")) ||
      (!inSolid &&
        (selection.kind === "line" || selection.kind === "hatch") &&
        (action === "move" || action === "x" || action === "y" || action === "axis"))
    ) {
      const origin =
        pickedPoint.anchor ??
        (selection.kind === "slab"
          ? storeyOf(project).slabs!.find((slab) => slab.id === selection.id)!.points[0]!
          : selection.kind === "roof"
            ? storeyOf(project).roofs!.find((roof) => roof.id === selection.id)!.points[0]!
            : selection.kind === "room"
              ? storeyOf(project).rooms!.find((room) => room.id === selection.id)!.points[0]!
              : selection.kind === "column"
                ? storeyOf(project).columns!.find((c) => c.id === selection.id)!.position
                : selection.kind === "stair"
                  ? storeyOf(project).stairs!.find((s) => s.id === selection.id)!.start
                  : selection.kind === "dimension"
                    ? storeyOf(project).dimensions!.find((d) => d.id === selection.id)!.points[0]!
                    : selection.kind === "text"
                      ? storeyOf(project).texts!.find((t) => t.id === selection.id)!.position
                      : editAnchor(project, selection));
      cancelInteraction();
      try {
        const axis =
          action === "axis" && !area
            ? editMovementAxis({
                base: project,
                target: selection,
                action,
                index: pickedPoint.index,
                anchor: origin,
              })
            : undefined;
        if (action === "axis" && !axis) throw new Error("Keine gültige Bewegungsachse verfügbar.");
        groupMove.begin(
          inSolid ? undefined : origin,
          action === "x" || action === "y" ? action : (axis ?? undefined),
        );
        if (layout === "single" && !inSolid) setMode("2D");
        setModelError("");
      } catch (error) {
        setModelError(error instanceof Error ? error.message : "Bewegung nicht möglich.");
      }
      return;
    }

    // Slab outlines are edited in the plan (docs/SLAB_ELEMENT.md, E1); in 3D the slab moves whole.
    if (area && (inSolid || action === "axis")) {
      const words = {
        slab: ["Decke", "die Decke", "Decken"],
        roof: ["Dach", "das Dach", "Dächer"],
        room: ["Raum", "der Raum", "Räume"],
        column: ["Stützen", "die Stütze", "Stützen"],
        stair: ["Treppen", "die Treppe", "Treppen"],
        dimension: ["Maßketten", "die Maßkette", "Maßketten"],
        text: ["Texte", "der Text", "Texte"],
      }[selection.kind as "slab" | "roof" | "room" | "column" | "stair" | "dimension" | "text"];
      showNotice(
        inSolid
          ? `${words[0]}umriss im Grundriss bearbeiten; in 3D wird ${words[1]} als Ganzes bewegt.`
          : `${words[2]}: Element frei bewegen oder auf X-/Y-Achse.`,
      );
      return;
    }
    // A column has no outline or point edits; it only moves as a whole (handled above).
    if (
      selection.kind === "column" ||
      selection.kind === "stair" ||
      selection.kind === "dimension" ||
      selection.kind === "text"
    )
      return;
    if (solidMove && selection.kind === "wall" && !pickedPoint.anchor) {
      showNotice("Zuerst einen sichtbaren Wandfußpunkt anklicken, dann die Bearbeitung wählen.");
      return;
    }
    if (
      inSolid &&
      selection.kind === "wall" &&
      !supportsHorizontalWorkplaneEdit(selection, action, pickedPoint.index)
    ) {
      showNotice("Zuerst einen sichtbaren Wandendpunkt oder eine untere Wandecke anklicken.");
      return;
    }
    dispatchEditing({
      type: "begin",
      target: selection,
      action,
      index:
        action === "offset"
          ? (pickedPoint.edgeIndex ?? pickedPoint.index ?? 0)
          : action === "edge" || action === "insert"
            ? (pickedPoint.edgeIndex ?? null)
            : pickedPoint.index,
      ...(pickedPoint.anchor ? { anchor: pickedPoint.anchor } : {}),
    });
    if (layout === "single" && !solidMove) setMode("2D");
    setModelError("");
  };

  // One shared delete operation for key and menu; text and voice use the command path.
  const deleteSelection = () => {
    try {
      const { result, summary } = previewDeleteSelection(project, selections, visibility);
      cancelInteraction();
      setDemandOpen(false);
      dispatchEditing({ type: "project", project: result });
      showSelection(null);
      selectCommitted(result, null);
      setModelError("");
      showNotice(summary);
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Löschen nicht möglich.");
    }
  };
  const deleteShortcut = useRef<(() => void) | null>(null);
  deleteShortcut.current =
    tool === "select" && !editSession && !groupMove.active && selections.length
      ? deleteSelection
      : null;

  // Canvas commands shared by the right-click menu, the Modify menu and the shortcuts
  // (docs/KONTEXTMENUE.md). The clipboard lives in the app only (decision X).
  const clipboard = useRef<ClipboardContent | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    target: NonNullable<Selection> | null;
  } | null>(null);
  const canEditSelection = tool === "select" && !editSession && !groupMove.active;
  const copySelected = (cut = false) => {
    try {
      const content = copySelection(project, selections);
      clipboard.current = content;
      if (cut) deleteSelection();
      showNotice(clipboardSummary(content, cut ? "ausgeschnitten" : "kopiert"));
      setModelError("");
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Kopieren nicht möglich.");
    }
  };
  const pasteFromClipboard = () => {
    const content = clipboard.current;
    if (!content) return;
    try {
      const pasted = pasteClipboard(project, content, (kind) => `${kind}-${crypto.randomUUID()}`);
      dispatchEditing({ type: "project", project: pasted.project });
      selectMany(pasted.targets);
      showNotice(clipboardSummary(content, "eingefügt"));
      setModelError("");
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Einfügen nicht möglich.");
    }
  };
  const pickupFrom = (target: NonNullable<Selection>) => {
    const defaults = pickupToolDefaults(project, visibility, target);
    if (!defaults) return setModelError("Für dieses Element gibt es keine übernehmbaren Werte.");
    toolDefaults.apply(defaults);
    selectTool(defaults.tool);
    setDemandOpen(false);
    showNotice("Parameter übernommen");
  };
  /** Tool settings of an element kind (or the active tool): its window where one exists. */
  // Settings window of every tool (docs/EINSTELLUNGSFENSTER.md): tool defaults from a double
  // click on the tool button, or exactly one element from a double click on it.
  // Exactly one settings window at a time (user decision 31.10.2026): every tool, also roof and
  // room, opens through this state, so a new window replaces the previous one.
  const [settingsWindow, setSettingsWindow] = useState<
    | { mode: "tool"; tool: ToolId; section?: string | undefined }
    | { mode: "element"; target: NonNullable<Selection> }
    | null
  >(null);
  const roofSettingsOpen = settingsWindow?.mode === "tool" && settingsWindow.tool === "roof";
  const roomSettingsOpen = settingsWindow?.mode === "tool" && settingsWindow.tool === "room";
  const roomSettingsSection = settingsWindow?.mode === "tool" ? settingsWindow.section : undefined;
  /** Tools whose defaults live in the shared settings window (E1); roof and room keep theirs. */
  const SETTINGS_TOOLS: Partial<Record<ToolId, string>> = {
    wall: "Wand",
    column: "Stütze",
    stair: "Treppe",
    section: "Schnitt",
    dimension: "Maßkette",
    text: "Text",
    window: "Fenster",
    door: "Tür",
    slab: "Decke",
    hatch: "Schraffur",
    line: "Linie",
  };
  const openToolDefaults = (owner: ToolId) => {
    if (owner === "roof" || owner === "room" || SETTINGS_TOOLS[owner])
      return setSettingsWindow({ mode: "tool", tool: owner });
    setFullscreen(false);
    propertiesRef.current?.focus();
  };
  const openElementSettings = (target: NonNullable<Selection>) => {
    // From a drawing tool: drop the point the double click just set and switch to selecting.
    if (tool !== "select") {
      cancelInteraction();
      setTool("select");
    }
    if (!selections.some((s) => s.kind === target.kind && s.id === target.id))
      selectElement(target);
    setDemandOpen(false);
    setContextMenu(null);
    setSettingsWindow({ mode: "element", target });
  };
  /** Defaults fields of wall, window and door: the same set in the bar and in the window. */
  const toolFields = (owner: ToolId, place: "bar" | "window" = "bar") =>
    owner === "wall" ? (
      <WallDrawingFields
        project={project}
        value={toolDefaults.wall}
        onChange={(values) => {
          cancelInteraction();
          toolDefaults.setWall(values);
        }}
      />
    ) : owner === "text" ? (
      <TextFields
        value={toolDefaults.text}
        onChange={toolDefaults.setText}
        layers={project.layers}
        denominator={planDenominator(project)}
      />
    ) : owner === "dimension" ? (
      <DimensionToolFields
        value={toolDefaults.dimension}
        onChange={(values) => {
          setDimensionDraft(null);
          toolDefaults.setDimension(values);
        }}
        layers={project.layers}
        step={place === "bar" && dimensionDraft?.line ? "points" : "line"}
      />
    ) : owner === "section" ? (
      <SectionFields
        value={sectionDefaults}
        onChange={setSectionDefaults}
        next={nextSectionLabel(project, sectionDefaults)}
        denominator={planDenominator(project)}
      />
    ) : owner === "stair" ? (
      <StairFields
        value={toolDefaults.stair}
        onChange={toolDefaults.setStair}
        layers={project.layers}
        storeyHeight={storeyOf(project).height ?? null}
      />
    ) : owner === "column" ? (
      <ColumnFields
        value={toolDefaults.column}
        onChange={toolDefaults.setColumn}
        layers={project.layers}
      />
    ) : owner === "window" ? (
      <WindowPlacementFields
        layers={project.layers}
        value={windowTool.dimensions}
        onChange={windowTool.setDimensions}
        error={windowTool.error}
        precision={windowTool.precision}
        onPrecision={windowTool.setPrecision}
        pickingHost={windowTool.pickingHost}
      />
    ) : owner === "door" ? (
      <DoorPlacementFields
        layers={project.layers}
        value={doorTool.dimensions}
        onChange={doorTool.setDimensions}
        error={doorTool.error}
        precision={doorTool.precision}
        onPrecision={doorTool.setPrecision}
        pickingHost={doorTool.pickingHost}
      />
    ) : owner === "slab" ? (
      <SlabToolFields
        construction={hatchConstruction}
        onConstruction={(construction) => {
          cancelInteraction();
          setHatchConstruction(construction);
        }}
        value={toolDefaults.slab}
        onChange={toolDefaults.setSlab}
      />
    ) : owner === "hatch" ? (
      <section aria-label="Schraffurwerkzeug" className="flex flex-wrap items-end gap-3">
        <label className="text-xs">
          Erstellung
          <select
            aria-label="Schraffur-Erstellung"
            value={hatchConstruction}
            onChange={(e) => {
              cancelInteraction();
              setHatchConstruction(e.target.value as HatchConstruction);
            }}
            className="block rounded border bg-background p-1"
          >
            <option value="polygon">Polygon per Klick</option>
            <option value="diagonal">Rechteck: Diagonale</option>
            <option value="side-height">Rechteck: Seite und Höhe</option>
            <option value="boundary">Geschlossene Kontur übernehmen</option>
          </select>
        </label>
        <HatchRotationField
          enabled={!!toolDefaults.hatch.patternDefinition}
          value={toolDefaults.hatch.patternRotation ?? 0}
          onChange={(patternRotation) =>
            toolDefaults.setHatch({ ...toolDefaults.hatch, patternRotation })
          }
        />
        <HatchPatternFields
          project={project}
          value={toolDefaults.hatch.patternDefinition}
          onChange={(patternDefinition) =>
            toolDefaults.setHatch({ ...toolDefaults.hatch, patternDefinition })
          }
        />
        <HatchSizeFields
          definition={toolDefaults.hatch.patternDefinition}
          value={toolDefaults.hatch.patternSize ?? { mode: "model" }}
          context={viewContext.scale}
          onChange={(patternSize) => toolDefaults.setHatch({ ...toolDefaults.hatch, patternSize })}
        />
        <HatchFillFields
          value={hatchFill}
          onChange={(fill) => toolDefaults.setHatch({ ...toolDefaults.hatch, fill })}
        />
        <HatchPaintFields
          label="Hintergrund"
          value={toolDefaults.hatch.background}
          onChange={(background) => toolDefaults.setHatch({ ...toolDefaults.hatch, background })}
        />
        <HatchPaintFields
          label="Kontur"
          value={toolDefaults.hatch.contour}
          onChange={(contour) => toolDefaults.setHatch({ ...toolDefaults.hatch, contour })}
        />
        <label className="text-xs">
          Ebene
          <select
            aria-label="Schraffur-Zielebene"
            className="block h-8 rounded border bg-background"
            value={toolDefaults.hatch.layerId}
            onChange={(e) =>
              toolDefaults.setHatch({ ...toolDefaults.hatch, layerId: e.target.value })
            }
          >
            {project.layers.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.name}
              </option>
            ))}
          </select>
        </label>
        {place === "bar" && (
          <>
            <span className="text-xs">
              {hatchConstruction === "polygon"
                ? `${pathPoints.length} Punkte · Doppelklick schließt`
                : hatchConstruction === "boundary"
                  ? "In ein geschlossenes Polygon klicken"
                  : hatchConstruction === "diagonal"
                    ? "Zwei gegenüberliegende Ecken anklicken"
                    : "Zwei Seitenpunkte, danach Höhe anklicken"}{" "}
              · Esc verwirft
            </span>
            <Button size="sm" variant="ghost" onClick={() => selectTool("select")}>
              Zeichnen abbrechen
            </Button>
          </>
        )}
      </section>
    ) : owner === "line" ? (
      <section aria-label="Linienwerkzeug" className="flex flex-wrap items-end gap-3">
        <label className="text-xs">
          Zeichenmodus
          <select
            aria-label="Zeichenmodus"
            className="block rounded border bg-background p-1"
            value={lineKind}
            onChange={(e) => {
              setLineKind(e.target.value as "line" | "polyline");
              setPathPoints([]);
              setModelError("");
            }}
          >
            <option value="line">Linie</option>
            <option value="polyline">Polylinie</option>
          </select>
        </label>
        <LineStyleFields
          value={lineAppearance}
          onChange={(appearance) => toolDefaults.setLine({ ...toolDefaults.line, ...appearance })}
        />
        <label className="text-xs">
          Ebene
          <select
            aria-label="Linien-Zielebene"
            className="block h-8 rounded border bg-background"
            value={toolDefaults.line.layerId}
            onChange={(e) =>
              toolDefaults.setLine({ ...toolDefaults.line, layerId: e.target.value })
            }
          >
            {project.layers.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Hover-Referenz
          <select
            aria-label="Hover-Verweildauer"
            className="block rounded border bg-background p-1"
            value={hoverDwellMs}
            onChange={(e) => setHoverDwellMs(Number(e.target.value))}
          >
            <option value={200}>0,2 Sekunden</option>
            <option value={400}>0,4 Sekunden</option>
            <option value={600}>0,6 Sekunden</option>
            <option value={1000}>1 Sekunde</option>
          </select>
        </label>
        {place === "bar" && (
          <>
            <span className="text-xs">{pathPoints.length} Punkte · Esc verwirft</span>
            {lineKind === "polyline" && (
              <span className="text-xs">
                Doppelklick zum Abschließen · Enter im Feld: nächster Punkt · Enter im Grundriss:
                Abschluss
              </span>
            )}
            <Button size="sm" variant="ghost" onClick={() => selectTool("select")}>
              Zeichnen abbrechen
            </Button>
          </>
        )}
      </section>
    ) : null;
  /** Right click "Werkzeugeinstellungen…": on an element its own window, else the window of
   * the active tool. */
  const openToolSettings = (target: NonNullable<Selection> | null) => {
    if (target) return openElementSettings(target);
    openToolDefaults(tool);
  };
  // Trimming walls at a roof (docs/TRIMMEN_L04B.md, L04b): walls and exactly one roof selected,
  // then confirm. Shared by the right-click menu and the Modify menu.
  const [trimConfirm, setTrimConfirm] = useState<{ wallIds: string[]; roofId: string } | null>(
    null,
  );
  const trimRequest = (): { wallIds: string[]; roofId: string } | string => {
    const walls = selections.filter((s) => s.kind === "wall");
    const roofs = selections.filter((s) => s.kind === "roof");
    if (!walls.length || roofs.length !== 1) return "Wände und genau ein Dach auswählen.";
    if (walls.length + roofs.length !== selections.length)
      return "Nur Wände und ein Dach auswählen.";
    if (!canEditSelection) return "Gerade nicht möglich.";
    return { wallIds: walls.map((w) => w.id), roofId: roofs[0]!.id };
  };
  const trimmedSelection = () => {
    const ids = new Set(selections.filter((s) => s.kind === "wall").map((s) => s.id));
    return project.storeys.flatMap((s) =>
      s.walls.filter((w) => ids.has(w.id) && w.roofTrim).map((w) => w.id),
    );
  };
  const askTrim = () => {
    const request = trimRequest();
    if (typeof request === "string") return setModelError(request);
    setTrimConfirm(request);
  };
  const confirmTrim = () => {
    const request = trimConfirm;
    setTrimConfirm(null);
    if (!request) return;
    try {
      dispatchEditing({
        type: "project",
        project: trimWallsToRoof(project, request.wallIds, request.roofId),
      });
      showNotice(
        `${request.wallIds.length} ${request.wallIds.length === 1 ? "Wand" : "Wände"} getrimmt`,
      );
      setModelError("");
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Trimmen nicht möglich.");
    }
  };
  const untrimSelected = () => {
    const ids = trimmedSelection();
    if (!ids.length) return setModelError("Keine getrimmte Wand ausgewählt.");
    try {
      dispatchEditing({ type: "project", project: untrimWalls(project, ids) });
      showNotice("Trimmung aufgehoben");
      setModelError("");
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Aufheben nicht möglich.");
    }
  };
  const contextEntries = (target: NonNullable<Selection> | null): ContextMenuEntry[] => {
    const none = selections.length === 0 ? "Keine Auswahl." : false;
    const single = target ?? (selections.length === 1 ? selections[0]! : null);
    return [
      {
        id: "cut",
        label: "Ausschneiden",
        shortcut: "Strg+X",
        disabled: none || (!canEditSelection && "Gerade nicht möglich."),
        run: () => copySelected(true),
      },
      {
        id: "copy",
        label: "Kopieren",
        shortcut: "Strg+C",
        disabled: none,
        run: () => copySelected(),
      },
      {
        id: "paste",
        label: "Einfügen",
        shortcut: "Strg+V",
        disabled: clipboard.current ? false : "Zwischenablage ist leer.",
        run: pasteFromClipboard,
      },
      {
        id: "delete",
        label: selections.length > 1 ? "Auswahl löschen" : "Löschen",
        shortcut: "Entf",
        danger: true,
        disabled: none || (!canEditSelection && "Gerade nicht möglich."),
        run: deleteSelection,
      },
      "separator",
      {
        id: "pickup",
        label: "Parameter übernehmen (Pipette)",
        disabled: single ? false : "Ein Element auswählen.",
        run: () => single && pickupFrom(single),
      },
      {
        id: "tool-settings",
        label: "Werkzeugeinstellungen…",
        run: () => openToolSettings(target),
      },
      "separator",
      (() => {
        const request = trimRequest();
        return {
          id: "trim",
          label: "Trimmen…",
          disabled: typeof request === "string" ? request : false,
          run: askTrim,
        };
      })(),
      {
        id: "untrim",
        label: "Trimmung aufheben",
        disabled: trimmedSelection().length ? false : "Keine getrimmte Wand ausgewählt.",
        run: untrimSelected,
      },
      { heading: "Darstellungsreihenfolge" },
      ...(["front", "forward", "backward", "back"] as const).map((step) => ({
        id: `order-${step}`,
        label: DISPLAY_ORDER_LABELS[step],
        disabled:
          none ||
          (!canEditSelection && "Gerade nicht möglich.") ||
          (!canChangeDisplayOrder(project, selections, step) && "Liegt schon so."),
        run: () => {
          try {
            const next = changeDisplayOrder(project, selections, step);
            if (next === project) return;
            dispatchEditing({ type: "project", project: next });
            showNotice(DISPLAY_ORDER_LABELS[step]);
            setModelError("");
          } catch (error) {
            setModelError(error instanceof Error ? error.message : "Reihenfolge nicht änderbar.");
          }
        },
      })),
    ];
  };
  const openContextMenu = (target: NonNullable<Selection> | null, x: number, y: number) => {
    // A right click on an unselected element selects it first, like a left click.
    if (target && !selections.some((s) => s.kind === target.kind && s.id === target.id))
      selectElement(target, { x, y });
    setDemandOpen(false);
    setContextMenu({ x, y, target });
  };
  const clipboardShortcut = useRef<((key: string) => boolean) | null>(null);
  clipboardShortcut.current = (key) => {
    if (key === "v" && clipboard.current && !editSession && !groupMove.active) {
      pasteFromClipboard();
      return true;
    }
    if (!canEditSelection || !selections.length) return false;
    if (key === "c") copySelected();
    else if (key === "x") copySelected(true);
    else return false;
    return true;
  };

  // On-demand menu and length/angle input remember where the user moved them, also after a
  // reload (decision P1); until then they open beside the cursor.
  const {
    pinned: pinnedDemand,
    pin: pinDemand,
    unpin: unpinDemand,
  } = useRememberedPosition(DEMAND_MENU_KEY);
  const {
    pinned: pinnedInput,
    pin: pinInput,
    unpin: unpinInput,
  } = useRememberedPosition(PRECISION_INPUT_KEY);

  const changeProject = (next: Project, selected: Selection) => {
    if (referenceSelection.selecting) return;
    dispatchEditing({ type: "project", project: next });
    showSelection(selected);
    selectCommitted(next, selected);
    showNotice("Model updated");
  };

  const saveProject = () => {
    setExportMessage("");
    try {
      requestProjectDownload(project, browserProjectDownload);
      setExportMessage(
        "Download angefordert · Speicherung auf dem Datenträger nicht bestätigt. Noch nicht übernommene Eingaben sind nicht enthalten.",
      );
      setModelError("");
    } catch {
      setModelError("Projekt konnte nicht exportiert werden. Das Modell bleibt erhalten.");
    }
  };

  const openProjectFile = async (file: File) => {
    if (readingFile) return;
    setReadingFile(true);
    setPendingFile(null);
    setExportMessage("");
    setModelError("");
    try {
      setPendingFile(await prepareProjectOpen(file));
    } catch (error) {
      setModelError(
        error instanceof Error ? error.message : "Projektdatei konnte nicht gelesen werden.",
      );
    } finally {
      setReadingFile(false);
    }
  };

  const finishPath = (points = pathPoints, base = drawingBase) => {
    try {
      const kind =
        tool === "hatch"
          ? "hatch"
          : tool === "slab"
            ? "slab"
            : tool === "roof"
              ? "roof"
              : tool === "room"
                ? "room"
                : "line";
      const id = `${kind}-${crypto.randomUUID()}`;
      changeProject(
        createDrawing(
          base!,
          project,
          id,
          tool === "hatch"
            ? { kind: "hatch", points, ...toolDefaults.hatch }
            : tool === "slab"
              ? { kind: "slab", points, ...toolDefaults.slab }
              : tool === "room"
                ? {
                    kind: "room",
                    points,
                    ...(toolDefaults.room.name.trim()
                      ? { name: toolDefaults.room.name.trim() }
                      : {}),
                    ...(toolDefaults.room.floorBuildUpEnabled
                      ? { floorBuildUp: toolDefaults.room.floorBuildUp }
                      : {}),
                    ...(isDefaultHeightLineList(toolDefaults.room.heightLines)
                      ? {}
                      : { heightLines: toolDefaults.room.heightLines }),
                    layerId: toolDefaults.room.layerId,
                  }
                : tool === "roof"
                  ? {
                      kind: "roof",
                      points,
                      referenceLine: roofLine!,
                      rise: roofRise!,
                      ...toolDefaults.roof,
                    }
                  : {
                      kind: "line",
                      lineKind,
                      points,
                      appearance: lineAppearance,
                      layerId: toolDefaults.line.layerId,
                    },
          viewContext.binding,
        ),
        { kind, id },
      );
      setRoofLine(null);
      setRoofRise(null);
    } catch (error) {
      setModelError(
        tool === "roof" || tool === "room"
          ? roofErrorMessage(error)
          : tool === "slab"
            ? "Decke prüfen: mindestens drei verschiedene Eckpunkte ohne Kreuzungen oder Überlappung; Stärke größer als null. Nach Modelländerung erneut beginnen."
            : tool === "hatch"
              ? "Schraffur prüfen: mindestens drei verschiedene Eckpunkte ohne Kreuzungen oder Überlappung; Deckkraft 0–100 %. Nach Modelländerung erneut beginnen."
              : "Linie benötigt unterschiedliche Punkte und eine Strichstärke von 0,05 bis 2 mm.",
      );
    }
  };

  /** The readable German message of a refused roof, also from a schema (Zod) issue list. */
  const roofErrorMessage = (error: unknown) => {
    const fallback =
      "Dach prüfen: Umriss ohne Kreuzungen, passende Abschlüsse. Nach Modelländerung erneut beginnen.";
    if (!(error instanceof Error)) return fallback;
    if (!error.message.startsWith("[")) return error.message;
    try {
      return (JSON.parse(error.message) as { message?: string }[])[0]?.message ?? fallback;
    } catch {
      return fallback;
    }
  };

  /** Places the typed text; empty content just closes the editor. */
  const commitText = () => {
    const draft = textDraft;
    setTextDraft(null);
    if (!draft || !draft.content.trim()) return;
    const { content } = draft;
    try {
      dispatchEditing({
        type: "project",
        project: addText(project, {
          id: `text-${crypto.randomUUID()}`,
          position: draft.position,
          content,
          ...toolDefaults.text,
        }),
      });
      setModelError("");
      showNotice("Text gesetzt");
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Text nicht möglich.");
    }
  };
  /** Chain edits from the demand menu: the dimension tool runs on the existing chain. */
  const startChainEdit = (mode: "add" | "remove" | "line") => {
    const chain =
      selection?.kind === "dimension"
        ? storeyOf(project).dimensions?.find((d) => d.id === selection.id)
        : undefined;
    if (!chain) return;
    cancelInteraction();
    setDemandOpen(false);
    setTool("dimension");
    setMode("2D");
    const line =
      chain.orientation === "horizontal"
        ? { x: chain.points[0]!.x, y: chain.offset }
        : { x: chain.offset, y: chain.points[0]!.y };
    setDimensionDraft({
      line,
      points: chain.points.map((p) => ({ ...p })),
      lastAt: 0,
      edit: { id: chain.id, mode, orientation: chain.orientation, count: chain.points.length },
    });
    showNotice(
      mode === "add"
        ? "Neue Punkte anklicken · Doppelklick ins Leere oder Enter: übernehmen · Esc: abbrechen"
        : mode === "remove"
          ? "Den zu entfernenden Messpunkt anklicken · Esc: abbrechen"
          : "Neue Lage der Maßlinie anklicken · Esc: abbrechen",
    );
  };
  /** Back to selecting with the edited chain selected. */
  const endChainEdit = (next: Project, id: string, notice: string) => {
    dispatchEditing({ type: "project", project: next });
    setDimensionDraft(null);
    setTool("select");
    selectCommitted(next, { kind: "dimension", id });
    setModelError("");
    showNotice(notice);
  };
  /** Ends a running chain: the first click of the finishing double click is no point. */
  const finishDimension = () => {
    const draft = dimensionDraft;
    if (!draft?.line || referenceSelection.selecting) return;
    const points =
      draft.points.length > (draft.edit?.count ?? 0) && Date.now() - draft.lastAt < 600
        ? draft.points.slice(0, -1)
        : draft.points;
    if (draft.edit) {
      if (draft.edit.mode !== "add") return;
      if (points.length === draft.edit.count) {
        setDimensionDraft(null);
        setTool("select");
        return;
      }
      try {
        endChainEdit(
          updateDimension(project, draft.edit.id, { points }),
          draft.edit.id,
          `${points.length - draft.edit.count} Punkt(e) hinzugefügt`,
        );
      } catch (error) {
        setModelError(error instanceof Error ? error.message : "Punkte nicht möglich.");
      }
      return;
    }
    if (points.length < 2) {
      setModelError("Mindestens zwei Punkte für die Maßkette anklicken.");
      return;
    }
    const { orientation, layerId, terminator, units, textSize } = toolDefaults.dimension;
    try {
      dispatchEditing({
        type: "project",
        project: addDimension(project, {
          id: `dimension-${crypto.randomUUID()}`,
          orientation,
          offset: orientation === "horizontal" ? draft.line.y : draft.line.x,
          points,
          layerId,
          ...(terminator ? { terminator } : {}),
          ...(units ? { units } : {}),
          ...(textSize ? { textSize } : {}),
        }),
      });
      setDimensionDraft(null);
      setModelError("");
      showNotice("Maßkette erstellt");
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Maßkette nicht möglich.");
    }
  };
  const drawPoint = (point: Point, candidate?: SnapCandidate | null) => {
    setModelError("");
    // Dimension chain (docs/MASSKETTE.md): the first click places the dimension line, every
    // further click adds a measured point; a double click or Enter finishes.
    // Text tool (docs/TEXT.md): the click sets the insertion point; the editor opens there.
    if (tool === "text") {
      setTextDraft({ position: { ...point }, screen: { ...lastPointer.current }, content: "" });
      return;
    }
    if (tool === "dimension" && dimensionDraft?.edit && dimensionDraft.edit.mode !== "add") {
      const { id, mode, orientation } = dimensionDraft.edit;
      const chain = storeyOf(project).dimensions?.find((d) => d.id === id);
      if (!chain) return setDimensionDraft(null);
      try {
        if (mode === "line") {
          endChainEdit(
            updateDimension(project, id, {
              offset: orientation === "horizontal" ? point.y : point.x,
            }),
            id,
            "Maßlinie verschoben",
          );
          return;
        }
        const index = dimensionPointAt(chain, point, 0.3);
        if (index === null) {
          setModelError(
            "Keinen Messpunkt getroffen: auf einen Punkt oder sein Linienende klicken.",
          );
          return;
        }
        endChainEdit(
          updateDimension(project, id, { points: chain.points.filter((_, i) => i !== index) }),
          id,
          "Punkt entfernt",
        );
      } catch {
        setModelError(
          "Eine Maßkette braucht mindestens zwei verschiedene Punkte. Zum Entfernen die ganze Kette löschen.",
        );
      }
      return;
    }
    if (tool === "dimension") {
      setDimensionDraft((draft) =>
        draft?.line
          ? { ...draft, points: [...draft.points, { ...point }], lastAt: Date.now() }
          : { line: { ...point }, points: [], lastAt: 0 },
      );
      return;
    }
    // Section tool (docs/SCHNITT.md, SC2): click 1 start, click 2 end, click 3 the viewing side;
    // in any storey, the section belongs to the building.
    if (tool === "section") {
      if (!sectionStart) {
        setSectionStart({ x: point.x, y: point.y });
        return;
      }
      if (!sectionEnd) {
        if (Math.hypot(point.x - sectionStart.x, point.y - sectionStart.y) < 1e-6) {
          setModelError("Zweiter Klick: Ende der Schnittlinie, nicht auf den Anfang.");
          return;
        }
        setSectionEnd({ x: point.x, y: point.y });
        return;
      }
      try {
        const { name } = nextSectionLabel(project, sectionDefaults);
        dispatchEditing({
          type: "project",
          project: addSection(
            project,
            {
              id: `section-${crypto.randomUUID()}`,
              start: sectionStart,
              end: sectionEnd,
              look: sectionLookTo(sectionStart, sectionEnd, point),
            },
            sectionDefaults,
          ),
        });
        setSectionStart(null);
        setSectionEnd(null);
        showNotice(`${name} gesetzt`);
      } catch (error) {
        setModelError(error instanceof Error ? error.message : "Schnitt nicht möglich.");
      }
      return;
    }
    // Stair tool (docs/TREPPE.md, TR2/TR3): click 1 on the drawing axis, click 2 sets the run
    // direction, for L and U click 3 the side of the turn; lengths follow from the calculation.
    if (tool === "stair") {
      if (!stairStart) {
        setStairStart({ x: point.x, y: point.y });
        return;
      }
      const values = stairValues(toolDefaults.stair);
      const direction = stairDirection ?? stairDirectionTo(stairStart, point);
      if (direction === null) {
        setModelError("Zweiter Klick: Laufrichtung zeigen, nicht auf den Antritt.");
        return;
      }
      if (values.shape !== "straight" && stairDirection === null) {
        setStairDirection(direction);
        return;
      }
      try {
        dispatchEditing({
          type: "project",
          project: addStair(project, {
            id: `stair-${crypto.randomUUID()}`,
            start: stairStart,
            direction,
            ...values,
            ...(values.shape !== "straight"
              ? { turn: stairTurnTo(stairStart, direction, point) }
              : {}),
          }),
        });
        setStairStart(null);
        setStairDirection(null);
        showNotice("Treppe gesetzt");
      } catch (error) {
        setModelError(error instanceof Error ? error.message : "Treppe nicht möglich.");
      }
      return;
    }
    // Column tool: each click sets a column, centre on the point (docs/STUETZEN.md, P2).
    if (tool === "column") {
      try {
        dispatchEditing({
          type: "project",
          project: addColumn(project, {
            id: `column-${crypto.randomUUID()}`,
            position: { x: point.x, y: point.y },
            ...columnValues(toolDefaults.column),
          }),
        });
        showNotice("Stütze gesetzt");
      } catch (error) {
        setModelError(error instanceof Error ? error.message : "Stütze nicht möglich.");
      }
      return;
    }
    // Room by a click between walls (docs/ROOM_ELEMENT.md, R2).
    if (roomByWalls) {
      try {
        setDrawingBase(project);
        finishPath(enclosedRoomOutline(project, point), project);
      } catch (error) {
        setModelError(roofErrorMessage(error));
      }
      return;
    }
    // Roof phase 2: the click side of the reference line is the side the roof rises to.
    if (roofPhase === "side" && roofLine) {
      const { start, end } = roofLine;
      const side =
        (end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x);
      if (side === 0) setModelError("Neben die Bezugslinie klicken, auf die Seite des Anstiegs.");
      else setRoofRise(side > 0 ? "left" : "right");
      return;
    }
    if (areaTool && construction === "boundary") {
      const points = findHatchBoundary?.(point) ?? [];
      if (points.length) finishPath(points, project);
      else
        setModelError(
          "Keine geschlossene sichtbare Polygonkontur an dieser Stelle. In die Kontur klicken.",
        );
      return;
    }
    if (pathDrawing) {
      if (pathPoints.length === 0) {
        setDrawingBase(project);
        setDemandPosition({ x: lastPointer.current.x + 16, y: lastPointer.current.y + 16 });
      } else if (drawingBase !== project) {
        setModelError("Das Modell wurde geändert. Zeichnen erneut beginnen.");
        return;
      }
      const previous = pathPoints.at(-1);
      if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) === 0) {
        setModelError("Nächsten Punkt an einer anderen Position wählen.");
        return;
      }
      const click = resolvePathClick(pathPoints, point, pathClosure);
      if (click.kind === "finish") {
        finishPath(click.points);
        return;
      }
      const next = click.points;
      if (
        areaTool &&
        construction !== "polygon" &&
        next.length === (construction === "diagonal" ? 2 : 3)
      ) {
        try {
          finishPath(rectangleContour(construction as "diagonal" | "side-height", next));
        } catch (e) {
          setModelError(e instanceof Error ? e.message : "Ungültiges Rechteck.");
        }
      } else if (tool === "line" && lineKind === "line" && next.length === 2) finishPath(next);
      else if (roofPhase === "line" && next.length === 2) {
        setRoofLine({ start: next[0]!, end: next[1]! });
        setPathPoints([]);
      } else setPathPoints(next);
      return;
    }
    try {
      if (!activeChain) {
        setDrawingBase(project);
        setDemandPosition({ x: lastPointer.current.x + 16, y: lastPointer.current.y + 16 });
        setWallChain(beginWallChain(project, point, candidate, toolDefaults.wall));
      } else {
        setWallChain(
          appendWallChain(activeChain, project, `wall-${crypto.randomUUID()}`, point, candidate),
        );
      }
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Ungültige Wand.");
    }
  };

  const finishChain = () => {
    if (!activeChain) return;
    try {
      const next = finishWallChain(activeChain, project);
      changeProject(next, { kind: "wall", id: activeChain.wallIds.at(-1)! });
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Ungültige Wandkette.");
    }
  };

  const windowTool = useWindowPlacement(
    tool === "window",
    project,
    visibility,
    (next, id) => {
      changeProject(next, { kind: "window", id });
      setTool("select");
    },
    () => selectTool("select"),
    toolDefaults.window,
    toolDefaults.setWindow,
  );
  const doorTool = useDoorPlacement(
    tool === "door",
    project,
    visibility,
    (next, id) => {
      changeProject(next, { kind: "door", id });
      setTool("select");
    },
    () => selectTool("select"),
    toolDefaults.door,
    toolDefaults.setDoor,
  );
  const imageTool = useImageImport(project, visibility, (next, id) =>
    changeProject(next, { kind: "reference", id }),
  );
  cancelImage.current = imageTool.cancel;
  const calibration = useReferenceCalibration(project, selections, visibility, (next, id) =>
    changeProject(next, { kind: "reference", id }),
  );
  cancelCalibration.current = calibration.cancel;
  const recoveryBusy =
    !!pendingSession ||
    groupMove.active ||
    tool !== "select" ||
    readingFile ||
    !!pendingFile ||
    imageTool.busy ||
    imageTool.active ||
    !!calibration.adapter ||
    exportingIfc;
  const holdRecovery = autosave.hold;
  useEffect(() => {
    holdRecovery("workspace", recoveryBusy);
    return () => holdRecovery("workspace", false);
  }, [recoveryBusy, holdRecovery]);
  const measurementContext = useMemo(
    () => ({ project, visibility, mode, activeViewport, layout, tool, measurementMode }),
    [project, visibility, mode, activeViewport, layout, tool, measurementMode],
  );
  const measurement = useMeasurement(
    tool === "measure" && mode === "2D",
    measurementContext,
    measurementMode,
    () => selectTool("select"),
  );
  cancelMeasurement.current = measurement.reset;
  const windowPlacement =
    measurement.adapter ??
    calibration.adapter ??
    imageTool.adapter ??
    windowTool.adapter ??
    doorTool.adapter;
  const interaction = useToolInteraction(
    windowPlacement ??
      groupMove.adapter ??
      (editSession
        ? editInteraction(
            editSession,
            project,
            selection,
            (point, candidate) => {
              const current = visibilityNow.current;
              if (
                current.visibility !== visibility ||
                !visibleLayerTarget(current.project, current.visibility, editSession.target)
              )
                return;
              dispatchEditing({
                type: "confirm",
                session: editSession,
                selection,
                point,
                candidate,
              });
            },
            cancelInteraction,
          )
        : drawingOrigin && drawingBase
          ? drawingInteraction(
              drawingBase,
              project,
              drawingOrigin,
              drawPoint,
              cancelInteraction,
              tool === "wall" ? activeChain?.points : pathDrawing ? pathPoints : undefined,
              tool === "wall" ? (activeChain ?? undefined) : undefined,
            )
          : null),
    referenceSelection.selecting,
  );

  const downloadIfc = async () => {
    if (exportingIfc) return;
    setExportingIfc(true);
    setExportMessage("");
    setModelError("");
    try {
      const content = await exportIfc(project);
      const url = URL.createObjectURL(new Blob([content], { type: "application/x-step" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "novikov-project.ifc";
      document.body.appendChild(anchor);
      try {
        anchor.click();
      } finally {
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setExportMessage(
        "IFC export ready · download requested" +
          (storeyOf(project).lines?.length || storeyOf(project).hatches.length
            ? " · 2D-Linien und Schraffuren sind nur in der JSON-Projektdatei enthalten."
            : ""),
      );
    } catch {
      setModelError("IFC export failed. The model is unchanged; please try again.");
    } finally {
      setExportingIfc(false);
    }
  };

  // Canvas tabs (docs/SCHNITT.md): a view without a tab opens one; tabs of removed sections go.
  const sections = project.sections;
  const sectionIds = new Set((sections ?? []).map((s) => s.id));
  const activeSection = activeSectionId && sectionIds.has(activeSectionId) ? activeSectionId : null;
  if (activeSectionId && !activeSection) setActiveSectionId(null);
  const activeView = activeSection ? sectionTab(activeSection) : canvasViewOf(mode);
  const shownTabs = existingCanvasTabs(withCanvasTab(canvasTabs, activeView), sectionIds);
  if (shownTabs.join("|") !== canvasTabs.join("|")) setCanvasTabs(shownTabs);
  function selectCanvasTab(view: CanvasView) {
    const sectionId = tabSectionId(view);
    setCanvasTabs((tabs) => withCanvasTab(tabs, view));
    if (sectionId === null) return changeMode(canvasModeOf(view as "plan" | "3d"));
    cancelInteraction();
    setActiveSectionId(sectionId);
  }
  const openSectionWindow = (id: string) => {
    cancelInteraction();
    setModelError("");
    setSectionWindow(id);
  };
  function changeMode(next: ViewMode) {
    setActiveSectionId(null);
    if (activeDocumentId && next === "3D") {
      showNotice("Dieses Abbild ist ein 2D-Grundriss.");
      return;
    }
    if (next === mode) return;
    groupMove.cancel();
    dispatchEditing({ type: "cancel" });
    setMode(next);
    setWallChain(null);
    setPathPoints([]);
    if (next === "3D") setTool("select");
  }

  return (
    <CadAppearanceProvider projectId={project.id} penSet={project.penSet ?? defaultPenSet}>
      <CanvasDisplaySettings
        open={displaySettingsOpen}
        onOpenChange={setDisplaySettingsOpen}
        wallWidth={wallWidth}
        onWallWidth={setWallWidth}
        cutFill={cutFill}
        onCutFill={setCutFill}
        showRenovation={showRenovation}
        onShowRenovation={setShowRenovation}
      />
      <AlertDialog open={!!trimConfirm} onOpenChange={(open) => !open && setTrimConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wände trimmen</AlertDialogTitle>
            <AlertDialogDescription>
              {trimConfirm &&
                `${trimConfirm.wallIds.length} ${trimConfirm.wallIds.length === 1 ? "Wand" : "Wände"} an Dach „${trimConfirm.roofId}“ trimmen? Die Wände reichen dann bis zur Dachunterseite; die gespeicherte Höhe bleibt für „Trimmung aufheben“ erhalten.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTrim}>Trimmen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {settingsWindow &&
        (() => {
          if (settingsWindow.mode === "tool") {
            // Roof and room render their own windows below, in the same single slot.
            if (settingsWindow.tool === "roof" || settingsWindow.tool === "room") return null;
            const name = SETTINGS_TOOLS[settingsWindow.tool] ?? settingsWindow.tool;
            return (
              <ToolSettingsWindow
                // A new key per tool or element: sections start fresh on every switch.
                key={`tool:${settingsWindow.tool}`}
                title={`${name} – Einstellungen`}
                subtitle={`Werkzeug ${name}: Vorgaben für neue Elemente. Doppelklick auf ein vorhandenes Element öffnet dieses Fenster für genau dieses Element.`}
                sections={[
                  {
                    id: "defaults",
                    label: name,
                    content: toolFields(settingsWindow.tool, "window"),
                  },
                  ...(settingsWindow.tool === "wall" ||
                  settingsWindow.tool === "column" ||
                  settingsWindow.tool === "stair"
                    ? [
                        {
                          id: "renovation",
                          label: "Bauzustand",
                          content: (
                            <WallRenovationFields
                              value={
                                settingsWindow.tool === "column"
                                  ? toolDefaults.column.renovation
                                  : settingsWindow.tool === "stair"
                                    ? toolDefaults.stair.renovation
                                    : (toolDefaults.wall.renovation ?? "existing")
                              }
                              onChange={(renovation) => {
                                cancelInteraction();
                                if (settingsWindow.tool === "column")
                                  toolDefaults.setColumn({ ...toolDefaults.column, renovation });
                                else if (settingsWindow.tool === "stair")
                                  toolDefaults.setStair({ ...toolDefaults.stair, renovation });
                                else toolDefaults.setWall({ ...toolDefaults.wall, renovation });
                              }}
                              hint="Vorgabe für neue Wände."
                              showColors={showRenovation}
                              onShowColors={setShowRenovation}
                            />
                          ),
                        },
                      ]
                    : []),
                ]}
                onClose={() => setSettingsWindow(null)}
              />
            );
          }
          const target = settingsWindow.target;
          const exists = project.storeys.some((s) =>
            [...storeyElements(s, target.kind)].some((e) => e.id === target.id),
          );
          if (!exists) return null;
          const caption = planElementCaption(project, target);
          return (
            <ToolSettingsWindow
              key={`element:${target.kind}:${target.id}`}
              title={`${caption} – Einstellungen`}
              subtitle={`Element ${caption} (${target.id}): Jede Änderung wirkt sofort und ist ein Rückgängig-Schritt.`}
              sections={[
                {
                  id: "element",
                  label: ELEMENT_KINDS[target.kind].label,
                  content: (
                    <BimInspector
                      renovationField={false}
                      key={propertyFormKey(project, target)}
                      project={project}
                      selection={target}
                      onChange={changeProject}
                      onWallOffset={(base, wallId, offset) =>
                        dispatchEditing({
                          type: "wall-offset",
                          base,
                          selection: target,
                          request: { projectId: base.id, wallId, offset },
                        })
                      }
                    />
                  ),
                },
                ...(target.kind === "wall" || target.kind === "column" || target.kind === "stair"
                  ? [
                      {
                        id: "renovation",
                        label: "Bauzustand",
                        content: (
                          <WallRenovationFields
                            value={wallRenovation(
                              (target.kind === "wall"
                                ? project.storeys.flatMap((s) => s.walls)
                                : target.kind === "stair"
                                  ? project.storeys.flatMap((s) => s.stairs ?? [])
                                  : project.storeys.flatMap((s) => s.columns ?? [])
                              ).find((e) => e.id === target.id) ?? {},
                            )}
                            onChange={(renovation) => {
                              // All selected elements of this kind follow, the double-clicked
                              // one included.
                              const ids = new Set([
                                target.id,
                                ...selections
                                  .filter((s) => s.kind === target.kind)
                                  .map((s) => s.id),
                              ]);
                              try {
                                dispatchEditing({
                                  type: "project",
                                  project:
                                    target.kind === "wall"
                                      ? setWallRenovation(project, [...ids], renovation)
                                      : [...ids].reduce(
                                          (p, id) =>
                                            target.kind === "stair"
                                              ? updateStair(p, id, { renovation })
                                              : updateColumn(p, id, { renovation }),
                                          project,
                                        ),
                                });
                                setModelError("");
                              } catch (error) {
                                setModelError(
                                  error instanceof Error ? error.message : "Nicht möglich.",
                                );
                              }
                            }}
                            hint={
                              selections.filter((s) => s.kind === target.kind).length > 1
                                ? "Gilt für alle gewählten Elemente dieser Art; ein Rückgängig-Schritt."
                                : "Ein Rückgängig-Schritt."
                            }
                            showColors={showRenovation}
                            onShowColors={setShowRenovation}
                          />
                        ),
                      },
                    ]
                  : []),
                {
                  id: "layer",
                  label: "Ebene",
                  content: (
                    <LayerProperties
                      key={`layer:${propertyFormKey(project, target)}`}
                      project={project}
                      selection={target}
                      disabled={referenceSelection.selecting}
                      onAssign={(base, assigned, layerId) => {
                        dispatchEditing({
                          type: "assign-layer",
                          base,
                          target: assigned,
                          selection: currentSelection.current,
                          layerId,
                        });
                        setModelError("");
                      }}
                    />
                  ),
                },
              ]}
              onClose={() => setSettingsWindow(null)}
            />
          );
        })()}
      {textDraft && tool === "text" && (
        <TextEditorOverlay
          position={textDraft.screen}
          content={textDraft.content}
          onContent={(content) => setTextDraft((d) => (d ? { ...d, content } : d))}
          settings={toolDefaults.text}
          onSettings={toolDefaults.setText}
          layers={project.layers}
          denominator={planDenominator(project)}
          onCommit={commitText}
          onCancel={() => setTextDraft(null)}
        />
      )}
      {contextMenu && (
        <CanvasContextMenu
          position={contextMenu}
          title={
            contextMenu.target
              ? selections.length > 1
                ? `${selections.length} Elemente`
                : planElementCaption(project, contextMenu.target)
              : "Zeichenfläche"
          }
          entries={contextEntries(contextMenu.target)}
          onClose={() => setContextMenu(null)}
        />
      )}
      <RoomListPanel
        open={roomListOpen}
        onOpenChange={setRoomListOpen}
        project={project}
        onSelectRoom={(id) => selectElement({ kind: "room", id })}
      />
      {roomSettingsOpen && (
        <RoomSettingsPanel
          open={roomSettingsOpen}
          section={roomSettingsSection}
          onOpenChange={(open) => !open && setSettingsWindow(null)}
          construction={roomConstruction}
          onConstruction={(next) => {
            setPathPoints([]);
            setRoomConstruction(next);
          }}
          value={toolDefaults.room}
          onChange={toolDefaults.setRoom}
          layers={project.layers}
        />
      )}
      {roofSettingsOpen && (
        <RoofSettingsPanel
          open={roofSettingsOpen}
          onOpenChange={(open) => !open && setSettingsWindow(null)}
          construction={hatchConstruction}
          onConstruction={(construction) => {
            setPathPoints([]);
            setHatchConstruction(construction);
          }}
          value={toolDefaults.roof}
          onChange={toolDefaults.setRoof}
          layers={project.layers}
        />
      )}
      <main
        onPointerDownCapture={(event) => {
          lastPointer.current = { x: event.clientX, y: event.clientY };
        }}
        className="cad-shell flex h-dvh min-h-[560px] flex-col gap-2 overflow-hidden p-2 text-foreground"
      >
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          aria-label="Projektdatei auswählen"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void openProjectFile(file);
          }}
        />
        {recoveryOpen && (
          <RecoveryPanel
            autosave={autosave}
            onClose={() => setRecoveryOpen(false)}
            onPrepare={(candidate) => {
              setPendingFile(candidate);
              setModelError("");
              setExportMessage("");
            }}
          />
        )}
        <FloatingPanel
          open={!!pendingFile}
          title="Projektdatei laden?"
          width={520}
          height={300}
          onClose={() => setPendingFile(null)}
        >
          <div className="min-h-0 flex-1 overflow-auto space-y-4 p-4">
            <p className="text-xs text-muted-foreground">
              {pendingFile?.name} · {projectElementCounts(pendingFile?.project).walls} Wände ·{" "}
              {projectElementCounts(pendingFile?.project).windows} Fenster ·{" "}
              {projectElementCounts(pendingFile?.project).doors} Türen ·{" "}
              {projectElementCounts(pendingFile?.project).slabs} Decken ·{" "}
              {projectElementCounts(pendingFile?.project).roofs} Dächer ·{" "}
              {projectElementCounts(pendingFile?.project).rooms} Räume ·{" "}
              {projectElementCounts(pendingFile?.project).lines ?? 0} Linien ·{" "}
              {projectElementCounts(pendingFile?.project).hatches ?? 0} Schraffuren ·{" "}
              {projectElementCounts(pendingFile?.project).references ?? 0} Bildreferenzen. Ersetzt
              das aktuelle Modell. Mit Undo kannst du zum vorherigen Modell zurückkehren. Nicht
              übernommene Formulareingaben werden verworfen.
            </p>
            <RasterBudgetNotice project={pendingFile?.project} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPendingFile(null)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  if (pendingFile) {
                    dispatchEditing({
                      type: "load-project",
                      project: pendingFile.project,
                    });
                  }
                }}
              >
                Projekt laden
              </Button>
            </div>
          </div>
        </FloatingPanel>
        {penSetsOpen && (
          <PenSetManager
            selected={project.penSet ?? defaultPenSet}
            onClose={() => setPenSetsOpen(false)}
            onSelect={(set) => changeProject(assignPenSet(project, project, set), selection)}
          />
        )}
        {lineCreatorOpen && <LineStyleCreator onClose={() => setLineCreatorOpen(false)} />}
        <HatchPatternCreator open={hatchLibraryOpen} onOpenChange={setHatchLibraryOpen} />
        {!fullscreen && (
          <TopToolbar
            storeyName={storeyOf(project).name}
            onPenSets={() => setPenSetsOpen(true)}
            onLineCreator={() => setLineCreatorOpen(true)}
            onHatchLibrary={() => setHatchLibraryOpen(true)}
            onMeasure={() => selectTool("measure")}
            measuring={tool === "measure"}
            onImportImage={() => {
              if (activeDocumentId) {
                showNotice("Zum Importieren Arbeitsmodell öffnen.");
                return;
              }
              selectTool("select");
              setSelection(null);
              setMode("2D");
              imageInput.current?.click();
            }}
            onCanvasDisplay={() => setDisplaySettingsOpen(true)}
            onLayers={() => {
              cancelInteraction();
              setDemandOpen(false);
              setModelError("");
              setLayersOpen(true);
            }}
            onPipette={() => selections.length === 1 && pickupFrom(selections[0]!)}
            canPipette={selections.length === 1}
            onTrim={askTrim}
            canTrim={typeof trimRequest() !== "string"}
            onUntrim={untrimSelected}
            canUntrim={trimmedSelection().length > 0}
            onRoomList={() => {
              cancelInteraction();
              setDemandOpen(false);
              setModelError("");
              setRoomListOpen(true);
            }}
            mode={mode}
            layout={layout}
            grid={grid}
            snap={snap}
            navigatorOpen={navigatorOpen}
            demandOpen={demandOpen}
            onMode={changeMode}
            onLayout={(next) => {
              groupMove.cancel();
              dispatchEditing({ type: "cancel" });
              setLayout(next);
              setActiveViewport(0);
            }}
            onGrid={() => setGrid((value) => !value)}
            onSnap={() => setSnap((value) => !value)}
            onNavigator={() => setNavigatorOpen((value) => !value)}
            onDemand={() => setDemandOpen((value) => !value)}
            onAction={showNotice}
            onExportIfc={downloadIfc}
            exportingIfc={exportingIfc}
            onSave={saveProject}
            onRecovery={() => setRecoveryOpen(true)}
            onOpen={() => {
              if (!readingFile) fileInput.current?.click();
            }}
            onUndo={() => navigateHistory("undo")}
            onRedo={() => navigateHistory("redo")}
            selectedLayer={project.layers.find((l) => l.id === selectedLayerId) ?? null}
            onLayerVisibility={(action) =>
              dispatchEditing({ type: "visibility", base: project, action, scope: visibilityScope })
            }
            canUndoVisibility={Boolean(visibilityHistory?.past.length)}
            canRedoVisibility={Boolean(visibilityHistory?.future.length)}
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            historyTrimmed={Boolean(history.trimmed)}
          />
        )}
        <input
          ref={imageInput}
          type="file"
          accept="image/png,image/jpeg"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void imageTool.begin(file);
          }}
        />
        <LayerManager
          hiddenLayerIds={visibility.context.hiddenLayerIds}
          project={project}
          onVisibility={(base, action) =>
            dispatchEditing({ type: "visibility", base, action, scope: visibilityScope })
          }
          canUndoVisibility={Boolean(visibilityHistory?.past.length)}
          canRedoVisibility={Boolean(visibilityHistory?.future.length)}
          open={layersOpen}
          onOpenChange={setLayersOpen}
          error={editing.error}
          onManage={(base, request) => dispatchEditing({ type: "manage-layer", base, request })}
        />
        {demandOpen &&
          !imageTool.active &&
          !groupMove.active &&
          !referenceSelection.selecting &&
          (mode === "2D" || (tool === "select" && selections.length > 0 && !editSession)) && (
            <DemandMenu
              calibrationControls={
                selection?.kind === "reference" && selections.length === 1 ? (
                  <ReferenceCalibrationControls
                    calibration={calibration}
                    beforeBegin={cancelInteraction}
                  />
                ) : undefined
              }
              project={project}
              solid={mode === "3D" && activeViewport === 0}
              selectionCount={selections.length}
              onMoveSelection={
                selections.length > 1 || selection?.kind === "reference"
                  ? () => {
                      cancelInteraction();
                      try {
                        groupMove.begin();
                        setDemandOpen(false);
                        setModelError("");
                      } catch (error) {
                        setModelError(
                          error instanceof Error ? error.message : "Bewegung nicht möglich.",
                        );
                      }
                    }
                  : undefined
              }
              onDeleteSelection={
                tool === "select" && !editSession && selections.length ? deleteSelection : undefined
              }
              selection={tool === "select" && !editSession ? selection : null}
              position={pinnedDemand ?? demandPosition}
              onPosition={pinDemand}
              onResetPosition={unpinDemand}
              pointIndex={pickedPoint.index}
              edgeIndex={pickedPoint.edgeIndex ?? null}
              onChainAction={startChainEdit}
              onReferences={
                mode === "2D"
                  ? () => {
                      setDemandOpen(false);
                      referenceSelection.begin();
                    }
                  : undefined
              }
              onAction={startEdit}
              onInfo={() => {
                setFullscreen(false);
                propertiesRef.current?.focus();
              }}
            />
          )}
        {sectionWindow &&
          (() => {
            const section = sections?.find((s) => s.id === sectionWindow);
            if (!section) return null;
            return (
              <FloatingPanel
                open
                title={`${section.name} – Schnitt`}
                width={380}
                height={370}
                onClose={() => setSectionWindow(null)}
              >
                <SectionProperties
                  key={`${section.id}:${section.name}:${section.mark}:${JSON.stringify(section.symbolSize)}`}
                  section={section}
                  sections={sections ?? []}
                  denominator={planDenominator(project)}
                  onChange={(changes) => {
                    try {
                      dispatchEditing({
                        type: "project",
                        project: updateSection(project, section.id, changes),
                      });
                    } catch (error) {
                      setModelError(
                        error instanceof Error ? error.message : "Änderung nicht möglich.",
                      );
                    }
                  }}
                  onDelete={() => {
                    setSectionWindow(null);
                    dispatchEditing({
                      type: "project",
                      project: removeSection(project, section.id),
                    });
                    showNotice(`${section.name} gelöscht`);
                  }}
                  onOpen={() => selectCanvasTab(sectionTab(section.id))}
                />
              </FloatingPanel>
            );
          })()}
        {cornerWall && (
          <CornerPreviewDialog
            viewContext={viewContext}
            project={project}
            firstId={cornerWall}
            visibility={visibility}
            onClose={() => setCornerWall(null)}
          />
        )}
        {/* One drawing surface over the whole stage; tool properties, tool rail and navigator
            float above it as glass palettes (docs/GLAS_PALETTEN.md). */}
        <div
          ref={stageRef}
          className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-workspace shadow-[0_20px_60px_var(--glass-deep)]"
        >
          {/* The free part between the palettes: notices and view controls live here. */}
          <div className="absolute" style={insets}>
            <div>
              <div className="absolute left-3 top-12 z-40 max-w-lg">
                <RasterBudgetNotice project={project} />
              </div>
              <div className="absolute left-1/2 top-3 z-40 max-w-[50%] -translate-x-1/2">
                <CanvasTabs
                  tabs={shownTabs}
                  active={activeView}
                  storeyName={storeyOf(project).name}
                  sections={sections ?? []}
                  onSelect={selectCanvasTab}
                  onClose={(view) => {
                    const next = closeCanvasTab(shownTabs, view, activeView);
                    setCanvasTabs(next.tabs);
                    if (next.active !== activeView) selectCanvasTab(next.active);
                  }}
                />
              </div>
              {activeSection &&
                (() => {
                  const section = sections!.find((s) => s.id === activeSection)!;
                  return (
                    <div
                      role="tabpanel"
                      aria-label={section.name}
                      className="absolute inset-0 z-30"
                    >
                      <SectionDrawingView
                        key={section.id}
                        project={project}
                        section={section}
                        cutFill={cutFill}
                        onSettings={() => openSectionWindow(section.id)}
                      />
                    </div>
                  );
                })()}
              {layerActivation && (
                <DocumentLayerNotice
                  key={layerActivation.layerIds.join(":")}
                  project={project}
                  activeDocumentId={activeDocumentId}
                  activation={layerActivation}
                />
              )}
              {activeDocumentId && !activeDocument ? (
                <p role="alert" className="p-4">
                  Das Abbild ist nicht vorhanden. Mit Projekt-Undo wiederherstellen oder
                  Arbeitsmodell öffnen.
                </p>
              ) : (
                <>
                  <div
                    className="absolute isolate"
                    style={
                      layout === "single"
                        ? {
                            left: -insets.left,
                            top: -insets.top,
                            right: -insets.right,
                            bottom: -insets.bottom,
                          }
                        : { inset: 0 }
                    }
                  >
                    <ViewportManager
                      safe={insets}
                      startupNotice={
                        autosave.startupOffer && autosave.startupOffer.kind !== "empty" ? (
                          <RecoveryStartupNotice
                            offer={autosave.startupOffer}
                            onContinue={autosave.continueStartup}
                            onOpen={() => setRecoveryOpen(true)}
                          />
                        ) : undefined
                      }
                      key={
                        mode === "3D" ? "building-3d" : (activeDocumentId ?? storeyOf(project).id)
                      }
                      documentFraming={activeDocument?.framing}
                      onPlanCapture={onPlanCapture}
                      viewContext={viewContext}
                      onScale={(denominator) =>
                        viewContext.binding.kind === "drawing-document"
                          ? dispatchEditing({
                              type: "document",
                              base: project,
                              action: {
                                kind: "scale",
                                id: viewContext.binding.documentId,
                                denominator,
                              },
                            })
                          : dispatchEditing({
                              type: "view-scale",
                              view: viewContext.binding,
                              denominator,
                            })
                      }
                      pickupScope={measurementContext}
                      onPickup={pickupFrom}
                      onContextMenu={openContextMenu}
                      onElementSettings={openElementSettings}
                      zoomSlot={zoomSlot}
                      placement={
                        windowPlacement
                          ? {
                              measurement:
                                measurement.adapter && measurementMode === "distance"
                                  ? measurement.value
                                  : undefined,
                              angleMeasurement:
                                measurement.adapter && measurementMode === "angle"
                                  ? measurement.angle
                                  : undefined,
                              areaMeasurement:
                                measurement.adapter && measurementMode === "area"
                                  ? measurement.area
                                  : undefined,
                              finish:
                                measurement.adapter && measurementMode === "area"
                                  ? measurement.finish
                                  : undefined,
                              target: interaction.target,
                              previewProject: windowPlacement.previewProject,
                              aim: interaction.draft.move,
                              pick: (point, candidate) => {
                                interaction.pick(point, candidate);
                                if (windowTool.pickingHost || doorTool.pickingHost)
                                  setDemandPosition({
                                    x: lastPointer.current.x + 16,
                                    y: lastPointer.current.y + 16,
                                  });
                              },
                            }
                          : groupMove.active
                            ? {
                                target: interaction.target,
                                geometryPreview: groupMove.adapter?.geometryPreview,
                                axisConstraint: groupMove.adapter?.axisConstraint,
                                aim: interaction.draft.move,
                                pick: groupMove.pickingOrigin
                                  ? (point) => {
                                      groupMove.pickOrigin(point);
                                      setDemandPosition({
                                        x: lastPointer.current.x + 16,
                                        y: lastPointer.current.y + 16,
                                      });
                                    }
                                  : interaction.pick,
                              }
                            : undefined
                      }
                      project={project}
                      drawingPreview={activeChain?.preview}
                      drawingProjectAt={
                        drawingOrigin ? interaction.adapter?.previewProject : undefined
                      }
                      referenceSelection={referenceSelection}
                      selection={selection}
                      selections={selections}
                      onSelectMany={selectMany}
                      snapping={
                        interaction.adapter?.snapping ??
                        (tool === "wall" ? wallStartSnapPolicy : null)
                      }
                      drawing={
                        (tool === "wall" ||
                          tool === "column" ||
                          tool === "stair" ||
                          tool === "section" ||
                          tool === "dimension" ||
                          tool === "text" ||
                          pathDrawing ||
                          tool === "roof" ||
                          tool === "room") &&
                        mode === "2D"
                      }
                      endpointSnap={
                        pathDrawing ||
                        tool === "roof" ||
                        tool === "measure" ||
                        tool === "select" ||
                        tool === "wall" ||
                        tool === "column" ||
                        tool === "stair" ||
                        tool === "section" ||
                        tool === "dimension" ||
                        tool === "text" ||
                        tool === "window" ||
                        tool === "door"
                      }
                      hoverDwellMs={hoverDwellMs}
                      start={
                        pathDrawing
                          ? (pathPoints.at(-1) ?? null)
                          : tool === "section"
                            ? sectionEnd
                              ? null
                              : sectionStart
                            : tool === "stair"
                              ? // After the run direction only the side of the turn is chosen.
                                stairDirection === null
                                ? stairStart
                                : null
                              : wallStart
                      }
                      draftPoints={pathDrawing ? pathPoints : []}
                      draftFinishable={
                        tool === "dimension"
                          ? (dimensionDraft?.points.length ?? 0) >= 2
                          : tool === "wall"
                            ? (activeChain?.wallIds.length ?? 0) > 0
                            : pathPoints.length >= 2
                      }
                      closeAtStart={pathClosure !== "none"}
                      roofGuide={roofLine ? { ...roofLine, rise: roofRise } : null}
                      draftFill={tool === "hatch" ? hatchFill : undefined}
                      draftPattern={
                        tool === "hatch" ? toolDefaults.hatch.patternDefinition : undefined
                      }
                      draftPatternRotation={toolDefaults.hatch.patternRotation}
                      draftPatternSize={toolDefaults.hatch.patternSize}
                      draftContour={
                        areaTool && construction !== "polygon"
                          ? (point) =>
                              construction === "boundary"
                                ? (findHatchBoundary?.(point) ?? [])
                                : rectangleContour(construction, [...pathPoints, point])
                          : undefined
                      }
                      wallOutlineWidth={wallWidth}
                      cutFill={cutFill}
                      showRenovation={showRenovation}
                      gridSettings={gridSettings}
                      snap={snap}
                      ortho={ortho}
                      onSelect={selectElement}
                      onContourStretch={(target, index, anchor) => {
                        if (
                          target.kind === "reference" ||
                          target.kind === "door" ||
                          target.kind === "column" ||
                          target.kind === "dimension" ||
                          target.kind === "text" ||
                          target.kind === "stair"
                        )
                          return;
                        if (
                          referenceSelection.selecting ||
                          !visibleLayerTarget(
                            visibilityNow.current.project,
                            visibilityNow.current.visibility,
                            target,
                          )
                        )
                          return;
                        cancelInteraction();
                        setSelection(target);
                        setTool("select");
                        setDemandOpen(false);
                        setModelError("");
                        dispatchEditing({ type: "begin", target, action: "edge", index, anchor });
                      }}
                      onCornerPick={(target, index, anchor) => {
                        if (
                          !isVertexTarget(target) ||
                          referenceSelection.selecting ||
                          !visibleLayerTarget(
                            visibilityNow.current.project,
                            visibilityNow.current.visibility,
                            target,
                          )
                        )
                          return false;
                        cancelInteraction();
                        setPickedPoint({ index, anchor, edgeIndex: null });
                        setTool("select");
                        setDemandOpen(false);
                        setModelError("");
                        dispatchEditing({ type: "begin", target, action: "point", index, anchor });
                        return true;
                      }}
                      onEditCancel={() =>
                        measurement.adapter
                          ? interaction.cancel()
                          : dispatchEditing({ type: "cancel" })
                      }
                      onPoint={(point, candidate) =>
                        referenceSelection.selecting
                          ? undefined
                          : interaction.adapter
                            ? interaction.pick(point, candidate)
                            : drawPoint(point, candidate)
                      }
                      editSession={editSession?.base === project ? editSession : null}
                      numericTarget={editSession ? interaction.target : undefined}
                      drawingTarget={drawingOrigin ? interaction.target : undefined}
                      onDrawingAim={drawingOrigin ? interaction.draft.move : undefined}
                      onEditAim={(_session, point) => interaction.draft.move(point)}
                      onEditDirection={(_session, point, candidate) =>
                        interaction.pick(point, candidate)
                      }
                      onEditCommit={(_session, point, candidate) =>
                        interaction.pick(point, candidate)
                      }
                      {...(tool === "dimension" ? { onFinish: finishDimension } : {})}
                      textPreview={
                        tool === "text" && textDraft?.content.trim()
                          ? {
                              ...toolDefaults.text,
                              position: textDraft.position,
                              content: textDraft.content,
                            }
                          : undefined
                      }
                      sections={sections}
                      onSectionSettings={openSectionWindow}
                      sectionDraft={
                        tool === "section" && sectionStart
                          ? {
                              start: sectionStart,
                              end: sectionEnd,
                              mark: nextSectionLabel(project, sectionDefaults).mark,
                              symbolSize: sectionDefaults.symbolSize,
                            }
                          : undefined
                      }
                      stairDraft={
                        tool === "stair" && stairStart
                          ? {
                              start: stairStart,
                              direction: stairDirection,
                              values: stairValues(toolDefaults.stair),
                              storeyHeight: storeyOf(project).height ?? null,
                            }
                          : undefined
                      }
                      dimensionDraft={
                        tool === "dimension" && dimensionDraft
                          ? {
                              orientation:
                                dimensionDraft.edit?.orientation ??
                                toolDefaults.dimension.orientation,
                              line: dimensionDraft.line,
                              points: dimensionDraft.points,
                              mode: dimensionDraft.edit?.mode,
                              style: dimensionDraft.edit
                                ? (storeyOf(project).dimensions?.find(
                                    (d) => d.id === dimensionDraft.edit!.id,
                                  ) ?? {})
                                : toolDefaults.dimension,
                            }
                          : undefined
                      }
                      {...(tool === "wall" ||
                      (tool === "line" && lineKind === "polyline") ||
                      (areaTool && construction === "polygon")
                        ? {
                            onFinish: () => {
                              if (!referenceSelection.selecting) {
                                if (tool === "wall") finishChain();
                                else finishPath();
                              }
                            },
                          }
                        : {})}
                      layout={layout}
                      mode={mode}
                      grid={grid}
                      active={activeViewport}
                      onActive={setActiveViewport}
                      onFullscreen={() => setFullscreen((value) => !value)}
                    />
                  </div>
                  {(groupMove.adapter ||
                    (editSession && ["move", "point"].includes(editSession.action))) &&
                    mode === "3D" && (
                      <MovementAxisControls
                        project={project}
                        targets={selections}
                        vertical={groupMove.axis === "z"}
                        onVertical={groupMove.canUseZ ? () => groupMove.setAxis("z") : undefined}
                        onDirection={(angle) => {
                          groupMove.setAxis("xy", angle);
                          interaction.draft.change(angle, interaction.draft.length);
                        }}
                      />
                    )}
                  {groupMove.active && (
                    <p
                      role="status"
                      className="pointer-events-none absolute bottom-12 left-3 rounded bg-popover px-2 py-1 text-xs"
                    >
                      {groupMove.pickingOrigin
                        ? mode === "3D"
                          ? "Ursprung frei anklicken · sichtbare Wandecken aller Geschosse rasten ein"
                          : "Bewegungsursprung im Grundriss anklicken"
                        : groupMove.axis === "z"
                          ? "Z: Maus oder signierten Versatz eingeben · Klick platziert · Esc verwirft"
                          : "Klick platziert die Auswahl · Tab: Länge/Winkel · Esc verwirft"}
                    </p>
                  )}
                  {tool === "wall" && (
                    <p
                      role="status"
                      className="pointer-events-none absolute bottom-12 left-3 rounded bg-popover px-2 py-1 text-xs"
                    >
                      Wandkette: Klick setzt Abschnitt · Doppelklick/Enter beendet · Esc verwirft
                    </p>
                  )}
                  <InteractionInput
                    interaction={interaction}
                    position={pinnedInput ?? demandPosition}
                    onPosition={pinInput}
                    onResetPosition={unpinInput}
                  />
                </>
              )}
              {(modelError || editing.error) && (
                <p
                  role="alert"
                  className="absolute left-3 top-20 z-30 max-w-sm rounded bg-popover p-2 text-xs text-destructive"
                >
                  {modelError || editing.error}
                </p>
              )}
              {exportMessage && (
                <p
                  role="status"
                  className="pointer-events-none absolute left-3 top-14 z-40 max-w-sm rounded border border-border bg-popover/95 px-3 py-2 text-xs text-foreground shadow-lg"
                >
                  {exportMessage}
                </p>
              )}
              {!referenceSelection.selecting && (
                <AiCommandBar
                  calibration={calibration.commandContext}
                  onFocus={() => setDemandOpen(false)}
                  targets={selections}
                  visibility={visibility}
                  project={project}
                  onExecute={(preview) => {
                    const next = applySelectionCommand(
                      project,
                      selections,
                      visibility,
                      preview,
                      calibration.commandContext,
                    );
                    cancelInteraction();
                    setDemandOpen(false);
                    dispatchEditing({ type: "project", project: next });
                  }}
                />
              )}
              <div
                className="pointer-events-none absolute left-3 top-12 z-30 rounded border border-border bg-popover/70 px-2 py-1 font-mono text-[9px] text-muted-foreground opacity-0 backdrop-blur transition-opacity data-[visible=true]:opacity-100"
                data-visible={notice !== "Ready"}
              >
                {notice}
              </div>
              {fullscreen && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-3 top-12 z-40 h-7 bg-popover/80 text-[10px]"
                  onClick={() => setFullscreen(false)}
                >
                  Exit fullscreen
                </Button>
              )}
              {!navigatorOpen && !fullscreen && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-3 top-12 z-30 size-8 bg-popover/75"
                  onClick={() => setNavigatorOpen(true)}
                  aria-label="Open project navigator"
                >
                  <PanelRightOpen />
                </Button>
              )}
            </div>
          </div>
          <section
            ref={propertiesRef}
            tabIndex={-1}
            aria-label="Werkzeugeigenschaften"
            className="glass-panel-strong absolute left-2 top-2 z-20 overflow-auto rounded-lg px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ height: PROPERTIES_HEIGHT, right: insets.right || PALETTE_GAP }}
          >
            <>
              <div className="mb-1 flex items-center gap-3">
                <h2 className="text-xs font-semibold">Werkzeugeigenschaften</h2>
                {tool === "select" && selection?.kind === "wall" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={referenceSelection.selecting}
                    onClick={() => {
                      cancelInteraction();
                      setDemandOpen(false);
                      setCornerWall(selection.id);
                    }}
                  >
                    Wandanschluss vorschauen
                  </Button>
                )}
                {tool === "select" && (
                  <LayerProperties
                    key={`layer:${propertyFormKey(project, selection)}`}
                    project={project}
                    selection={selection}
                    disabled={referenceSelection.selecting}
                    onAssign={(base, target, layerId) => {
                      if (referenceSelection.selecting) return;
                      dispatchEditing({
                        type: "assign-layer",
                        base,
                        target,
                        selection: currentSelection.current,
                        layerId,
                      });
                      setDemandOpen(false);
                      setModelError("");
                    }}
                  />
                )}
              </div>
              {imageTool.active || imageTool.busy || imageTool.error ? (
                <div className="flex items-center gap-3 text-xs">
                  <label>
                    Bildbreite (m)
                    <input
                      aria-label="Bildbreite (m)"
                      className="ml-2 w-24 rounded border bg-background p-1"
                      value={imageTool.width}
                      onChange={(e) => imageTool.setWidth(e.target.value)}
                    />
                  </label>
                  <span>
                    {imageTool.busy
                      ? "Bild wird geprüft…"
                      : imageTool.error || "Obere linke Ecke anklicken · Esc: Abbruch"}
                  </span>
                  <Button size="sm" onClick={imageTool.cancel}>
                    Bildimport abbrechen
                  </Button>
                </div>
              ) : tool === "measure" ? (
                <div className="flex items-center gap-3 text-xs">
                  <label>
                    Messart{" "}
                    <select
                      aria-label="Messart"
                      value={measurementMode}
                      onChange={(e) => setMeasurementMode(e.target.value as MeasurementMode)}
                      className="rounded border bg-background p-1"
                    >
                      <option value="distance">Strecke</option>
                      <option value="area">Fläche</option>
                      <option value="angle">Winkel</option>
                    </select>
                  </label>
                  <span role="status">
                    {measurementMode === "angle"
                      ? "Schenkelpunkt → Scheitel → Schenkelpunkt · Esc: Beenden"
                      : measurementMode === "area"
                        ? "Punkte setzen · Doppelklick schließt · Danach Klick für neue Messung · Esc: Beenden"
                        : "Zwei Punkte anklicken · Danach Klick für neue Messung · Esc: Beenden"}
                  </span>
                  <Button size="sm" variant="ghost" onClick={measurement.reset}>
                    Neue Messung
                  </Button>
                  {measurement.error && <span role="alert">{measurement.error}</span>}
                </div>
              ) : tool === "wall" ||
                tool === "column" ||
                tool === "stair" ||
                tool === "section" ||
                tool === "dimension" ||
                tool === "text" ||
                tool === "window" ||
                tool === "door" ? (
                toolFields(tool)
              ) : tool === "room" && mode === "2D" ? (
                <RoomToolFields
                  construction={roomConstruction}
                  onConstruction={(next) => {
                    setPathPoints([]);
                    setRoomConstruction(next);
                  }}
                  value={toolDefaults.room}
                  onChange={toolDefaults.setRoom}
                  layers={project.layers}
                  nextNumber={nextProjectRoomNumber(project)}
                  onOpenSettings={() => {
                    setSettingsWindow({ mode: "tool", tool: "room", section: "height-lines" });
                  }}
                />
              ) : tool === "roof" && mode === "2D" ? (
                <RoofToolFields
                  construction={hatchConstruction}
                  onConstruction={(construction) => {
                    setPathPoints([]);
                    setHatchConstruction(construction);
                  }}
                  value={toolDefaults.roof}
                  onChange={toolDefaults.setRoof}
                  layers={project.layers}
                  phase={roofPhase ?? "line"}
                />
              ) : (tool === "slab" || tool === "hatch" || tool === "line") && mode === "2D" ? (
                toolFields(tool)
              ) : selections.length > 1 ? (
                <p className="p-3 text-xs text-muted-foreground" role="status">
                  {selections.length} Elemente ausgewählt.{" "}
                  {mode === "3D"
                    ? "Gemeinsam bewegen: im Grundriss, direkt in 3D oder per Modellbefehl."
                    : "Im Elementmenü „Auswahl frei bewegen“ wählen, dann Ursprung und Ziel anklicken."}
                </p>
              ) : (
                <BimInspector
                  key={propertyFormKey(project, selection)}
                  project={project}
                  selection={selection}
                  onChange={changeProject}
                  onWallOffset={(base, wallId, offset) =>
                    dispatchEditing({
                      type: "wall-offset",
                      base,
                      selection,
                      request: { projectId: base.id, wallId, offset },
                    })
                  }
                />
              )}
            </>
          </section>
          {railShown && (
            <div className="absolute bottom-2 left-2 z-20" style={{ top: insets.top }}>
              <ToolRail
                activeTool={tool}
                collapsed={railCollapsed}
                onSelect={selectTool}
                onToggle={() => setRailCollapsed((value) => !value)}
                onSettings={openToolDefaults}
              />
            </div>
          )}
          {navigatorShown && (
            <div className="absolute bottom-2 right-2 top-2 z-20" style={{ width: navigatorWidth }}>
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Navigatorbreite ziehen"
                title="Ziehen: Breite des Navigators"
                className="absolute -left-2 bottom-0 top-0 w-2 cursor-col-resize rounded hover:bg-primary/30"
                onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
                onPointerMove={(event) => {
                  if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                  const stage = stageRef.current?.getBoundingClientRect();
                  if (stage) setNavigatorWidth(stage.right - PALETTE_GAP - event.clientX);
                }}
              />
              <>
                <ProjectNavigator
                  onBuildingChange={(base, change) =>
                    dispatchEditing({ type: "building", base, change })
                  }
                  onRenameStorey={(base, name) =>
                    dispatchEditing({
                      type: "rename-storey",
                      base,
                      request: { projectId: base.id, storeyId: storeyOf(base).id, name },
                    })
                  }
                  getPlanCapture={getPlanCapture}
                  activeDocumentId={activeDocumentId}
                  onOpenDocument={(id) => {
                    cancelInteraction();
                    setSelection(null);
                    setDemandOpen(false);
                    setTool("select");
                    setMode("2D");
                    const doc = project.drawingDocuments?.find((d) => d.id === id);
                    const source = project.modelViews?.find((v) => v.id === doc?.modelViewId);
                    if (!source) return;
                    try {
                      selectWorkingStorey(project, project, source.storeyId);
                    } catch {
                      dispatchEditing({
                        type: "working-storey",
                        base: project,
                        storeyId: source.storeyId,
                      });
                      return;
                    }
                    dispatchEditing({
                      type: "working-storey",
                      base: project,
                      storeyId: source.storeyId,
                    });
                    setActiveDocumentId(id);
                  }}
                  onDocumentVisibility={(base, documentId, layerId, visible) =>
                    dispatchEditing({
                      type: "visibility",
                      base,
                      action: { kind: "set", layerId, visible },
                      scope: { kind: "drawing-document", documentId },
                    })
                  }
                  onDocumentAction={(base, action) =>
                    dispatchEditing({ type: "document", base, action })
                  }
                  project={project}
                  active={selections.length ? selections.map((t) => t.id) : [storeyOf(project).id]}
                  onClose={() => setNavigatorOpen(false)}
                  onSectionSettings={openSectionWindow}
                  onSelect={(id, _label, toggle) => {
                    if (id === SECTIONS_FOLDER_ID) return;
                    if (sectionIds.has(id)) return selectCanvasTab(sectionTab(id));
                    if (project.storeys.some((s) => s.id === id)) {
                      setActiveSectionId(null);
                      cancelInteraction();
                      setSelection(null);
                      setDemandOpen(false);
                      setTool("select");
                      setActiveDocumentId(null);
                      dispatchEditing({ type: "working-storey", base: project, storeyId: id });
                      return;
                    }
                    if (activeDocumentId) return;
                    selectElement(
                      selectionIndex(project).get(id) ?? null,
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      toggle,
                    );
                  }}
                />
              </>
            </div>
          )}
        </div>
        {!fullscreen && (
          <StatusBar
            storeyName={storeyOf(project).name}
            recoveryStatus={
              <LocalRecoveryStatus
                autosave={autosave.state}
                project={project}
                context={editing.projectLoad ?? project.id}
                onOpen={() => setRecoveryOpen(true)}
              />
            }
            zoomSlot={setZoomSlot}
            gridSettings={gridSettings}
            onGridSettings={setGridSettings}
            grid={grid}
            snap={snap}
            ortho={ortho}
            selection={selections.length}
            onGrid={() => setGrid((value) => !value)}
            onSnap={() => setSnap((value) => !value)}
            onOrtho={() => setOrtho((value) => !value)}
          />
        )}
      </main>
    </CadAppearanceProvider>
  );
}
