import { RoomSettingsPanel, RoomToolFields } from "./RoomToolFields";
import { enclosedRoomOutline } from "@/application/rooms/enclosure";
import { nextProjectRoomNumber } from "@/application/rooms/actions";
import { isDefaultHeightLineList } from "@/domain/elements/room/height-line";
import { RoomListPanel } from "./RoomListPanel";
import { ElementListPanel } from "./ElementListPanel";
import { FilterWindow, type FilterPlace } from "./FilterWindow";
import { placedDrawingKey, sameDrawingKey } from "@/rendering/viewport/placed-freshness";
import { placedDrawingSnap } from "@/application/snapping/placed-sources";
import { filterElements, NO_CRITERIA, similarCriteria } from "@/application/selection/filter";
import { sectionShownIds } from "@/rendering/viewport/section-drawing";
import { ToolSettingsWindow } from "./ToolSettingsWindow";
import { OpeningInsertFields } from "./OpeningInsertFields";
import { setOpeningInsert } from "@/application/openings/inserts";
import {
  checkedDoorInsert,
  checkedWindowInsert,
  DOOR_INSERT_DEFAULTS,
  WINDOW_INSERT_DEFAULTS,
} from "@/domain/elements/window/insert";
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
import { commandForKey, isCopyToggle, resetHotkeys, setHotkey } from "@/application/hotkeys/keys";
import { HotkeySettings } from "./HotkeySettings";
import { copyTransformed } from "@/application/selection/copy-transform";
import { CopyCursorBadge } from "./CopyCursorBadge";
import { useSelectionRotate } from "./useSelectionRotate";
import { hotkeyLabel, resolvedHotkeys, type HotkeyCommand } from "@/domain/hotkeys/model";
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
import { WallAssemblyFields } from "./WallAssemblyFields";
import {
  flipWallAssembly,
  saveAssemblyLibrary,
  setWallAssembly,
} from "@/application/walls/assembly";
import { assemblyThickness, projectWallAssemblies } from "@/domain/elements/wall/assembly";
import { offsetAtThickness } from "@/domain/elements/wall/axis-position";
import { ColumnFields } from "./ColumnFields";
import { RailingFields } from "./RailingFields";
import { RoofWindowFields } from "./RoofWindowFields";
import { contains as polygonContains } from "@/geometry/polygons/contains";
import { DimensionToolFields } from "./DimensionToolFields";
import { TextFields } from "./TextFields";
import { TextEditorOverlay } from "./TextEditorOverlay";
import { addText } from "@/application/texts/actions";
import { planDenominator } from "@/domain/views/scale";
import { addDimension, updateDimension } from "@/application/dimensions/actions";
import { dimensionPointAt } from "@/domain/elements/dimension/model";
import { addColumn, updateColumn } from "@/application/columns/actions";
import { columnValues } from "@/application/columns/defaults";
import { addRailing, updateRailing } from "@/application/railings/actions";
import { railingValues } from "@/application/railings/defaults";
import { addRoofWindowAt, updateRoofWindow } from "@/application/roof-windows/actions";
import { roofWindowValues } from "@/application/roof-windows/defaults";
import { roofWindowCentre } from "@/application/roof-windows/actions";
import { addStair, updateStair } from "@/application/stairs/actions";
import { stairValues } from "@/application/stairs/defaults";
import { stairDirectionTo, stairTreadForLength, stairTurnTo } from "@/domain/elements/stair/model";
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
import { SlabOpeningToolFields } from "./SlabOpeningToolFields";
import { ConstructionPicker } from "./ConstructionPicker";
import { slabOpeningOutline } from "@/domain/elements/slab/opening";
import { DoorPlacementFields } from "./DoorPlacementFields";
import { useSelectionMove } from "./useSelectionMove";
import { useElementSelection } from "./useElementSelection";
import { selectionIndex, selectTargets, type SelectionSet } from "@/application/selection/state";
import type { SnapCandidate } from "@/constraints/snapping/engine";
import { CanvasDisplaySettings } from "./CanvasDisplaySettings";
import { useCanvasDisplaySettings } from "./useCanvasDisplaySettings";
import { usePictogramSettings } from "./usePictogramSettings";
import { beginWallChain, appendWallChain, finishWallChain } from "@/application/drawing/wall-chain";
import type { WallChain } from "@/application/drawing/wall-chain";
import { defaultGridSettings, type GridSettings } from "@/application/snapping/grid-settings";
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
import {
  cloneElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ComponentProps,
  type ReactElement,
} from "react";
import { cn } from "@/lib/utils";
import {
  keptSplit,
  openSplit,
  shownSplit,
  splitFieldRect,
  splitFieldTab,
  type CanvasSplit,
  type SplitDirection,
} from "@/application/views/canvas-split";
import { SplitDivider } from "./SplitDivider";
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
import { ELEVATIONS_FOLDER_ID, SECTIONS_FOLDER_ID, ProjectNavigator } from "./ProjectNavigator";
import { StatusBar } from "./StatusBar";
import { ToolRail } from "./ToolRail";
import { TracingPanel } from "./TracingPanel";
import {
  tracingDefaults,
  tracingOutlines,
  tracingSnap,
  type Tracing,
} from "@/application/views/tracing";
import { setLineSegmentLength } from "@/application/lines/actions";
import { ToolRailCustomizer } from "./ToolRailCustomizer";
import { useToolLayout } from "./useToolLayout";
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
import type { ToolId, ViewMode } from "./cad-types";
import { LineStyleFields } from "./LineControls";
import { LayerProperties } from "./LayerProperties";
import { LayerManager } from "./LayerManager";
import { CanvasTabs } from "./CanvasTabs";
import {
  canvasModeOf,
  canvasTabKind,
  canvasViewOf,
  closeCanvasTab,
  existingCanvasTabs,
  sectionTab,
  tabSectionId,
  layoutTab,
  tabLayoutId,
  titleBlockTab,
  tabTitleBlockId,
  withCanvasTab,
  type CanvasTabKind,
  type CanvasView,
} from "@/application/views/canvas-tabs";
import {
  SECTION_TOOL_DEFAULTS,
  ELEVATION_TOOL_DEFAULTS,
  addFourElevations,
  addSection,
  nextSectionLabel,
  removeSection,
  updateSection,
} from "@/application/sections/actions";
import { sectionLookTo } from "@/domain/views/sections";
import { SectionFields } from "./SectionFields";
import { SectionProperties } from "./SectionProperties";
import { escapeStep } from "./escape-step";
import { SectionDrawingView } from "./SectionDrawingView";
import { cachedSectionDrawing, sectionFraming } from "./section-graphic";
import { LayoutSettingsWindow, type LayoutDraftTarget } from "./LayoutSettingsWindow";
import {
  layoutFolderTree,
  layoutSheet,
  projectLayouts,
  projectMasterLayouts,
  sheetSize,
} from "@/domain/views/layouts";
import { changeLayouts, layoutUnderlay } from "@/application/views/layouts";
import { spaceBackdrop, spaceLens } from "@/application/views/title-block-space";
import { LayoutBar } from "./LayoutBar";
import type { PdfRequest } from "./CadViewport";
import type { PlacedDrawingView } from "./BimPlan";
import { placeDrawing, setDrawing } from "@/application/drawings/actions";
import { DrawingElementFields, DrawingToolFields } from "./DrawingFields";
import { documentSource } from "@/application/drawings/sources";
import { frameMask, maskOnPaper, type PlacedDrawing } from "@/domain/elements/drawing/model";
import { changeTitleBlocks, titleBlockUnderlay } from "@/application/views/title-blocks";
import { TitleBlockBar } from "./TitleBlockBar";
import { SectionDocumentWindow } from "./SectionDocumentWindow";
import { ProjectInfoWindow } from "./ProjectInfoWindow";
import { setProjectInfo } from "@/application/views/auto-texts";
import { drawingInfo } from "@/application/views/drawing-info";
import { changeDrawingDocument } from "@/application/views/documents";

const PAPER_GRID_SETTINGS: GridSettings = Object.freeze({ enabled: false, spacing: 0.001 });
/** Tools of a layout: the last fixes by hand, no dimensions (docs/LAYOUTS.md, LZ1). */
const LAYOUT_TOOLS: ReadonlySet<ToolId> = new Set<ToolId>([
  "select",
  "line",
  "text",
  "hatch",
  "drawing",
]);
/** Tools of the Plankopfplaner: drawing only, nothing of the building (PK2). */
const TITLE_BLOCK_TOOLS: ReadonlySet<ToolId> = new Set<ToolId>([
  "select",
  "line",
  "text",
  "hatch",
  "dimension",
  "measure",
]);
import {
  addHeightMarks,
  removeHeightMarks,
  updateHeightMarks,
} from "@/application/sections/height-marks";

/** What a placed drawing shows, kept at its last update (docs/LAYOUTBUCH.md). */
type FrozenDrawing = Pick<
  PlacedDrawingView,
  "documentId" | "limit" | "center" | "denominator" | "content"
>;

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
      // The shown drawing area; hidden tabs keep theirs (docs/TABS.md).
      .querySelector('[data-canvas-kind]:not([data-hidden-tab]) [aria-label="BIM floor plan"]')
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
  const [hotkeysOpen, setHotkeysOpen] = useState(false);
  const [lineCreatorOpen, setLineCreatorOpen] = useState(false);
  const [hatchLibraryOpen, setHatchLibraryOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [roomListOpen, setRoomListOpen] = useState(false);
  const [elementListOpen, setElementListOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>("distance");
  const [tool, setTool] = useState<ToolId>("select");
  const [mode, setMode] = useState<ViewMode>("2D");
  // Canvas tabs (docs/SCHNITT.md, SC1): the active tab is the current mode; a mode without a
  // tab opens one, wherever the mode is switched.
  const [canvasTabs, setCanvasTabs] = useState<CanvasView[]>(["plan"]);
  // Two tabs side by side or one above the other (docs/SPLITSCREEN.md); session state only.
  const [canvasSplit, setCanvasSplit] = useState<CanvasSplit | null>(null);
  const lastOfKind = useRef(new Map<CanvasTabKind, CanvasView>());
  // One drawing area per tab kind (docs/TABS.md): the hidden ones keep their content and render
  // nothing until shown again; switching back only shows them.
  const keptViewports = useRef(new Map<"plan" | "3d" | "layout", ReactElement>());
  const keptProjectId = useRef<string | null>(null);
  // A section tab over the model views (docs/SCHNITT.md, SC2); null: the mode's view.
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  // A layout or master layout open as a canvas tab (docs/LAYOUTS.md, LA4).
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [layoutWindow, setLayoutWindow] = useState<LayoutDraftTarget | null>(null);
  const [projectInfoOpen, setProjectInfoOpen] = useState(false);
  // PDF export of a layout, master layout or Plankopf (docs/PDF_EXPORT.md, PDF1).
  const [pdfRequest, setPdfRequest] = useState<(PdfRequest & { target: string }) | null>(null);
  const [lastTitleBlockId, setLastTitleBlockId] = useState<string | null>(null);
  // A section or elevation document open in its section tab (docs/ABBILDER.md, AB2).
  const [sectionDocumentId, setSectionDocumentId] = useState<string | null>(null);
  const [sectionDocumentWindow, setSectionDocumentWindow] = useState<string | null>(null);
  // Section tool: start, then end; click 3 chooses the viewing side. Session state only.
  const [sectionStart, setSectionStart] = useState<Point | null>(null);
  const [sectionEnd, setSectionEnd] = useState<Point | null>(null);
  const [sectionDefaults, setSectionDefaults] = useState(SECTION_TOOL_DEFAULTS);
  // Elevation tool (docs/ANSICHTEN.md, A1): same click flow and state, own defaults.
  const [elevationDefaults, setElevationDefaults] = useState(ELEVATION_TOOL_DEFAULTS);
  const [sectionWindow, setSectionWindow] = useState<string | null>(null);
  // Transparency trace (S4): session state only; the storey falls back to the default.
  const [tracingState, setTracing] = useState<Tracing | null>(null);
  // Selected section line in plan (SC5): grips to move it, lengthen or shorten it.
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [zoomSlot, setZoomSlot] = useState<HTMLDivElement | null>(null);
  const [grid, setGrid] = useState(true);
  const [snap, setSnap] = useState(true);
  const [displaySettingsOpen, setDisplaySettingsOpen] = useState(false);
  const { wallWidth, setWallWidth, cutFill, setCutFill, showRenovation, setShowRenovation } =
    useCanvasDisplaySettings();
  const { pictograms, setPictograms, resetPictograms } = usePictogramSettings();
  // Rasterfang starts off: the Rasterengine snaps to points and lines, the grid only on demand.
  const [planGridSettings, setPlanGridSettings] = useState<GridSettings>({
    ...defaultGridSettings,
    enabled: false,
  });
  // Paper (layouts, Plankopf) snaps to its own, fine grid: 1 mm (docs/LAYOUTS.md).
  const [paperGridSettings, setPaperGridSettings] = useState(PAPER_GRID_SETTINGS);
  const [ortho, setOrtho] = useState(false);
  const [hoverDwellMs, setHoverDwellMs] = useState(DEFAULT_HOVER_DWELL_MS);
  // Compact rail only (WL1); the arrangement is remembered in this browser.
  const { toolLayout, setToolLayout } = useToolLayout();
  const [railCustomizing, setRailCustomizing] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(true);
  const [cornerWall, setCornerWall] = useState<string | null>(null);
  const [editing, dispatchEditing] = useProjectEditing(
    () => ensureDocumentFolder(initialProject ?? createStartProject()),
    activeDocumentId,
  );
  const { history, session: pendingSession } = editing;
  const layerActivation = editing.documentLayerActivation;
  // The real project; in the Plankopfplaner the tools see the title block's lens (PK2).
  const realProject = history.present;
  const space = editing.space;
  const project = space ? spaceLens(realProject, space) : realProject;
  const gridSettings = space ? paperGridSettings : planGridSettings;
  const activeBlock =
    space?.kind === "title-block"
      ? realProject.titleBlocks?.find((t) => t.id === space.id)
      : undefined;
  // A layout or master layout drawn on (docs/LAYOUTS.md, LZ1), with the sheet it uses.
  const layoutSpace = (() => {
    if (space?.kind !== "layout") return null;
    const layout = projectLayouts(realProject).find((l) => l.id === space.id);
    const master = projectMasterLayouts(realProject).find((m) => m.id === space.id);
    if (!layout && !master) return null;
    return {
      id: space.id,
      layout,
      master: layout
        ? projectMasterLayouts(realProject).find((m) => m.id === layout.masterId)
        : master,
      sheet: layout ? layoutSheet(realProject, layout) : master!.sheet,
    };
  })();
  const spaceTools = space ? (space.kind === "layout" ? LAYOUT_TOOLS : TITLE_BLOCK_TOOLS) : null;
  // Names the open view: its viewports are rebuilt on a change and keep a camera each (KA1).
  const viewKey =
    mode === "3D"
      ? "building-3d"
      : (activeDocumentId ??
        (activeBlock
          ? `${activeBlock.id}:${activeBlock.sheet.format}:${activeBlock.sheet.orientation}`
          : layoutSpace
            ? `layout:${layoutSpace.id}:${JSON.stringify(sheetSize(layoutSpace.sheet))}`
            : // One plan camera for every storey: zoom and position stay.
              "plan"));
  /** Fields of one placed drawing (ZW3): bar and settings window share them. */
  const drawingElementFields = (id: string, inline = false) => {
    const placed = storeyOf(project).drawings?.find((d) => d.id === id);
    const source = placed && drawingSource(placed.documentId);
    if (!placed || !source) return null;
    const limit = frameMask(source.framing, source.document.denominator);
    return (
      <DrawingElementFields
        key={`${id}:${JSON.stringify(placed.mask)}`}
        document={`${source.document.name} · 1:${source.document.denominator}`}
        layers={project.layers}
        layerId={placed.layerId}
        mask={placed.mask}
        limit={limit}
        inline={inline}
        onChange={(change) =>
          dispatchEditing({ type: "project", project: setDrawing(project, id, change, limit) })
        }
        onRefit={
          "section" in source
            ? () =>
                fitSectionFrame(
                  source.document.id,
                  `Ausschnitt von „${source.document.name}“ neu eingepasst`,
                )
            : undefined
        }
      />
    );
  };
  /** Opens the sheet (if needed) and exports it as PDF; the open view draws it at 100 %. */
  const exportPdf = (kind: "layout" | "block", id: string) => {
    const name =
      kind === "block"
        ? realProject.titleBlocks?.find((t) => t.id === id)?.name
        : (
            projectLayouts(realProject).find((l) => l.id === id) ??
            projectMasterLayouts(realProject).find((m) => m.id === id)
          )?.name;
    if (!name) return;
    const target = `${kind === "block" ? "title-block" : "layout"}:${id}`;
    if (!space || `${space.kind}:${space.id}` !== target)
      selectCanvasTab(kind === "block" ? titleBlockTab(id) : layoutTab(id));
    // Paper always shows the current state: an out-of-date layout is drawn anew first.
    const refreshed = kind === "layout" && staleLayouts.split("\n").includes(id);
    if (kind === "layout") refreshLayout(id);
    setPdfRequest({
      id: Date.now(),
      target,
      filename: `${name.replace(/[\\/:*?"<>|]+/g, "-").trim() || "Blatt"}.pdf`,
      onDone: (result) => {
        setPdfRequest(null);
        if (result.ok) {
          setModelError("");
          showNotice(refreshed ? `Plan aktualisiert · ${result.message}` : result.message);
        } else setModelError(result.message);
      },
    });
  };
  /**
   * A drawing document ready to place: a plan with its saved frame, or a section or elevation
   * (ZW4). A section keeps the frame it got when it was saved or first chosen (ZW5); one from
   * before ZW5 still follows the model until it is fixed.
   */
  const drawingSource = (documentId: string | null | undefined) => {
    const document = realProject.drawingDocuments?.find((d) => d.id === documentId);
    const view = realProject.modelViews?.find((v) => v.id === document?.modelViewId);
    if (!document || !view) return null;
    if (view.kind === "floor-plan") {
      if (!document.framing) return null;
      const content: PlacedDrawingView["content"] = {
        kind: "plan",
        source: documentSource(realProject, view.storeyId),
        hiddenLayerIds: document.hiddenLayerIds,
      };
      return { document, framing: document.framing, content };
    }
    const section = realProject.sections?.find((s) => s.id === view.sectionId);
    if (!section) return null;
    const framing = document.framing ?? sectionFraming(realProject, section, document.denominator);
    if (!framing) return null;
    const content: PlacedDrawingView["content"] = {
      kind: "section",
      drawing: cachedSectionDrawing(realProject, section),
      marks: section.heightMarks ?? [],
    };
    return { document, framing, content, section };
  };
  /** Fixes (or refits) the frame of a section document to its drawing now (ZW5). */
  const fitSectionFrame = (documentId: string, notice?: string) => {
    const source = drawingSource(documentId);
    if (!source || !("section" in source)) return;
    if (!notice && source.document.framing) return;
    const framing = sectionFraming(realProject, source.section, source.document.denominator);
    if (!framing) return setModelError("Der Schnitt sieht keine Bauteile.");
    dispatchEditing({
      type: "document",
      base: realProject,
      action: { kind: "framing", id: documentId, framing },
    });
    if (notice) showNotice(notice);
  };
  // Layout book (docs/LAYOUTBUCH.md, user wish 03.11.2026): a layout keeps its placed drawings at
  // the state of its last update. What they show is kept here per layout and drawing (memory
  // only, a new project starts current); a changed model or document marks the layout in the
  // navigator, a click there (or a PDF export) draws it anew.
  const frozenDrawings = useRef(
    new Map<string, Map<string, { key: readonly unknown[] | null; shown: FrozenDrawing }>>(),
  );
  const [frozenVersion, setFrozenVersion] = useState(0);
  const frozenProjectId = useRef(realProject.id);
  if (frozenProjectId.current !== realProject.id) {
    frozenProjectId.current = realProject.id;
    frozenDrawings.current.clear();
  }
  const refreshLayout = (layoutId: string) => {
    frozenDrawings.current.delete(layoutId);
    setFrozenVersion((v) => v + 1);
  };
  const staleLayouts = useMemo(() => {
    const stale: string[] = [];
    for (const [layoutId, drawings] of frozenDrawings.current)
      for (const { key, shown } of drawings.values())
        if (!sameDrawingKey(key, placedDrawingKey(realProject, shown.documentId))) {
          stale.push(layoutId);
          break;
        }
    return stale.sort().join("\n");
  }, [realProject, frozenVersion]);
  // Drawings on the open layout: the master's under it, then the layout's own (selectable).
  const placedDrawingViews = (() => {
    if (space?.kind !== "layout") return undefined;
    const backdrop = spaceBackdrop(realProject, space);
    let frozen = frozenDrawings.current.get(space.id);
    if (!frozen) frozenDrawings.current.set(space.id, (frozen = new Map()));
    const kept = frozen;
    const view = (d: PlacedDrawing, selectable: boolean): PlacedDrawingView | null => {
      // Position and mask belong to the layout and follow at once; the content waits.
      let entry = kept.get(d.id);
      if (!entry || entry.shown.documentId !== d.documentId) {
        const source = drawingSource(d.documentId);
        if (!source) return null;
        entry = {
          key: placedDrawingKey(realProject, d.documentId),
          shown: {
            documentId: d.documentId,
            limit: frameMask(source.framing, source.document.denominator),
            center: source.framing.center,
            denominator: source.document.denominator,
            content: source.content,
          },
        };
        kept.set(d.id, entry);
      }
      return {
        id: d.id,
        selectable,
        mask: d.mask,
        position: d.position,
        ...entry.shown,
      };
    };
    return [
      ...(backdrop ? (storeyOf(backdrop).drawings ?? []).map((d) => view(d, false)) : []),
      ...(storeyOf(project).drawings ?? []).map((d) => view(d, true)),
    ].filter((v): v is PlacedDrawingView => v !== null);
  })();
  // Snapping to what the placed drawings show (docs/LAYOUTBUCH.md): rebuilt only when a drawing
  // moves, is cropped or shows another state.
  const placedSnapMemo = useRef<{
    key: string;
    contents: object[];
    value: ReturnType<typeof placedDrawingSnap>;
  } | null>(null);
  const placedSnap = (() => {
    if (!placedDrawingViews?.length) return null;
    const key = placedDrawingViews
      .map((v) =>
        [
          v.id,
          v.position.x,
          v.position.y,
          v.mask.x0,
          v.mask.x1,
          v.mask.y0,
          v.mask.y1,
          v.center.x,
          v.center.y,
          v.denominator,
        ].join(","),
      )
      .join("|");
    const contents = placedDrawingViews.map((v) =>
      v.content.kind === "plan" ? v.content.source : v.content.drawing,
    );
    const last = placedSnapMemo.current;
    if (last && last.key === key && last.contents.every((c, i) => c === contents[i]))
      return last.value;
    const value = placedDrawingSnap(
      placedDrawingViews.map((v) => ({
        id: v.id,
        position: v.position,
        mask: v.mask,
        center: v.center,
        denominator: v.denominator,
        content:
          v.content.kind === "plan"
            ? v.content
            : {
                kind: "section" as const,
                drawing: v.content.drawing,
                rings: v.content.drawing.cuts.flatMap((c) => c.loops),
                paths: [
                  ...v.content.drawing.cuts.flatMap((c) => c.open),
                  ...v.content.drawing.views.flatMap((view) => view.edges),
                ],
              },
      })),
    );
    placedSnapMemo.current = { key, contents, value };
    return value;
  })();
  const autosave = useLocalAutosave(realProject, editing.projectLoad ?? realProject.id);
  const activeDocument = project.drawingDocuments?.find((d) => d.id === activeDocumentId);
  // The last view contexts by what they are derived from: a tab that comes back (the plan after
  // the layout book) gets the same object, so its drawing area need not derive anew (docs/TABS.md).
  const viewContexts = useRef<
    {
      project: Project;
      layers: unknown;
      document: unknown;
      context: ReturnType<typeof resolveWorkingView> | ReturnType<typeof resolveDocumentView>;
    }[]
  >([]);
  const viewContext = (() => {
    const known = viewContexts.current.find(
      (c) => c.project === project && c.layers === layerVisibility && c.document === activeDocument,
    );
    if (known) return known.context;
    const context = activeDocument
      ? resolveDocumentView(project, {
          kind: "drawing-document",
          projectId: project.id,
          documentId: activeDocument.id,
        })
      : resolveWorkingView(project, undefined, layerVisibility);
    viewContexts.current = [
      { project, layers: layerVisibility, document: activeDocument, context },
      ...viewContexts.current.slice(0, 3),
    ];
    return context;
  })();
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
  // Escape in two steps (docs/AUSWAHL_ESCAPE.md): whether something runs that it ends first,
  // and whether a selection waits for the second press. Set every render.
  const escapeState = useRef({ running: false, selected: false });
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
  // Kopie bewegen (docs/TASTENKUERZEL.md, B1): the copy switch during a move leaves the
  // originals in place and sets down copies of them, one undo step, the copies selected.
  const [copyMove, setCopyMove] = useState(false);
  const groupMove = useSelectionMove(project, selections, visibility, (next) => {
    if (!copyMove) return dispatchEditing({ type: "project", project: next });
    try {
      const copied = copyTransformed(
        project,
        next,
        selections,
        (kind) => `${kind}-${crypto.randomUUID()}`,
      );
      dispatchEditing({ type: "project", project: copied.project });
      selectManyCommitted(copied.project, copied.targets);
      showNotice(clipboardSummary(copied.content, "kopiert und bewegt"));
      setModelError("");
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Kopie nicht möglich.");
    }
  });
  // Drehen (docs/TASTENKUERZEL.md, B2): three clicks; the same copy switch as the move.
  const groupRotate = useSelectionRotate(project, selections, visibility, (next, degrees) => {
    const turned = `${degrees.toLocaleString("de-DE", { maximumFractionDigits: 2 })}°`;
    if (!copyMove) {
      dispatchEditing({ type: "project", project: next });
      showNotice(`Auswahl um ${turned} gedreht`);
      return;
    }
    try {
      const copied = copyTransformed(
        project,
        next,
        selections,
        (kind) => `${kind}-${crypto.randomUUID()}`,
      );
      dispatchEditing({ type: "project", project: copied.project });
      selectManyCommitted(copied.project, copied.targets);
      showNotice(clipboardSummary(copied.content, `kopiert und um ${turned} gedreht`));
      setModelError("");
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Kopie nicht möglich.");
    }
  });
  const transformActive = groupMove.active || groupRotate.active;
  useEffect(() => {
    if (!transformActive) setCopyMove(false);
  }, [transformActive]);
  const cancelGroup = useRef(groupMove.cancel);
  cancelGroup.current = () => {
    groupMove.cancel();
    groupRotate.cancel();
  };
  const selectedLayerId = selectedLayerElement(project, selection)?.layerId;
  const selectedIdSet = useMemo(() => new Set(selections.map((t) => t.id)), [selections]);
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
    tool === "slabOpening" ||
    roofPhase === "outline" ||
    (tool === "room" && !roomByWalls);
  const pathDrawing = tool === "line" || tool === "railing" || areaTool || roofPhase === "line";
  const [hatchConstruction, setHatchConstruction] = useState<HatchConstruction>("polygon");
  // Round Deckendurchbruch (docs/DECKENDURCHBRUCH.md): centre, then a point on the rim.
  const [openingCircle, setOpeningCircle] = useState(false);
  const circleTool = tool === "slabOpening" && openingCircle;
  const construction: HatchConstruction =
    tool === "room" && roomConstruction !== "walls"
      ? roomConstruction
      : circleTool
        ? "diagonal"
        : hatchConstruction;
  const findHatchBoundary = useMemo(
    () =>
      areaTool && construction === "boundary" ? prepareHatchBoundaries(project, visibility) : null,
    [areaTool, construction, project, visibility],
  );
  const toolDefaults = useToolDefaults(project);
  const hatchFill = toolDefaults.hatch.fill;
  // Regel 3 (docs/POLYGON_REGELN.md): each click-by-click tool declares how it closes.
  const pathClosure: PathClosure = areaTool
    ? construction === "polygon" && !circleTool
      ? "polygon"
      : "none"
    : tool === "line" && lineKind === "polyline"
      ? "polyline"
      : "none";
  const pathOrigin = pathDrawing ? (pathPoints.at(-1) ?? null) : null;
  const drawingOrigin = tool === "wall" ? wallStart : pathOrigin;
  const [referenceEpoch, setReferenceEpoch] = useState(0);
  const referenceScope = useMemo(
    () => ({
      project,
      visibility,
      editSession,
      tool,
      lineKind,
      mode,
      referenceEpoch,
    }),
    [project, visibility, editSession, tool, lineKind, mode, referenceEpoch],
  );
  const referenceSelection = useReferenceSelection(project, referenceScope, visibility);
  const lineAppearance = toolDefaults.line;
  const [modelError, setModelError] = useState("");
  const [exportingIfc, setExportingIfc] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const [notice, setNotice] = useState("Ready");
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
  // TR4: the tread the second click drew (run length by mouse); null: the calculated one.
  const [stairTread, setStairTread] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { navigatorWidth, setNavigatorWidth } = useNavigatorWidth();
  const navigatorShown = navigatorOpen;
  const insets = paletteInsets({
    rail: true,
    railCollapsed: true,
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
  // The one-row properties bar (UI2): which side has more to scroll to, and a drag in progress.
  const propertiesRow = useRef<HTMLDivElement>(null);
  const rowDrag = useRef<{ id: number; x: number; left: number } | null>(null);
  const [propertiesMore, setPropertiesMore] = useState<"none" | "left" | "right" | "both">("none");
  const measurePropertiesRow = (row: HTMLElement) => {
    const left = row.scrollLeft > 1,
      right = row.scrollLeft + row.clientWidth < row.scrollWidth - 1;
    const next = left && right ? "both" : left ? "left" : right ? "right" : "none";
    setPropertiesMore((current) => (current === next ? current : next));
  };
  // Contents change with every tool and selection: measure after each render and on resize.
  useEffect(() => {
    if (propertiesRow.current) measurePropertiesRow(propertiesRow.current);
  });
  useEffect(() => {
    const measure = () => propertiesRow.current && measurePropertiesRow(propertiesRow.current);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
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
    setStairTread(null);
    setSectionStart(null);
    setSectionEnd(null);
    setSelectedSectionId(null);
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
        event.target.closest(
          'input, textarea, select, [contenteditable=true], [role="dialog"], [role="alertdialog"]',
        )
      )
        return;
      // Every shortcut comes from the project's list (docs/TASTENKUERZEL.md, B1).
      const hotkeys = hotkeysNow.current;
      if (!event.repeat && isCopyToggle(hotkeys, event) && copyToggleShortcut.current?.()) {
        event.preventDefault();
        return;
      }
      const command = commandForKey(hotkeys, event);
      if (!command && event.key !== "Escape") return;
      const toolOf: Partial<Record<HotkeyCommand, ToolId>> = {
        "tool-select": "select",
        "tool-wall": "wall",
        "tool-slab": "slab",
        "tool-line": "line",
        "tool-hatch": "hatch",
        "tool-door": "door",
      };
      if (command === "undo" || command === "redo") {
        event.preventDefault();
        if (!event.repeat) navigateHistory(command);
        return;
      }
      if (command === "copy" || command === "cut" || command === "paste") {
        const key = command === "copy" ? "c" : command === "cut" ? "x" : "v";
        if (!event.repeat && clipboardShortcut.current?.(key)) event.preventDefault();
        return;
      }
      if (command === "select-all") {
        if (!event.repeat && selectAllShortcut.current?.()) event.preventDefault();
        return;
      }
      if (command === "move" || command === "rotate" || command === "mirror") {
        event.preventDefault();
        if (!event.repeat) commandShortcut.current?.(command);
        return;
      }
      if (command === "delete") {
        if (!deleteShortcut.current) return;
        event.preventDefault();
        if (!event.repeat) deleteShortcut.current();
        return;
      }
      const next = command ? toolOf[command] : undefined;
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
      if (event.key === "Escape") {
        const step = escapeStep({ consumed: event.defaultPrevented, ...escapeState.current });
        cancelInteraction();
        setDemandOpen(false);
        setTool("select");
        setModelError("");
        if (step === "deselect") {
          setSelection(null);
          // The picked element keeps no keyboard focus once it is no longer selected.
          if (document.activeElement instanceof SVGElement) document.activeElement.blur();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
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
    }
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice("Ready"), 1800);
  };

  const selectTool = (next: ToolId) => {
    // The Plankopfplaner draws only: building tools stay off there (PK2).
    if (next === "drawing" && space?.kind !== "layout") {
      showNotice("Das Werkzeug Zeichnung setzt Abbilder auf ein Layout. Zuerst ein Layout öffnen.");
      return;
    }
    if (spaceTools && !spaceTools.has(next)) {
      showNotice(
        space?.kind === "layout"
          ? "Im Layout gibt es nur Linie, Text und Schraffur."
          : "Im Plankopfplaner gibt es nur Zeichenwerkzeuge (Linie, Text, Schraffur, Maßkette).",
      );
      return;
    }
    cancelInteraction();
    // Selecting and the dimension tool (height marks, BS2) also work in a section tab.
    if (next !== "select" && next !== "dimension") setActiveSectionId(null);
    setTool(next);
    if (next === "window" || next === "door" || next === "measure") setDemandOpen(false);
    if (
      next === "window" ||
      next === "door" ||
      next === "line" ||
      next === "hatch" ||
      next === "slab" ||
      next === "slabOpening" ||
      next === "roof" ||
      next === "room" ||
      next === "column" ||
      next === "railing" ||
      next === "roofWindow" ||
      next === "stair" ||
      next === "section" ||
      next === "elevation" ||
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
      next === "slabOpening" ||
      next === "roof" ||
      next === "room" ||
      next === "column" ||
      next === "railing" ||
      next === "roofWindow" ||
      next === "stair" ||
      next === "section" ||
      next === "elevation" ||
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

  const selectMany = (targets: SelectionSet, committed?: Project) => {
    cancelInteraction();
    if (committed) selectCommitted(committed, targets);
    else choose(targets);
    setDemandOpen(targets.length > 0);
    setDemandPosition({ x: lastPointer.current.x + 16, y: lastPointer.current.y + 16 });
    setPickedPoint({ index: null, anchor: null, edgeIndex: null });
    setTool("select");
  };
  /** New elements (paste, copy move): checked against the committed model, not this render's. */
  const selectManyCommitted = (next: Project, targets: SelectionSet) => selectMany(targets, next);
  const startEdit = (action: EditAction) => {
    setDemandOpen(false);
    if (!selection || selection.kind === "reference") return;
    const inSolid = mode === "3D";
    // Slabs and roofs: outline edited in the plan, moved as a whole (SLAB_/ROOF_ELEMENT.md).
    // Columns and railings move as a whole too (docs/STUETZEN.md, P3; docs/GELAENDER.md, G3).
    const area =
      // A placed drawing moves as a whole; its size is fixed (docs/ZEICHNUNG.md).
      selection.kind === "drawing" ||
      selection.kind === "slab" ||
      selection.kind === "slabOpening" ||
      selection.kind === "roof" ||
      selection.kind === "room" ||
      selection.kind === "column" ||
      selection.kind === "railing" ||
      selection.kind === "roofWindow" ||
      selection.kind === "object" ||
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
          : selection.kind === "slabOpening"
            ? ((o) => o.circle?.center ?? o.points![0]!)(
                storeyOf(project).slabOpenings!.find((o) => o.id === selection.id)!,
              )
            : selection.kind === "roof"
              ? storeyOf(project).roofs!.find((roof) => roof.id === selection.id)!.points[0]!
              : selection.kind === "room"
                ? storeyOf(project).rooms!.find((room) => room.id === selection.id)!.points[0]!
                : selection.kind === "column"
                  ? storeyOf(project).columns!.find((c) => c.id === selection.id)!.position
                  : selection.kind === "railing"
                    ? storeyOf(project).railings!.find((r) => r.id === selection.id)!.points[0]!
                    : selection.kind === "roofWindow"
                      ? roofWindowCentre(project, selection.id)
                      : selection.kind === "object"
                        ? storeyOf(project).objects!.find((o) => o.id === selection.id)!.position
                        : selection.kind === "stair"
                          ? storeyOf(project).stairs!.find((s) => s.id === selection.id)!.start
                          : selection.kind === "dimension"
                            ? storeyOf(project).dimensions!.find((d) => d.id === selection.id)!
                                .points[0]!
                            : selection.kind === "text"
                              ? storeyOf(project).texts!.find((t) => t.id === selection.id)!
                                  .position
                              : selection.kind === "drawing"
                                ? storeyOf(project).drawings!.find((d) => d.id === selection.id)!
                                    .position
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
        if (!inSolid) setMode("2D");
        setModelError("");
      } catch (error) {
        setModelError(error instanceof Error ? error.message : "Bewegung nicht möglich.");
      }
      return;
    }

    // A railing only moves as a whole (handled above); its points are not edited yet.
    if (
      selection.kind === "railing" ||
      selection.kind === "roofWindow" ||
      selection.kind === "object"
    )
      return;
    // Slab outlines are edited in the plan (docs/SLAB_ELEMENT.md, E1); in 3D the slab moves whole.
    if (area && (inSolid || action === "axis")) {
      const words = {
        slab: ["Decke", "die Decke", "Decken"],
        roof: ["Dach", "das Dach", "Dächer"],
        room: ["Raum", "der Raum", "Räume"],
        column: ["Stützen", "die Stütze", "Stützen"],
        stair: ["Treppen", "die Treppe", "Treppen"],
        slabOpening: ["Deckendurchbruchs", "der Deckendurchbruch", "Deckendurchbrüche"],
        dimension: ["Maßketten", "die Maßkette", "Maßketten"],
        text: ["Texte", "der Text", "Texte"],
        drawing: ["Zeichnungen", "die Zeichnung", "Zeichnungen"],
      }[
        selection.kind as
          | "slab"
          | "slabOpening"
          | "roof"
          | "room"
          | "column"
          | "stair"
          | "dimension"
          | "text"
          | "drawing"
      ];
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
      selection.kind === "text" ||
      selection.kind === "drawing"
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
    if (!solidMove) setMode("2D");
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
  // Transparency trace (S4): a storey that no longer exists or is now the working storey falls
  // back to the default; outlines and snap sources follow the model.
  const tracing = (() => {
    const base = tracingState ?? tracingDefaults(project);
    const working = project.workingStoreyId ?? project.groundStoreyId;
    const valid =
      base.storeyId &&
      base.storeyId !== working &&
      project.storeys.some((s) => s.id === base.storeyId);
    return valid ? base : { ...base, storeyId: tracingDefaults(project).storeyId };
  })();
  const tracingView = useMemo(() => {
    if (!tracing.enabled || !tracing.storeyId || mode !== "2D") return null;
    return {
      ...tracingOutlines(project, tracing.storeyId),
      color: tracing.color,
      opacity: tracing.opacity,
      snap: tracing.snap ? tracingSnap(project, tracing.storeyId) : null,
    };
  }, [
    project,
    tracing.enabled,
    tracing.storeyId,
    tracing.color,
    tracing.opacity,
    tracing.snap,
    mode,
  ]);
  const deleteShortcut = useRef<(() => void) | null>(null);
  const selectedSection = (project.sections ?? []).find((s) => s.id === selectedSectionId);
  deleteShortcut.current =
    tool === "select" && !editSession && !transformActive && selectedSection
      ? () => {
          setSelectedSectionId(null);
          setSectionWindow(null);
          dispatchEditing({ type: "project", project: removeSection(project, selectedSection.id) });
          showNotice(`${selectedSection.name} gelöscht`);
        }
      : tool === "select" && !editSession && !transformActive && selections.length
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
  const canEditSelection = tool === "select" && !editSession && !transformActive;
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
      selectManyCommitted(pasted.project, pasted.targets);
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
    railing: "Geländer",
    roofWindow: "Dachflächenfenster",
    stair: "Treppe",
    section: "Schnitt",
    elevation: "Ansicht",
    dimension: "Maßkette",
    text: "Text",
    window: "Fenster",
    door: "Tür",
    slab: "Decke",
    slabOpening: "Deckendurchbruch",
    hatch: "Schraffur",
    line: "Linie",
    drawing: "Zeichnung",
  };
  const openToolDefaults = (owner: ToolId) => {
    if (owner === "roof" || owner === "room" || SETTINGS_TOOLS[owner])
      return setSettingsWindow({ mode: "tool", tool: owner });
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
    ) : owner === "elevation" ? (
      <SectionFields
        value={elevationDefaults}
        onChange={setElevationDefaults}
        next={nextSectionLabel(project, elevationDefaults, "elevation")}
        denominator={planDenominator(project)}
        onFourElevations={() => {
          try {
            dispatchEditing({
              type: "project",
              project: addFourElevations(
                project,
                () => `section-${crypto.randomUUID()}`,
                elevationDefaults,
              ),
            });
            setModelError("");
            showNotice("Vier Ansichten erzeugt");
          } catch (error) {
            setModelError(error instanceof Error ? error.message : "Ansichten nicht möglich.");
          }
        }}
      />
    ) : owner === "stair" ? (
      <StairFields
        value={toolDefaults.stair}
        onChange={toolDefaults.setStair}
        layers={project.layers}
        storeyHeight={storeyOf(project).height ?? null}
      />
    ) : owner === "railing" ? (
      <div className="flex flex-wrap items-end gap-3">
        <RailingFields
          value={toolDefaults.railing}
          onChange={toolDefaults.setRailing}
          layers={project.layers}
        />
        {place === "bar" && (
          <span role="status" className="text-xs text-muted-foreground">
            Punkte setzen · Doppelklick oder Enter beendet · Esc: Abbruch
          </span>
        )}
      </div>
    ) : owner === "roofWindow" ? (
      <div className="flex flex-wrap items-end gap-3">
        <RoofWindowFields
          value={toolDefaults.roofWindow}
          onChange={toolDefaults.setRoofWindow}
          layers={project.layers}
        />
        {place === "bar" && (
          <span role="status" className="text-xs text-muted-foreground">
            In ein Dach klicken: Mitte des Fensters · parallel zur Traufe
          </span>
        )}
      </div>
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
        choosingSide={windowTool.choosingSide}
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
        choosingSide={doorTool.choosingSide}
      />
    ) : owner === "slabOpening" ? (
      <SlabOpeningToolFields
        construction={openingCircle ? "circle" : hatchConstruction}
        onConstruction={(construction) => {
          cancelInteraction();
          setOpeningCircle(construction === "circle");
          if (construction !== "circle") setHatchConstruction(construction);
        }}
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
        <ConstructionPicker
          label="Schraffur-Erstellung"
          options={["polygon", "diagonal", "side-height", "boundary"] as const}
          value={hatchConstruction}
          onValue={(construction) => {
            cancelInteraction();
            setHatchConstruction(construction);
          }}
        />
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
    ) : owner === "drawing" ? (
      <DrawingToolFields
        documents={(realProject.drawingDocuments ?? []).map((doc) => ({
          id: doc.id,
          label: `${doc.name} · 1:${doc.denominator}`,
          placeable: !!drawingSource(doc.id),
        }))}
        layers={project.layers}
        value={toolDefaults.drawing}
        onChange={(value) => {
          toolDefaults.setDrawing(value);
          // A section chosen for placing keeps its frame from now on (ZW5).
          if (value.documentId) fitSectionFrame(value.documentId);
        }}
      />
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
        id: "move",
        label: "Bewegen",
        shortcut: `${hotkeyLabel(resolvedHotkeys(project.hotkeys).move)} · danach ${hotkeyLabel(resolvedHotkeys(project.hotkeys)["copy-toggle"])}: Kopie`,
        disabled:
          none ||
          (!canEditSelection && "Gerade nicht möglich.") ||
          (mode === "3D" && "Nur im Grundriss."),
        run: () => commandShortcut.current?.("move"),
      },
      {
        id: "rotate",
        label: "Drehen",
        shortcut: `${hotkeyLabel(resolvedHotkeys(project.hotkeys).rotate)} · danach ${hotkeyLabel(resolvedHotkeys(project.hotkeys)["copy-toggle"])}: Kopie`,
        disabled:
          none ||
          (!canEditSelection && "Gerade nicht möglich.") ||
          (mode === "3D" && "Nur im Grundriss."),
        run: () => commandShortcut.current?.("rotate"),
      },
      "separator",
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
        id: "similar",
        label: "Ähnliche auswählen",
        disabled:
          (filterPlace.kind !== "plan" && "Nur im Grundriss.") ||
          (single ? false : "Ein Element auswählen."),
        run: () =>
          single &&
          selectMany(
            filterElements(
              project,
              visibility,
              { kind: "storey" },
              similarCriteria(project, single),
            ),
          ),
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
  // Shortcuts of the project (docs/TASTENKUERZEL.md, B1).
  const hotkeysNow = useRef(project.hotkeys);
  hotkeysNow.current = project.hotkeys;
  const commandShortcut = useRef<((command: "move" | "rotate" | "mirror") => void) | null>(null);
  commandShortcut.current = (command) => {
    if (command === "mirror")
      return setModelError("Spiegeln folgt mit B3 (docs/TASTENKUERZEL.md).");
    if (transformActive || editSession) return;
    if (!selections.length || !selection) return setModelError("Erst ein Element auswählen.");
    if (mode === "3D")
      return setModelError(
        command === "rotate"
          ? "Drehen nur im Grundriss."
          : "Bewegen per Tastenkürzel nur im Grundriss.",
      );
    setCopyMove(false);
    if (command === "move") return startEdit("move");
    try {
      setDemandOpen(false);
      groupRotate.begin();
      setModelError("");
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Drehen nicht möglich.");
    }
  };
  const copyToggleShortcut = useRef<(() => boolean) | null>(null);
  copyToggleShortcut.current = () => {
    if (!transformActive) return false;
    setCopyMove((on) => !on);
    return true;
  };
  // Strg+A (docs/FILTER.md): every visible element of the working storey, in the plan only.
  const selectAllShortcut = useRef<(() => boolean) | null>(null);
  selectAllShortcut.current = () => {
    if (filterPlace.kind !== "plan" || editSession || transformActive) return false;
    selectMany(filterElements(project, visibility, { kind: "storey" }, NO_CRITERIA));
    return true;
  };
  const clipboardShortcut = useRef<((key: string) => boolean) | null>(null);
  clipboardShortcut.current = (key) => {
    if (key === "v" && clipboard.current && !editSession && !transformActive) {
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
      requestProjectDownload(realProject, browserProjectDownload);
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
    // Railing (docs/GELAENDER.md, G2): a model element along the drawn line, one undo step.
    if (tool === "railing") {
      try {
        if (base !== project)
          throw new Error("Das Modell wurde geändert. Zeichnen erneut beginnen.");
        const id = `railing-${crypto.randomUUID()}`;
        dispatchEditing({
          type: "project",
          project: addRailing(project, { id, points, ...railingValues(toolDefaults.railing) }),
        });
        setModelError("");
        showNotice("Geländer gesetzt");
      } catch (error) {
        setModelError(
          error instanceof Error && !error.message.startsWith("[")
            ? error.message
            : "Geländer prüfen: mindestens zwei Punkte, kein Abschnitt kürzer als 1 cm.",
        );
      }
      setPathPoints([]);
      setDrawingBase(null);
      return;
    }
    try {
      const kind =
        tool === "hatch"
          ? "hatch"
          : tool === "slab"
            ? "slab"
            : tool === "slabOpening"
              ? "slabOpening"
              : tool === "roof"
                ? "roof"
                : tool === "room"
                  ? "room"
                  : "line";
      const id = `${kind === "slabOpening" ? "slab-opening" : kind}-${crypto.randomUUID()}`;
      changeProject(
        createDrawing(
          base!,
          project,
          id,
          tool === "hatch"
            ? { kind: "hatch", points, ...toolDefaults.hatch }
            : tool === "slab"
              ? { kind: "slab", points, ...toolDefaults.slab }
              : tool === "slabOpening"
                ? circleTool
                  ? {
                      kind: "slabOpening",
                      circle: {
                        center: points[0]!,
                        diameter:
                          2 * Math.hypot(points[1]!.x - points[0]!.x, points[1]!.y - points[0]!.y),
                      },
                    }
                  : { kind: "slabOpening", points }
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
          : tool === "slabOpening"
            ? error instanceof Error && !error.message.startsWith("[")
              ? error.message
              : "Deckendurchbruch prüfen: mindestens drei Eckpunkte ohne Kreuzungen, ganz innerhalb einer Decke. Nach Modelländerung erneut beginnen."
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
    if (orientation === "height") return;
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
    // Tool „Zeichnung“ (docs/ZEICHNUNG.md, ZW2): the click sets the drawing's centre.
    if (tool === "drawing") {
      const source = drawingSource(toolDefaults.drawing.documentId);
      if (!source) return showNotice("Zuerst im Werkzeug ein Abbild wählen.");
      try {
        // The first drawing gives the title block its drawing name and scale (decision 3).
        const layout = layoutSpace?.layout;
        if (layout && !layout.documentId) {
          const action = {
            kind: "layout-settings" as const,
            id: layout.id,
            name: layout.name,
            folderId: layout.folderId,
            masterId: layout.masterId ?? null,
            ...(layout.sheet ? { sheet: layout.sheet } : {}),
            documentId: source.document.id,
          };
          dispatchEditing({ type: "layout", base: realProject, action });
        }
        dispatchEditing({
          type: "project",
          project: placeDrawing(project, {
            id: crypto.randomUUID(),
            documentId: source.document.id,
            position: { ...point },
            frame: source.framing,
            denominator: source.document.denominator,
            layerId: toolDefaults.drawing.layerId,
          }),
        });
        showNotice(`Zeichnung „${source.document.name}“ platziert`);
      } catch (error) {
        setModelError(error instanceof Error ? error.message : "Zeichnung nicht möglich.");
      }
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
    if (tool === "dimension" && toolDefaults.dimension.orientation === "height") {
      setModelError(
        "Höhenkoten im Schnitt- oder Ansichts-Tab setzen (Tab über den Navigator öffnen).",
      );
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
    if (tool === "section" || tool === "elevation") {
      const elevation = tool === "elevation";
      const defaults = elevation ? elevationDefaults : sectionDefaults;
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
        const { name } = nextSectionLabel(project, defaults, elevation ? "elevation" : "section");
        dispatchEditing({
          type: "project",
          project: addSection(
            project,
            {
              id: `section-${crypto.randomUUID()}`,
              start: sectionStart,
              end: sectionEnd,
              look: sectionLookTo(sectionStart, sectionEnd, point),
              ...(elevation ? { kind: "elevation" as const } : {}),
            },
            defaults,
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
    // direction and, by its distance, the length of the run (TR4: the tread follows, the riser
    // count stays with the height); for L and U click 3 the side of the turn.
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
      const drawn =
        stairDirection === null
          ? stairTreadForLength(
              values,
              storeyOf(project).height ?? null,
              Math.hypot(point.x - stairStart.x, point.y - stairStart.y),
            )
          : stairTread;
      if (values.shape !== "straight" && stairDirection === null) {
        setStairDirection(direction);
        setStairTread(drawn);
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
            ...(drawn !== null ? { tread: drawn } : {}),
            ...(values.shape !== "straight"
              ? { turn: stairTurnTo(stairStart, direction, point) }
              : {}),
          }),
        });
        setStairStart(null);
        setStairDirection(null);
        setStairTread(null);
        showNotice("Treppe gesetzt");
      } catch (error) {
        setModelError(error instanceof Error ? error.message : "Treppe nicht möglich.");
      }
      return;
    }
    // Roof window tool: a click into a roof sets a window, centre on the point
    // (docs/DACHFLAECHENFENSTER.md, D2); the topmost roof under the point takes it.
    if (tool === "roofWindow") {
      const roof = (storeyOf(project).roofs ?? [])
        .filter((r) => visibleLayerTarget(project, visibility, { kind: "roof", id: r.id }))
        .filter((r) => polygonContains(r.points, point))
        .at(-1);
      if (!roof) {
        setModelError("Dachflächenfenster: in eine sichtbare Dachfläche klicken.");
        return;
      }
      try {
        dispatchEditing({
          type: "project",
          project: addRoofWindowAt(
            project,
            {
              id: `roof-window-${crypto.randomUUID()}`,
              roofId: roof.id,
              ...roofWindowValues(toolDefaults.roofWindow),
            },
            point,
          ),
        });
        setModelError("");
        showNotice("Dachflächenfenster gesetzt");
      } catch (error) {
        setModelError(
          error instanceof Error && !error.message.startsWith("[")
            ? error.message
            : "Dachflächenfenster nicht möglich.",
        );
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
      if (circleTool && next.length === 2) finishPath(next);
      else if (
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
    transformActive ||
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
    () => ({ project, visibility, mode, tool, measurementMode }),
    [project, visibility, mode, tool, measurementMode],
  );
  const measurement = useMeasurement(
    tool === "measure" && mode === "2D",
    measurementContext,
    measurementMode,
    () => selectTool("select"),
  );
  cancelMeasurement.current = measurement.reset;
  escapeState.current = {
    running:
      tool !== "select" ||
      !!pendingSession ||
      transformActive ||
      imageTool.active ||
      calibration.active ||
      // The on-demand menu opens with every selection; it closes with the selection.
      !!wallChain ||
      pathPoints.length > 0 ||
      !!roofLine ||
      !!roofRise ||
      !!dimensionDraft ||
      !!textDraft ||
      !!stairStart ||
      stairDirection !== null ||
      stairTread !== null ||
      !!sectionStart ||
      !!sectionEnd,
    selected: selections.length > 0,
  };
  const windowPlacement =
    measurement.adapter ??
    calibration.adapter ??
    imageTool.adapter ??
    windowTool.adapter ??
    doorTool.adapter;
  const interaction = useToolInteraction(
    windowPlacement ??
      groupMove.adapter ??
      groupRotate.adapter ??
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
      const content = await exportIfc(realProject);
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
  const sections = realProject.sections;
  // The open section document, only while it still shows the active section.
  const shownSectionDocument = (() => {
    const doc = realProject.drawingDocuments?.find((d) => d.id === sectionDocumentId);
    const view = realProject.modelViews?.find((v) => v.id === doc?.modelViewId);
    return doc && view?.kind === "section" && view.sectionId === activeSectionId ? doc : null;
  })();
  const sectionIds = new Set((sections ?? []).map((s) => s.id));
  const activeSection = activeSectionId && sectionIds.has(activeSectionId) ? activeSectionId : null;
  if (activeSectionId && !activeSection) setActiveSectionId(null);
  const layoutNames = [
    ...projectMasterLayouts(realProject),
    ...projectLayouts(realProject),
    ...(realProject.titleBlocks ?? []),
  ].map((l) => ({
    id: l.id,
    name: l.name,
  }));
  const layoutIds = new Set(layoutNames.map((l) => l.id));
  const activeLayout = activeLayoutId && layoutIds.has(activeLayoutId) ? activeLayoutId : null;
  if (activeLayoutId && !activeLayout) setActiveLayoutId(null);
  const activeView = activeBlock
    ? titleBlockTab(activeBlock.id)
    : activeLayout
      ? layoutTab(activeLayout)
      : activeSection
        ? sectionTab(activeSection)
        : canvasViewOf(mode);
  const shownTabs = existingCanvasTabs(
    withCanvasTab(canvasTabs, activeView),
    sectionIds,
    layoutIds,
  );
  if (shownTabs.join("|") !== canvasTabs.join("|")) setCanvasTabs(shownTabs);
  if (keptSplit(canvasSplit, shownTabs) !== canvasSplit) setCanvasSplit(null);
  const split = shownSplit(canvasSplit, shownTabs, activeView);
  const activeKind = canvasTabKind(activeView);
  /** The field a kind takes in the split: 0 or 1, null when it is not shown in it. */
  const splitField = (kind: CanvasTabKind): 0 | 1 | null =>
    !split ? null : split.kinds[0] === kind ? 0 : split.kinds[1] === kind ? 1 : null;
  const splitSectionTab = splitField("section") !== null && splitFieldTab(shownTabs, "section");
  /** The section drawn: the active one, or the split's section field beside the active field. */
  const fieldSectionId = activeSection ?? (splitSectionTab ? tabSectionId(splitSectionTab) : null);
  const splitTab = (view: CanvasView, direction: SplitDirection) => {
    const next = openSplit(shownTabs, view, activeView, direction);
    if (!next) return;
    setCanvasSplit(next);
    if (view !== activeView) selectCanvasTab(view);
  };
  /** The tab a click into an inactive field activates (docs/SPLITSCREEN.md). */
  const activateField = (kind: CanvasTabKind) => {
    const view = splitFieldTab(shownTabs, kind);
    if (view && kind !== activeKind) selectCanvasTab(view);
  };
  /** Props of a split field's wrapper: its place, its frame and the click that activates it. */
  const fieldProps = (kind: CanvasTabKind) => {
    const field = splitField(kind);
    if (field === null || !split) return null;
    const active = kind === activeKind;
    return {
      style: splitFieldRect(split, field),
      "data-split-field": field,
      "data-split-active": active || undefined,
      className: cn(
        "absolute overflow-hidden",
        active ? "ring-2 ring-inset ring-primary/60" : "ring-1 ring-inset ring-border",
      ),
      // The first click into the inactive field only activates it, as in every viewport.
      onClickCapture: active
        ? undefined
        : (event: ReactMouseEvent) => {
            event.stopPropagation();
            activateField(kind);
          },
    };
  };
  const shownSection = activeSection ? sections!.find((s) => s.id === activeSection)! : null;
  const filterPlace: FilterPlace =
    activeBlock || activeLayout || (!shownSection && mode === "3D")
      ? { kind: "blocked", reason: "Der Filter wirkt nur im Grundriss, Schnitt oder Ansicht." }
      : shownSection
        ? {
            kind: "section",
            label: shownSection.kind === "elevation" ? "dieser Ansicht" : "diesem Schnitt",
            ids: sectionShownIds(cachedSectionDrawing(project, shownSection)),
          }
        : { kind: "plan" };
  function selectCanvasTab(view: CanvasView) {
    const sectionId = tabSectionId(view),
      layoutId = tabLayoutId(view),
      blockId = tabTitleBlockId(view);
    setCanvasTabs((tabs) => withCanvasTab(tabs, view));
    setSectionDocumentId(null);
    if (blockId !== null) {
      // The Plankopfplaner: the plan with the title block's sheet (docs/PLANKOPF.md, PK2).
      cancelInteraction();
      setActiveSectionId(null);
      setActiveLayoutId(null);
      setActiveDocumentId(null);
      setSelection(null);
      if (mode !== "2D") changeMode("2D");
      if (!TITLE_BLOCK_TOOLS.has(tool)) setTool("select");
      setLastTitleBlockId(blockId);
      return dispatchEditing({
        type: "space",
        space: { kind: "title-block", id: blockId },
      });
    }
    if (space) dispatchEditing({ type: "space", space: null });
    if (layoutId !== null) {
      // Layouts are drawn on with the plan tools (docs/LAYOUTS.md, LZ1).
      cancelInteraction();
      setActiveSectionId(null);
      setActiveDocumentId(null);
      setSelection(null);
      if (mode !== "2D") changeMode("2D");
      if (!LAYOUT_TOOLS.has(tool)) setTool("select");
      setActiveLayoutId(layoutId);
      return dispatchEditing({ type: "space", space: { kind: "layout", id: layoutId } });
    }
    setActiveLayoutId(null);
    if (sectionId === null) return changeMode(canvasModeOf(view as "plan" | "3d"));
    cancelInteraction();
    setActiveSectionId(sectionId);
  }
  // The last content of each tab kind (docs/TABS.md): the menu opens a kind with it again.
  lastOfKind.current.set(canvasTabKind(activeView), activeView);
  const firstLayout = projectLayouts(realProject)[0] ?? projectMasterLayouts(realProject)[0];
  const availableKinds = new Set<CanvasTabKind>([
    "plan",
    "3d",
    ...(sectionIds.size ? (["section"] as const) : []),
    ...(layoutIds.size ? (["layout"] as const) : []),
  ]);
  const openCanvasKind = (kind: CanvasTabKind) => {
    const open = shownTabs.find((t) => canvasTabKind(t) === kind);
    const last = lastOfKind.current.get(kind);
    const lastExists = last && existingCanvasTabs([last], sectionIds, layoutIds).length > 0;
    const fallback =
      kind === "section"
        ? sections?.[0] && sectionTab(sections[0].id)
        : kind === "layout"
          ? firstLayout && layoutTab(firstLayout.id)
          : kind;
    const view = open ?? (lastExists ? last : fallback);
    if (view) selectCanvasTab(view);
  };
  /**
   * The drawing areas of the plan, 3D and layout book tabs (docs/TABS.md). The shown one
   * renders with the current state; the others stay mounted, invisible and inert with the content
   * they last showed, so a tab that comes back appears without being built anew. Behind the
   * section tab the shown one stays as it was, too. A new project drops them.
   */
  const keepViewport = (viewport: ReactElement<ComponentProps<typeof ViewportManager>>) => {
    const kept = keptViewports.current;
    if (keptProjectId.current !== realProject.id) {
      kept.clear();
      keptProjectId.current = realProject.id;
    }
    const shown = space ? "layout" : mode === "3D" ? "3d" : "plan";
    const live = splitField(shown) !== null;
    if (!activeSection || !kept.has(shown) || live)
      kept.set(
        shown,
        live && activeKind !== shown
          ? cloneElement(viewport, { active: false, onActivate: () => activateField(shown) })
          : viewport,
      );
    // A split field of the other model kind stays live too (docs/SPLITSCREEN.md): the same
    // viewport in the other mode, without input until the field is activated.
    const other = shown === "plan" ? "3d" : shown === "3d" ? "plan" : null;
    if (other && splitField(other) !== null)
      kept.set(
        other,
        cloneElement(viewport, {
          key: other === "3d" ? "building-3d" : "plan",
          cameraKey: other === "3d" ? "building-3d" : "plan",
          mode: other === "3d" ? "3D" : "2D",
          active: activeKind === other,
          onActivate: () => activateField(other),
        }),
      );
    return [...kept].map(([kind, element]) => {
      const field = fieldProps(kind);
      const visible = field ? true : !split && kind === shown;
      return (
        <div
          key={kind}
          // content-visibility, not display: the browser skips a hidden area's rendering work but
          // keeps its state, so showing it again needs no new layout of its many SVG elements.
          className={field?.className ?? "absolute inset-0"}
          style={visible ? field?.style : { contentVisibility: "hidden" }}
          aria-hidden={!visible || undefined}
          inert={!visible}
          data-canvas-kind={kind}
          data-hidden-tab={!visible || undefined}
          data-split-field={field?.["data-split-field"]}
          data-split-active={field?.["data-split-active"]}
        >
          {element}
        </div>
      );
    });
  };
  /** A section or elevation document opens the tab of its section (docs/ABBILDER.md). */
  const openSectionDocument = (documentId: string) => {
    const doc = realProject.drawingDocuments?.find((d) => d.id === documentId);
    const view = realProject.modelViews?.find((v) => v.id === doc?.modelViewId);
    if (view?.kind !== "section") return;
    selectCanvasTab(sectionTab(view.sectionId));
    setSectionDocumentId(documentId);
  };
  const openSectionWindow = (id: string) => {
    cancelInteraction();
    setModelError("");
    setSectionWindow(id);
    setSelectedSectionId(id);
  };
  const selectSection = (id: string | null) => {
    if (id === null) return setSelectedSectionId(null);
    cancelInteraction();
    setSelection(null);
    setDemandOpen(false);
    setModelError("");
    setSelectedSectionId(id);
  };
  // Height marks in a section or elevation tab (docs/SCHNITT.md, BS2): each change one undo step.
  const changeHeightMarks = (change: () => Project, notice: string) => {
    try {
      dispatchEditing({ type: "project", project: change() });
      setModelError("");
      showNotice(notice);
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Höhenkoten nicht möglich.");
    }
  };
  /** Wall build-up library (docs/WANDAUFBAU.md): one undo step, walls follow their assembly. */
  const changeAssemblyLibrary = (library: Parameters<typeof saveAssemblyLibrary>[1]) => {
    try {
      dispatchEditing({ type: "project", project: saveAssemblyLibrary(project, library) });
      setModelError("");
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Änderung nicht möglich.");
    }
  };
  const moveSectionLine = (id: string, line: { start: Point; end: Point }) => {
    try {
      dispatchEditing({ type: "project", project: updateSection(project, id, line) });
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "Änderung nicht möglich.");
    }
  };
  function changeMode(next: ViewMode) {
    setActiveSectionId(null);
    setActiveLayoutId(null);
    if (space) dispatchEditing({ type: "space", space: null });
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
      <HotkeySettings
        open={hotkeysOpen}
        onClose={() => setHotkeysOpen(false)}
        hotkeys={project.hotkeys}
        onChange={(command, combo) =>
          dispatchEditing({ type: "project", project: setHotkey(project, command, combo) })
        }
        onReset={() => dispatchEditing({ type: "project", project: resetHotkeys(project) })}
      />
      <CopyCursorBadge active={transformActive && copyMove} />
      <CanvasDisplaySettings
        open={displaySettingsOpen}
        onOpenChange={setDisplaySettingsOpen}
        wallWidth={wallWidth}
        onWallWidth={setWallWidth}
        cutFill={cutFill}
        onCutFill={setCutFill}
        showRenovation={showRenovation}
        onShowRenovation={setShowRenovation}
        pictograms={pictograms}
        onPictograms={setPictograms}
        onResetPictograms={resetPictograms}
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
                  // Element set into new openings (docs/FENSTER_TUEREN.md, FT1).
                  ...(settingsWindow.tool === "window"
                    ? [
                        {
                          id: "insert",
                          label: "Fensterelement",
                          content: (
                            <OpeningInsertFields
                              kind="window"
                              clickedExterior
                              value={
                                toolDefaults.window.insert === undefined
                                  ? WINDOW_INSERT_DEFAULTS
                                  : toolDefaults.window.insert
                              }
                              onChange={(insert) => {
                                const checked = insert && checkedWindowInsert(insert);
                                cancelInteraction();
                                toolDefaults.setWindow({ ...toolDefaults.window, insert: checked });
                              }}
                              hint="Vorgabe für neue Fenster. Ob es in eine Wand passt, wird beim Platzieren geprüft."
                            />
                          ),
                        },
                      ]
                    : settingsWindow.tool === "door"
                      ? [
                          {
                            id: "insert",
                            label: "Türelement",
                            content: (
                              <OpeningInsertFields
                                kind="door"
                                value={
                                  toolDefaults.door.insert === undefined
                                    ? DOOR_INSERT_DEFAULTS
                                    : toolDefaults.door.insert
                                }
                                onChange={(insert) => {
                                  const checked = insert && checkedDoorInsert(insert);
                                  cancelInteraction();
                                  toolDefaults.setDoor({ ...toolDefaults.door, insert: checked });
                                }}
                                hint="Vorgabe für neue Türen. Ob sie in eine Wand passt, wird beim Platzieren geprüft."
                              />
                            ),
                          },
                        ]
                      : []),
                  ...(settingsWindow.tool === "wall" ||
                  settingsWindow.tool === "column" ||
                  settingsWindow.tool === "railing" ||
                  settingsWindow.tool === "roofWindow" ||
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
                                  : settingsWindow.tool === "railing"
                                    ? toolDefaults.railing.renovation
                                    : settingsWindow.tool === "roofWindow"
                                      ? toolDefaults.roofWindow.renovation
                                      : settingsWindow.tool === "stair"
                                        ? toolDefaults.stair.renovation
                                        : (toolDefaults.wall.renovation ?? "existing")
                              }
                              onChange={(renovation) => {
                                cancelInteraction();
                                if (settingsWindow.tool === "column")
                                  toolDefaults.setColumn({ ...toolDefaults.column, renovation });
                                else if (settingsWindow.tool === "railing")
                                  toolDefaults.setRailing({ ...toolDefaults.railing, renovation });
                                else if (settingsWindow.tool === "roofWindow")
                                  toolDefaults.setRoofWindow({
                                    ...toolDefaults.roofWindow,
                                    renovation,
                                  });
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
                  ...(settingsWindow.tool === "wall"
                    ? [
                        {
                          id: "assembly",
                          label: "Wandaufbau",
                          content: (
                            <WallAssemblyFields
                              project={project}
                              value={toolDefaults.wall.assemblyId ?? null}
                              onChange={(assemblyId) => {
                                cancelInteraction();
                                const { assemblyId: _old, ...wall } = toolDefaults.wall;
                                const assembly = projectWallAssemblies(project).find(
                                  (a) => a.id === assemblyId,
                                );
                                const thickness = assembly
                                  ? assemblyThickness(assembly)
                                  : wall.thickness;
                                toolDefaults.setWall({
                                  ...wall,
                                  ...(assembly ? { assemblyId: assembly.id } : {}),
                                  thickness,
                                  bodyOffset: offsetAtThickness(wall, thickness),
                                });
                              }}
                              onLibrary={changeAssemblyLibrary}
                              hint="Vorgabe für neue Wände. Mit Aufbau ergibt sich die Wandstärke aus den Schichten (außen = Achsseite bei Achslage Außen, rechts in Zeichenrichtung)."
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
                  content:
                    target.kind === "drawing" ? (
                      drawingElementFields(target.id)
                    ) : (
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
                ...(target.kind === "window" || target.kind === "door"
                  ? [
                      {
                        id: "insert",
                        label: target.kind === "window" ? "Fensterelement" : "Türelement",
                        content: (() => {
                          const storey = storeyOf(project);
                          const hint = "Gilt für dieses Element; ein Rückgängig-Schritt.";
                          if (target.kind === "window") {
                            const opening = storey.windows.find((w) => w.id === target.id);
                            return (
                              <OpeningInsertFields
                                kind="window"
                                value={opening?.insert ?? null}
                                onChange={(insert) =>
                                  changeProject(
                                    setOpeningInsert(project, {
                                      kind: "window",
                                      id: target.id,
                                      insert: insert && checkedWindowInsert(insert),
                                    }),
                                    target,
                                  )
                                }
                                hint={hint}
                              />
                            );
                          }
                          const door = (storey.doors ?? []).find((d) => d.id === target.id);
                          return (
                            <OpeningInsertFields
                              kind="door"
                              value={door?.insert ?? null}
                              onChange={(insert) =>
                                changeProject(
                                  setOpeningInsert(project, {
                                    kind: "door",
                                    id: target.id,
                                    insert: insert && checkedDoorInsert(insert),
                                  }),
                                  target,
                                )
                              }
                              hint={hint}
                            />
                          );
                        })(),
                      },
                    ]
                  : []),
                ...(target.kind === "wall" ||
                target.kind === "column" ||
                target.kind === "railing" ||
                target.kind === "roofWindow" ||
                target.kind === "stair"
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
                                  : target.kind === "railing"
                                    ? project.storeys.flatMap((s) => s.railings ?? [])
                                    : target.kind === "roofWindow"
                                      ? project.storeys.flatMap((s) => s.roofWindows ?? [])
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
                                              : target.kind === "railing"
                                                ? updateRailing(p, id, { renovation })
                                                : target.kind === "roofWindow"
                                                  ? updateRoofWindow(p, id, { renovation })
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
                ...(target.kind === "wall"
                  ? [
                      {
                        id: "assembly",
                        label: "Wandaufbau",
                        content: (() => {
                          const wall = project.storeys
                            .flatMap((s) => s.walls)
                            .find((w) => w.id === target.id);
                          // All selected walls follow, the double-clicked one included.
                          const ids = [
                            ...new Set([
                              target.id,
                              ...selections.filter((s) => s.kind === "wall").map((s) => s.id),
                            ]),
                          ];
                          const apply = (change: () => Project) => {
                            try {
                              dispatchEditing({ type: "project", project: change() });
                              setModelError("");
                            } catch (error) {
                              setModelError(
                                error instanceof Error ? error.message : "Nicht möglich.",
                              );
                            }
                          };
                          return (
                            <WallAssemblyFields
                              project={project}
                              value={wall?.assemblyId ?? null}
                              flipped={wall?.assemblyFlipped}
                              onChange={(assemblyId) =>
                                apply(() => setWallAssembly(project, ids, assemblyId))
                              }
                              onFlip={() =>
                                apply(() =>
                                  flipWallAssembly(
                                    project,
                                    ids.filter(
                                      (id) =>
                                        project.storeys
                                          .flatMap((s) => s.walls)
                                          .find((w) => w.id === id)?.assemblyId,
                                    ),
                                  ),
                                )
                              }
                              onLibrary={changeAssemblyLibrary}
                              hint={
                                ids.length > 1
                                  ? "Gilt für alle gewählten Wände; ein Rückgängig-Schritt. Die Wandstärke ergibt sich aus den Schichten."
                                  : "Ein Rückgängig-Schritt. Die Wandstärke ergibt sich aus den Schichten; die Achse bleibt an ihrer Stelle."
                              }
                            />
                          );
                        })(),
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
          autoTexts={!!space}
          onCommit={commitText}
          onCancel={() => setTextDraft(null)}
        />
      )}
      {projectInfoOpen && (
        <ProjectInfoWindow
          project={realProject}
          onApply={(info) => {
            setProjectInfo(realProject, realProject, info);
            dispatchEditing({ type: "project-info", base: realProject, info });
          }}
          onClose={() => setProjectInfoOpen(false)}
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
        project={realProject}
        onSelectRoom={(id) => selectElement({ kind: "room", id })}
      />
      <FilterWindow
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        project={project}
        policy={visibility}
        place={filterPlace}
        selection={selections}
        onSelect={(targets) => {
          selectMany(targets);
          showNotice(`${targets.length} Element(e) ausgewählt`);
        }}
      />
      <ElementListPanel
        open={elementListOpen}
        onOpenChange={setElementListOpen}
        project={realProject}
        onSelect={(target) => selectElement(target)}
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
        <TopToolbar
          storeyName={storeyOf(project).name}
          onPenSets={() => setPenSetsOpen(true)}
          onLineCreator={() => setLineCreatorOpen(true)}
          onHatchLibrary={() => setHatchLibraryOpen(true)}
          onMeasure={() => selectTool("measure")}
          onFilter={() => setFilterOpen((o) => !o)}
          filterOpen={filterOpen}
          filterBlocked={filterPlace.kind === "blocked" ? filterPlace.reason : undefined}
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
          onHotkeys={() => setHotkeysOpen(true)}
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
          onElementList={() => {
            cancelInteraction();
            setDemandOpen(false);
            setModelError("");
            setElementListOpen(true);
          }}
          onProjectInfo={() => {
            setDemandOpen(false);
            setModelError("");
            setProjectInfoOpen(true);
          }}
          onTitleBlockPlanner={() => {
            setDemandOpen(false);
            setModelError("");
            // The last one edited, else the first; without any, a new „Plankopf“ (PK2).
            const blocks = realProject.titleBlocks ?? [];
            const open = blocks.find((t) => t.id === lastTitleBlockId) ?? blocks[0] ?? null;
            if (open) return selectCanvasTab(titleBlockTab(open.id));
            try {
              const id = crypto.randomUUID();
              const action = { kind: "create" as const, id, name: "Plankopf" };
              changeTitleBlocks(realProject, realProject, action);
              dispatchEditing({ type: "title-block", base: realProject, action });
              selectCanvasTab(titleBlockTab(id));
            } catch (cause) {
              setModelError((cause as Error).message);
            }
          }}
          navigatorOpen={navigatorOpen}
          demandOpen={demandOpen}
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
          !transformActive &&
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
              solid={mode === "3D"}
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
                title={`${section.name} – ${section.kind === "elevation" ? "Ansicht" : "Schnitt"}`}
                width={380}
                height={470}
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
                  storeyName={storeyOf(realProject).name}
                  sections={sections ?? []}
                  layouts={layoutNames}
                  onSelect={selectCanvasTab}
                  onOpenKind={openCanvasKind}
                  available={availableKinds}
                  canSplit={(view) => openSplit(shownTabs, view, activeView, "row") !== null}
                  onSplit={splitTab}
                  split={split !== null}
                  onUnsplit={() => setCanvasSplit(null)}
                  onClose={(view) => {
                    const next = closeCanvasTab(shownTabs, view, activeView);
                    setCanvasTabs(next.tabs);
                    if (next.active !== activeView) selectCanvasTab(next.active);
                  }}
                />
              </div>
              {split && (
                <SplitDivider
                  split={split}
                  onRatio={(ratio) => setCanvasSplit((s) => (s ? { ...s, ratio } : s))}
                />
              )}
              {activeBlock && (
                <TitleBlockBar
                  block={activeBlock}
                  onPdf={() => exportPdf("block", activeBlock.id)}
                  onSheet={(sheet) => {
                    const action = { kind: "sheet" as const, id: activeBlock.id, sheet };
                    try {
                      changeTitleBlocks(realProject, realProject, action);
                      dispatchEditing({ type: "title-block", base: realProject, action });
                    } catch (cause) {
                      setModelError((cause as Error).message);
                    }
                  }}
                />
              )}
              {sectionDocumentWindow && (
                <SectionDocumentWindow
                  project={realProject}
                  sectionId={sectionDocumentWindow}
                  denominator={planDenominator(realProject)}
                  onApply={(request) => {
                    // The document keeps the section's frame as it is saved (ZW5).
                    const section = realProject.sections?.find(
                      (s) => s.id === sectionDocumentWindow,
                    );
                    const framing =
                      request.kind === "create-section" && section
                        ? sectionFraming(realProject, section, request.denominator)
                        : null;
                    const action = framing ? { ...request, framing } : request;
                    changeDrawingDocument(realProject, realProject, action);
                    dispatchEditing({ type: "document", base: realProject, action });
                    if (action.kind === "create-section") setSectionDocumentId(action.id);
                  }}
                  onClose={() => setSectionDocumentWindow(null)}
                />
              )}
              {layoutSpace && (
                <LayoutBar
                  onPdf={() => exportPdf("layout", layoutSpace.id)}
                  name={(layoutSpace.layout ?? layoutSpace.master)!.name}
                  kind={layoutSpace.layout ? "Layout" : "Masterlayout"}
                  sheet={layoutSpace.sheet}
                  master={layoutSpace.layout ? (layoutSpace.master?.name ?? null) : undefined}
                  onSettings={() =>
                    setLayoutWindow(
                      layoutSpace.layout
                        ? {
                            kind: "layout",
                            id: layoutSpace.layout.id,
                            folderId: layoutSpace.layout.folderId,
                            name: layoutSpace.layout.name,
                          }
                        : { kind: "master", id: layoutSpace.id, name: layoutSpace.master!.name },
                    )
                  }
                />
              )}
              {layoutWindow && (
                <LayoutSettingsWindow
                  key={(layoutWindow.id ?? "new") + layoutWindow.kind}
                  project={realProject}
                  target={layoutWindow}
                  folders={layoutFolderTree(realProject)}
                  onApply={(action) => {
                    changeLayouts(realProject, realProject, action);
                    dispatchEditing({ type: "layout", base: realProject, action });
                  }}
                  onClose={() => setLayoutWindow(null)}
                />
              )}
              {fieldSectionId &&
                (() => {
                  const section = sections!.find((s) => s.id === fieldSectionId)!;
                  // In a split the section field stays live beside the other one; only the
                  // active field takes the height tool (docs/SPLITSCREEN.md).
                  const field = fieldProps("section");
                  const sectionActive = section.id === activeSection;
                  return (
                    <div
                      role="tabpanel"
                      aria-label={section.name}
                      className={cn("z-30", field?.className ?? "absolute inset-0")}
                      style={field?.style}
                      data-split-field={field?.["data-split-field"]}
                      data-split-active={field?.["data-split-active"]}
                      onClickCapture={field?.onClickCapture}
                    >
                      <SectionDrawingView
                        key={section.id}
                        project={project}
                        section={section}
                        cutFill={cutFill}
                        denominator={shownSectionDocument?.denominator ?? planDenominator(project)}
                        document={
                          shownSectionDocument
                            ? {
                                name: shownSectionDocument.name,
                                scale: drawingInfo(realProject, shownSectionDocument.id).scale,
                              }
                            : null
                        }
                        onSaveDocument={() => setSectionDocumentWindow(section.id)}
                        selectedIds={selectedIdSet}
                        onSettings={() => openSectionWindow(section.id)}
                        heightTool={
                          sectionActive &&
                          tool === "dimension" &&
                          toolDefaults.dimension.orientation === "height"
                            ? { kind: toolDefaults.dimension.heightKind ?? "shell" }
                            : null
                        }
                        onAddHeightMarks={(marks) =>
                          changeHeightMarks(
                            () => addHeightMarks(project, section.id, marks),
                            `${marks.points.length} Höhenkote(n) erstellt`,
                          )
                        }
                        onUpdateHeightMarks={(id, changes) =>
                          changeHeightMarks(
                            () => updateHeightMarks(project, section.id, id, changes),
                            changes.kind ? "Kotenart geändert" : "Höhenkoten verschoben",
                          )
                        }
                        onRemoveHeightMarks={(id) =>
                          changeHeightMarks(
                            () => removeHeightMarks(project, section.id, id),
                            "Höhenkoten gelöscht",
                          )
                        }
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
                      !split
                        ? {
                            left: -insets.left,
                            top: -insets.top,
                            right: -insets.right,
                            bottom: -insets.bottom,
                          }
                        : { inset: 0 }
                    }
                  >
                    {keepViewport(
                      <ViewportManager
                        safe={split ? undefined : insets}
                        startupNotice={
                          autosave.startupOffer && autosave.startupOffer.kind !== "empty" ? (
                            <RecoveryStartupNotice
                              offer={autosave.startupOffer}
                              onContinue={autosave.continueStartup}
                              onOpen={() => setRecoveryOpen(true)}
                            />
                          ) : undefined
                        }
                        key={viewKey}
                        cameraKey={viewKey}
                        pdfRequest={
                          pdfRequest && space && pdfRequest.target === `${space.kind}:${space.id}`
                            ? pdfRequest
                            : null
                        }
                        backdrop={space ? spaceBackdrop(realProject, space) : undefined}
                        underlay={
                          activeBlock
                            ? titleBlockUnderlay(activeBlock.sheet)
                            : layoutSpace
                              ? layoutUnderlay(layoutSpace.sheet)
                              : undefined
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
                              : groupRotate.active
                                ? {
                                    target: interaction.target,
                                    geometryPreview: groupRotate.adapter?.geometryPreview,
                                    rotationGuide: groupRotate.pivot
                                      ? {
                                          pivot: groupRotate.pivot,
                                          reference: groupRotate.session?.reference ?? null,
                                        }
                                      : undefined,
                                    aim: interaction.draft.move,
                                    pick:
                                      groupRotate.stage === "pivot"
                                        ? (point) => groupRotate.pickPivot(point)
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
                            tool === "roofWindow" ||
                            tool === "stair" ||
                            tool === "section" ||
                            tool === "elevation" ||
                            tool === "dimension" ||
                            tool === "text" ||
                            tool === "drawing" ||
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
                          tool === "roofWindow" ||
                          tool === "stair" ||
                          tool === "section" ||
                          tool === "elevation" ||
                          tool === "dimension" ||
                          tool === "text" ||
                          tool === "drawing" ||
                          tool === "window" ||
                          tool === "door"
                        }
                        hoverDwellMs={hoverDwellMs}
                        start={
                          pathDrawing
                            ? (pathPoints.at(-1) ?? null)
                            : tool === "section" || tool === "elevation"
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
                        draftFill={
                          tool === "hatch"
                            ? hatchFill
                            : tool === "drawing"
                              ? { color: "#0284c7", opacity: 0.08 }
                              : undefined
                        }
                        placedDrawings={placedDrawingViews}
                        onDrawingMask={(id, mask) => {
                          const view = placedDrawingViews?.find((v) => v.id === id);
                          if (!view) return;
                          try {
                            dispatchEditing({
                              type: "project",
                              project: setDrawing(project, id, { mask }, view.limit),
                            });
                            setModelError("");
                          } catch (error) {
                            setModelError(
                              error instanceof Error ? error.message : "Maske nicht möglich.",
                            );
                          }
                        }}
                        draftPattern={
                          tool === "hatch" ? toolDefaults.hatch.patternDefinition : undefined
                        }
                        draftShape={
                          tool === "slab"
                            ? "slab"
                            : tool === "slabOpening"
                              ? "slabOpening"
                              : tool === "room" && !roomByWalls
                                ? "room"
                                : roofPhase === "outline"
                                  ? "roof"
                                  : undefined
                        }
                        draftCircle={
                          circleTool
                            ? (point) =>
                                pathPoints[0]
                                  ? {
                                      center: pathPoints[0],
                                      diameter:
                                        2 *
                                        Math.hypot(
                                          point.x - pathPoints[0].x,
                                          point.y - pathPoints[0].y,
                                        ),
                                    }
                                  : null
                            : undefined
                        }
                        draftPatternRotation={toolDefaults.hatch.patternRotation}
                        draftPatternSize={toolDefaults.hatch.patternSize}
                        draftContour={
                          tool === "drawing" && drawingSource(toolDefaults.drawing.documentId)
                            ? (point) => {
                                const source = drawingSource(toolDefaults.drawing.documentId)!;
                                return maskOnPaper({
                                  position: point,
                                  mask: frameMask(source.framing, source.document.denominator),
                                });
                              }
                            : areaTool && construction !== "polygon"
                              ? (point) =>
                                  circleTool
                                    ? slabOpeningOutline({
                                        circle: {
                                          center: pathPoints[0] ?? point,
                                          diameter:
                                            2 *
                                            Math.hypot(
                                              point.x - (pathPoints[0] ?? point).x,
                                              point.y - (pathPoints[0] ?? point).y,
                                            ),
                                        },
                                      })
                                    : construction === "boundary"
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
                            target.kind === "stair" ||
                            target.kind === "railing" ||
                            target.kind === "roofWindow" ||
                            target.kind === "object"
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
                          // Mask edges of a placed drawing come with ZW3.
                          if (target.kind === "drawing") return;
                          cancelInteraction();
                          setSelection(target);
                          setTool("select");
                          setDemandOpen(false);
                          setModelError("");
                          dispatchEditing({ type: "begin", target, action: "edge", index, anchor });
                        }}
                        onCornerPick={(target, index, anchor) => {
                          // E1: columns and stairs move whole, with the clicked corner as handle.
                          if (target.kind === "column" || target.kind === "stair") {
                            if (
                              referenceSelection.selecting ||
                              !visibleLayerTarget(
                                visibilityNow.current.project,
                                visibilityNow.current.visibility,
                                target,
                              )
                            )
                              return false;
                            cancelInteraction();
                            setDemandOpen(false);
                            setModelError("");
                            groupMove.begin(anchor);
                            return true;
                          }
                          if (
                            !(target.kind === "wall" || isVertexTarget(target)) ||
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
                          dispatchEditing({
                            type: "begin",
                            target,
                            action: "point",
                            index,
                            anchor,
                          });
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
                        // Section symbols belong to the building plan, not to a sheet (ZW4).
                        sections={space ? undefined : sections}
                        onSectionSettings={openSectionWindow}
                        selectedSectionId={tool === "select" ? selectedSectionId : null}
                        onSectionSelect={tool === "select" ? selectSection : undefined}
                        onSectionLine={moveSectionLine}
                        selectionAnchor={pickedPoint.anchor}
                        tracing={tracingView}
                        placedSnap={placedSnap}
                        onLineLength={(lineId, segment, length, direction) => {
                          try {
                            dispatchEditing({
                              type: "project",
                              project: setLineSegmentLength(
                                project,
                                lineId,
                                segment,
                                length,
                                direction,
                              ),
                            });
                            setModelError("");
                          } catch (error) {
                            setModelError(
                              error instanceof Error ? error.message : "Länge nicht möglich.",
                            );
                          }
                        }}
                        sectionDraft={
                          tool === "section" && sectionStart
                            ? {
                                start: sectionStart,
                                end: sectionEnd,
                                mark: nextSectionLabel(project, sectionDefaults).mark,
                                symbolSize: sectionDefaults.symbolSize,
                              }
                            : tool === "elevation" && sectionStart
                              ? {
                                  start: sectionStart,
                                  end: sectionEnd,
                                  mark: nextSectionLabel(project, elevationDefaults, "elevation")
                                    .mark,
                                  symbolSize: elevationDefaults.symbolSize,
                                  kind: "elevation" as const,
                                }
                              : undefined
                        }
                        stairDraft={
                          tool === "stair" && stairStart
                            ? {
                                start: stairStart,
                                direction: stairDirection,
                                values:
                                  stairTread !== null
                                    ? { ...stairValues(toolDefaults.stair), tread: stairTread }
                                    : stairValues(toolDefaults.stair),
                                storeyHeight: storeyOf(project).height ?? null,
                              }
                            : undefined
                        }
                        dimensionDraft={
                          tool === "dimension" &&
                          dimensionDraft &&
                          (dimensionDraft.edit || toolDefaults.dimension.orientation !== "height")
                            ? {
                                orientation:
                                  dimensionDraft.edit?.orientation ??
                                  (toolDefaults.dimension.orientation === "height"
                                    ? "horizontal"
                                    : toolDefaults.dimension.orientation),
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
                        tool === "railing" ||
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
                        mode={mode}
                        grid={grid && !layoutSpace}
                      />,
                    )}
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
                  {groupRotate.active && (
                    <p
                      role="status"
                      className="pointer-events-none absolute bottom-12 left-3 rounded bg-popover px-2 py-1 text-xs"
                    >
                      {groupRotate.stage === "pivot"
                        ? "Drehen: Drehpunkt anklicken · Esc verwirft"
                        : groupRotate.stage === "reference"
                          ? "Drehen: Bezugsrichtung anklicken · Umschalt 45° · Esc verwirft"
                          : `Drehen: Zielrichtung anklicken · Tab: Winkel · Umschalt 45° · ${hotkeyLabel(resolvedHotkeys(project.hotkeys)["copy-toggle"])}: Kopie · Esc verwirft`}
                    </p>
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
              {!navigatorOpen && (
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
            className="glass-panel-strong absolute left-2 right-2 top-2 z-20 overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ height: PROPERTIES_HEIGHT }}
          >
            {/* One row across the whole width (UI1); what does not fit scrolls sideways by wheel,
                touchpad or dragging a free spot, without a visible bar, and fades out on the side
                where more waits (UI2). Fields that wrap or stack elsewhere stay in the row. */}
            <div
              ref={propertiesRow}
              data-more={propertiesMore}
              className="edge-fade scrollbar-none flex h-full items-center gap-4 overflow-x-auto overflow-y-hidden whitespace-nowrap px-3 py-1 [&_.flex-wrap]:flex-nowrap [&_.grid]:auto-cols-max [&_.grid]:grid-flow-col [&>*]:shrink-0"
              onScroll={(event) => measurePropertiesRow(event.currentTarget)}
              onWheel={(event) => {
                const row = event.currentTarget;
                if (event.deltaX || !event.deltaY || row.scrollWidth <= row.clientWidth) return;
                row.scrollLeft += event.deltaY;
              }}
              onPointerDown={(event) => {
                // Dragging a free spot (not a field or button) scrolls the row.
                if (
                  event.button !== 0 ||
                  (event.target as Element).closest(
                    "input,select,textarea,button,label,a,[role=button]",
                  )
                )
                  return;
                rowDrag.current = {
                  id: event.pointerId,
                  x: event.clientX,
                  left: event.currentTarget.scrollLeft,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const drag = rowDrag.current;
                if (drag?.id === event.pointerId)
                  event.currentTarget.scrollLeft = drag.left - (event.clientX - drag.x);
              }}
              onPointerUp={() => (rowDrag.current = null)}
              onPointerCancel={() => (rowDrag.current = null)}
            >
              <>
                <div className="flex shrink-0 items-center gap-3">
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
                ) : tool === "drawing" ? (
                  toolFields("drawing")
                ) : tool === "wall" ||
                  tool === "column" ||
                  tool === "railing" ||
                  tool === "roofWindow" ||
                  tool === "stair" ||
                  tool === "section" ||
                  tool === "elevation" ||
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
                ) : (tool === "slab" ||
                    tool === "slabOpening" ||
                    tool === "hatch" ||
                    tool === "line") &&
                  mode === "2D" ? (
                  toolFields(tool)
                ) : selection?.kind === "drawing" && selections.length === 1 ? (
                  drawingElementFields(selection.id, true)
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
            </div>
          </section>
          <div className="absolute bottom-2 left-2 z-20" style={{ top: insets.top }}>
            <ToolRail
              allowed={spaceTools ?? undefined}
              activeTool={tool}
              layout={toolLayout}
              onSelect={selectTool}
              onSettings={openToolDefaults}
              onCustomize={() => setRailCustomizing(true)}
            />
          </div>
          {railCustomizing && (
            <FloatingPanel
              open
              title="Werkzeugleiste anpassen"
              width={560}
              height={520}
              onClose={() => setRailCustomizing(false)}
            >
              <ToolRailCustomizer layout={toolLayout} onChange={setToolLayout} />
            </FloatingPanel>
          )}
          {navigatorShown && (
            <div
              className="absolute bottom-2 right-2 z-20 flex flex-col gap-2"
              style={{ width: navigatorWidth, top: insets.top }}
            >
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
              <div className="min-h-0 flex-1">
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
                  activeSectionId={activeSection}
                  onCreateSectionDocument={(id) => setSectionDocumentWindow(id)}
                  onOpenDocument={(id) => {
                    if (space && id) dispatchEditing({ type: "space", space: null });
                    cancelInteraction();
                    setSelection(null);
                    setDemandOpen(false);
                    setTool("select");
                    setMode("2D");
                    const doc = realProject.drawingDocuments?.find((d) => d.id === id);
                    const source = realProject.modelViews?.find((v) => v.id === doc?.modelViewId);
                    if (!source) return;
                    // A section or elevation document opens in its tab (docs/ABBILDER.md).
                    if (source.kind === "section") return openSectionDocument(doc!.id);
                    try {
                      selectWorkingStorey(realProject, realProject, source.storeyId);
                    } catch {
                      dispatchEditing({
                        type: "working-storey",
                        base: realProject,
                        storeyId: source.storeyId,
                      });
                      return;
                    }
                    dispatchEditing({
                      type: "working-storey",
                      base: realProject,
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
                  onLayoutAction={(base, action) =>
                    dispatchEditing({ type: "layout", base, action })
                  }
                  onOpenLayout={(id) => selectCanvasTab(layoutTab(id))}
                  onTitleBlockAction={(base, action) =>
                    dispatchEditing({ type: "title-block", base, action })
                  }
                  onOpenTitleBlock={(id) => selectCanvasTab(titleBlockTab(id))}
                  onExportPdf={exportPdf}
                  staleLayouts={staleLayouts}
                  onRefreshLayout={(id) => {
                    refreshLayout(id);
                    showNotice("Plan aktualisiert.");
                  }}
                  activeTitleBlockId={space?.id ?? null}
                  activeLayoutId={activeLayout}
                  project={realProject}
                  active={
                    selectedSection
                      ? [selectedSection.id]
                      : selections.length
                        ? selections.map((t) => t.id)
                        : [storeyOf(project).id]
                  }
                  onClose={() => setNavigatorOpen(false)}
                  onSectionSettings={openSectionWindow}
                  onSelect={(id, _label, toggle) => {
                    if (id === SECTIONS_FOLDER_ID || id === ELEVATIONS_FOLDER_ID) return;
                    if (sectionIds.has(id)) return selectCanvasTab(sectionTab(id));
                    if (realProject.storeys.some((s) => s.id === id)) {
                      // A storey always shows its plan: layout, section or Plankopf tab close.
                      if (space) dispatchEditing({ type: "space", space: null });
                      setActiveSectionId(null);
                      setActiveLayoutId(null);
                      setSectionDocumentId(null);
                      cancelInteraction();
                      setSelection(null);
                      setDemandOpen(false);
                      setTool("select");
                      setActiveDocumentId(null);
                      dispatchEditing({ type: "working-storey", base: realProject, storeyId: id });
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
              </div>
              <TracingPanel project={project} value={tracing} onChange={setTracing} />
            </div>
          )}
        </div>
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
          onGridSettings={space ? setPaperGridSettings : setPlanGridSettings}
          grid={grid}
          snap={snap}
          ortho={ortho}
          selection={selections.length}
          onGrid={() => setGrid((value) => !value)}
          onSnap={() => setSnap((value) => !value)}
          onOrtho={() => setOrtho((value) => !value)}
        />
      </main>
    </CadAppearanceProvider>
  );
}
