import { RoomSettingsPanel, RoomToolFields } from "./RoomToolFields";
import { enclosedRoomOutline } from "@/application/rooms/enclosure";
import { nextProjectRoomNumber } from "@/application/rooms/actions";
import { isDefaultHeightLineList } from "@/domain/elements/room/height-line";
import { RoomListPanel } from "./RoomListPanel";
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
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
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
import { ProjectNavigator } from "./ProjectNavigator";
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
  const [layout, setLayout] = useState<ViewportLayout>("single");
  const [zoomSlot, setZoomSlot] = useState<HTMLDivElement | null>(null);
  const [grid, setGrid] = useState(true);
  const [snap, setSnap] = useState(true);
  const [displaySettingsOpen, setDisplaySettingsOpen] = useState(false);
  const { wallWidth, setWallWidth } = useCanvasDisplaySettings();
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
  const [roofSettingsOpen, setRoofSettingsOpen] = useState(false);
  const roofPhase: RoofPhase | null =
    tool === "roof" ? (!roofLine ? "line" : !roofRise ? "side" : "outline") : null;
  // Room tool (docs/ROOM_ELEMENT.md, R2): own construction, by default a click between walls.
  const [roomConstruction, setRoomConstruction] = useState<HatchConstruction | "walls">("walls");
  const [roomSettingsOpen, setRoomSettingsOpen] = useState(false);
  const [roomSettingsSection, setRoomSettingsSection] = useState<string | undefined>();
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
    setTool(next);
    if (next === "window" || next === "door" || next === "measure") setDemandOpen(false);
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
      next === "measure" ||
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
    const area =
      selection.kind === "slab" || selection.kind === "roof" || selection.kind === "room";
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
      }[selection.kind as "slab" | "roof" | "room"];
      showNotice(
        inSolid
          ? `${words[0]}umriss im Grundriss bearbeiten; in 3D wird ${words[1]} als Ganzes bewegt.`
          : `${words[2]}: Element frei bewegen oder auf X-/Y-Achse.`,
      );
      return;
    }
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
  const openToolSettings = (kind: NonNullable<Selection>["kind"] | null) => {
    const owner: ToolId | null =
      kind === null ? tool : kind === "reference" ? null : (kind as ToolId);
    if (!owner) return setModelError("Bildreferenzen haben kein Werkzeug.");
    if (owner !== tool) selectTool(owner);
    if (owner === "roof") setRoofSettingsOpen(true);
    else if (owner === "room") setRoomSettingsOpen(true);
    else {
      setFullscreen(false);
      propertiesRef.current?.focus();
    }
  };
  const later = (what: string) => `Kommt mit ${what}.`;
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
        run: () => openToolSettings(target?.kind ?? null),
      },
      "separator",
      { id: "trim", label: "Trimmen…", disabled: later("dem Trimmen (L04b)"), run: () => {} },
      {
        id: "untrim",
        label: "Trimmung aufheben",
        disabled: later("dem Trimmen (L04b)"),
        run: () => {},
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

  const drawPoint = (point: Point, candidate?: SnapCandidate | null) => {
    setModelError("");
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

  return (
    <CadAppearanceProvider projectId={project.id} penSet={project.penSet ?? defaultPenSet}>
      <CanvasDisplaySettings
        open={displaySettingsOpen}
        onOpenChange={setDisplaySettingsOpen}
        wallWidth={wallWidth}
        onWallWidth={setWallWidth}
      />
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
      <RoomSettingsPanel
        open={roomSettingsOpen}
        section={roomSettingsSection}
        onOpenChange={(open) => {
          setRoomSettingsOpen(open);
          if (!open) setRoomSettingsSection(undefined);
        }}
        construction={roomConstruction}
        onConstruction={(next) => {
          setPathPoints([]);
          setRoomConstruction(next);
        }}
        value={toolDefaults.room}
        onChange={toolDefaults.setRoom}
        layers={project.layers}
      />
      <RoofSettingsPanel
        open={roofSettingsOpen}
        onOpenChange={setRoofSettingsOpen}
        construction={hatchConstruction}
        onConstruction={(construction) => {
          setPathPoints([]);
          setHatchConstruction(construction);
        }}
        value={toolDefaults.roof}
        onChange={toolDefaults.setRoof}
        layers={project.layers}
      />
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
            onMode={(next) => {
              if (activeDocumentId) {
                showNotice("Dieses Abbild ist ein 2D-Grundriss.");
                return;
              }
              groupMove.cancel();
              dispatchEditing({ type: "cancel" });
              setMode(next);
              setWallChain(null);
              setPathPoints([]);
              if (next === "3D") setTool("select");
            }}
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
              position={demandPosition}
              onPosition={setDemandPosition}
              pointIndex={pickedPoint.index}
              edgeIndex={pickedPoint.edgeIndex ?? null}
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
        {cornerWall && (
          <CornerPreviewDialog
            viewContext={viewContext}
            project={project}
            firstId={cornerWall}
            visibility={visibility}
            onClose={() => setCornerWall(null)}
          />
        )}
        <section
          ref={propertiesRef}
          tabIndex={-1}
          aria-label="Werkzeugeigenschaften"
          className="glass-panel-strong h-[130px] shrink-0 overflow-auto rounded-lg px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                    ? "Schenkelpunkt â†’ Scheitel â†’ Schenkelpunkt · Esc: Beenden"
                    : measurementMode === "area"
                      ? "Punkte setzen · Doppelklick schließt · Danach Klick für neue Messung · Esc: Beenden"
                      : "Zwei Punkte anklicken · Danach Klick für neue Messung · Esc: Beenden"}
                </span>
                <Button size="sm" variant="ghost" onClick={measurement.reset}>
                  Neue Messung
                </Button>
                {measurement.error && <span role="alert">{measurement.error}</span>}
              </div>
            ) : tool === "wall" ? (
              <WallDrawingFields
                project={project}
                value={toolDefaults.wall}
                onChange={(values) => {
                  cancelInteraction();
                  toolDefaults.setWall(values);
                }}
              />
            ) : tool === "window" ? (
              <WindowPlacementFields
                layers={project.layers}
                value={windowTool.dimensions}
                onChange={windowTool.setDimensions}
                error={windowTool.error}
                precision={windowTool.precision}
                onPrecision={windowTool.setPrecision}
                pickingHost={windowTool.pickingHost}
              />
            ) : tool === "door" ? (
              <DoorPlacementFields
                layers={project.layers}
                value={doorTool.dimensions}
                onChange={doorTool.setDimensions}
                error={doorTool.error}
                precision={doorTool.precision}
                onPrecision={doorTool.setPrecision}
                pickingHost={doorTool.pickingHost}
              />
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
                  setRoomSettingsSection("height-lines");
                  setRoomSettingsOpen(true);
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
            ) : tool === "slab" && mode === "2D" ? (
              <SlabToolFields
                construction={hatchConstruction}
                onConstruction={(construction) => {
                  cancelInteraction();
                  setHatchConstruction(construction);
                }}
                value={toolDefaults.slab}
                onChange={toolDefaults.setSlab}
              />
            ) : tool === "hatch" && mode === "2D" ? (
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
                  onChange={(patternSize) =>
                    toolDefaults.setHatch({ ...toolDefaults.hatch, patternSize })
                  }
                />
                <HatchFillFields
                  value={hatchFill}
                  onChange={(fill) => toolDefaults.setHatch({ ...toolDefaults.hatch, fill })}
                />
                <HatchPaintFields
                  label="Hintergrund"
                  value={toolDefaults.hatch.background}
                  onChange={(background) =>
                    toolDefaults.setHatch({ ...toolDefaults.hatch, background })
                  }
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
              </section>
            ) : tool === "line" && mode === "2D" ? (
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
                  onChange={(appearance) =>
                    toolDefaults.setLine({ ...toolDefaults.line, ...appearance })
                  }
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
                <span className="text-xs">{pathPoints.length} Punkte · Esc verwirft</span>
                {lineKind === "polyline" && (
                  <span className="text-xs">
                    Doppelklick zum Abschließen · Enter im Feld: nächster Punkt · Enter im
                    Grundriss: Abschluss
                  </span>
                )}
                <Button size="sm" variant="ghost" onClick={() => selectTool("select")}>
                  Zeichnen abbrechen
                </Button>
              </section>
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
        <div className="relative flex min-h-0 flex-1 gap-2">
          {(!fullscreen || !!activeDocumentId) && (
            <ToolRail
              activeTool={tool}
              collapsed={railCollapsed}
              onSelect={selectTool}
              onToggle={() => setRailCollapsed((value) => !value)}
              onSettings={(next) => {
                if (next === "roof") setRoofSettingsOpen(true);
                if (next === "room") setRoomSettingsOpen(true);
              }}
            />
          )}
          <ResizablePanelGroup orientation="horizontal" className="min-w-0 flex-1">
            <ResizablePanel
              id="workspace"
              minSize="55%"
              defaultSize={navigatorOpen && !fullscreen ? "79%" : "100%"}
            >
              <div className="relative h-full min-w-0 overflow-hidden rounded-lg border border-border bg-workspace shadow-[0_20px_60px_var(--glass-deep)]">
                <div className="absolute left-3 top-12 z-40 max-w-lg">
                  <RasterBudgetNotice project={project} />
                </div>
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
                    <ViewportManager
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
                        (tool === "wall" || pathDrawing || tool === "roof" || tool === "room") &&
                        mode === "2D"
                      }
                      endpointSnap={
                        pathDrawing ||
                        tool === "roof" ||
                        tool === "measure" ||
                        tool === "select" ||
                        tool === "wall" ||
                        tool === "window" ||
                        tool === "door"
                      }
                      hoverDwellMs={hoverDwellMs}
                      start={pathDrawing ? (pathPoints.at(-1) ?? null) : wallStart}
                      draftPoints={pathDrawing ? pathPoints : []}
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
                      gridSettings={gridSettings}
                      snap={snap}
                      ortho={ortho}
                      onSelect={selectElement}
                      onContourStretch={(target, index, anchor) => {
                        if (target.kind === "reference" || target.kind === "door") return;
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
                      position={demandPosition}
                      onPosition={setDemandPosition}
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
                    className="absolute right-3 top-3 z-40 h-7 bg-popover/80 text-[10px]"
                    onClick={() => setFullscreen(false)}
                  >
                    Exit fullscreen
                  </Button>
                )}
                {!navigatorOpen && !fullscreen && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-3 top-3 z-30 size-8 bg-popover/75"
                    onClick={() => setNavigatorOpen(true)}
                    aria-label="Open project navigator"
                  >
                    <PanelRightOpen />
                  </Button>
                )}
              </div>
            </ResizablePanel>
            {navigatorOpen && !fullscreen && (
              <>
                <ResizableHandle withHandle className="mx-1 bg-transparent hover:bg-primary/30" />
                <ResizablePanel id="navigator" defaultSize="21%" minSize="16%" maxSize="32%">
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
                    active={
                      selections.length ? selections.map((t) => t.id) : [storeyOf(project).id]
                    }
                    onClose={() => setNavigatorOpen(false)}
                    onSelect={(id, _label, toggle) => {
                      if (project.storeys.some((s) => s.id === id)) {
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
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
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
