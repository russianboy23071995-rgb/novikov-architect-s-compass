import { WallDrawingFields } from "./WallDrawingFields";
import { useToolDefaults } from "./useToolDefaults";
import { pickupToolDefaults } from "@/application/tools/pickup";
import { rectangleContour, prepareHatchBoundaries } from "@/application/hatches/construction";
import type { HatchConstruction } from "@/application/hatches/construction";
import { useMeasurement } from "./useMeasurement";
import type { MeasurementMode } from "./useMeasurement";
import { editAnchor } from "@/lib/bim/direct-edit";
import { propertyFormKey } from "./property-form-key";
import { ReferenceCalibrationControls } from "./ReferenceCalibrationControls";
import { useReferenceCalibration } from "./useReferenceCalibration";
import { useImageImport } from "./useImageImport";
import { WindowPlacementFields } from "./WindowPlacementFields";
import { useWindowPlacement } from "./useWindowPlacement";
import { useSelectionMove } from "./useSelectionMove";
import { useElementSelection } from "./useElementSelection";
import { selectionIndex, type SelectionSet } from "@/application/selection/state";
import type { SnapCandidate } from "@/constraints/snapping/engine";
import { CanvasDisplaySettings } from "./CanvasDisplaySettings";
import { useCanvasDisplaySettings } from "./useCanvasDisplaySettings";
import { beginWallChain, appendWallChain, finishWallChain } from "@/application/drawing/wall-chain";
import type { WallChain } from "@/application/drawing/wall-chain";
import { defaultGridSettings } from "@/application/snapping/grid-settings";
import { HatchFillFields, HatchPaintFields } from "./HatchControls";
import { selectedLayerElement } from "@/application/layers/selection";
import { createLayerVisibilityPolicy, visibleLayerTarget } from "@/application/layers/visibility";
import type { LayerVisibilityContext } from "@/application/layers/visibility";
import { useReferenceSelection } from "./useReferenceSelection";
import { DEFAULT_HOVER_DWELL_MS } from "@/constraints/inference/hover-reference";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AiCommandBar } from "./AiCommandBar";
import { InteractionInput } from "./InteractionInput";
import { useToolInteraction } from "./useToolInteraction";
import {
  editInteraction,
  drawingInteraction,
  wallStartSnapPolicy,
} from "@/application/tools/adapters";
import { DemandMenu } from "./DemandMenu";
import { BimInspector } from "./BimInspector";
import {
  createEditingState,
  editingReducer,
  supportsWallWorkplaneEdit,
} from "@/application/direct-edit/controller";
import { createDrawing } from "@/application/drawing/actions";
import type { EditAction } from "@/lib/bim/direct-edit";
import { ProjectNavigator } from "./ProjectNavigator";
import { StatusBar } from "./StatusBar";
import { ToolRail } from "./ToolRail";
import { HatchPatternCreator } from "./HatchPatternCreator";
import { TopToolbar } from "./TopToolbar";
import { ViewportManager } from "./CadViewport";
import { CornerPreviewDialog } from "./CornerPreviewDialog";
import { serializeProject } from "@/lib/bim/model";
import { readProjectFile, PROJECT_FILE_LIMIT } from "@/lib/bim/history";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { exportIfc } from "@/lib/bim/ifc";
import { applySelectionCommand } from "@/application/commands/selection-command";
import type { Point, Project } from "@/lib/bim/model";
import { createExampleProject } from "./bim-view";
import type { Selection } from "./bim-view";
import type { ToolId, ViewMode, ViewportLayout } from "./cad-types";
import { LineStyleFields } from "./LineControls";
import { LayerProperties } from "./LayerProperties";
import { LayerManager } from "./LayerManager";

export function CadWorkspace({
  layerVisibility,
  initialProject,
}: { layerVisibility?: LayerVisibilityContext; initialProject?: Project } = {}) {
  const [hatchLibraryOpen, setHatchLibraryOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
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
  const [editing, dispatchEditing] = useReducer(editingReducer, undefined, () =>
    createEditingState(initialProject ?? createExampleProject()),
  );
  const { history, session: pendingSession } = editing;
  const project = history.present;
  const visibility = useMemo(
    () =>
      createLayerVisibilityPolicy(
        project,
        layerVisibility ?? {
          scope: { kind: "bim-project" },
          hiddenLayerIds: project.bimVisibility.hiddenLayerIds,
        },
      ),
    [project, layerVisibility],
  );
  const visibilityNow = useRef({ project, visibility });
  visibilityNow.current = { project, visibility };
  const editSession =
    pendingSession && visibleLayerTarget(project, visibility, pendingSession.target)
      ? pendingSession
      : null;
  useEffect(() => {
    if (pendingSession && !editSession) dispatchEditing({ type: "cancel" });
  }, [pendingSession, editSession]);
  const imageInput = useRef<HTMLInputElement>(null);
  const cancelMeasurement = useRef<() => void>(() => {});
  const cancelCalibration = useRef<() => void>(() => {});
  const cancelImage = useRef<() => void>(() => {});
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<{ project: Project; name: string } | null>(null);
  const [readingFile, setReadingFile] = useState(false);
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
  const pathDrawing = tool === "line" || tool === "hatch";
  const [hatchConstruction, setHatchConstruction] = useState<HatchConstruction>("polygon");
  const findHatchBoundary = useMemo(
    () =>
      tool === "hatch" && hatchConstruction === "boundary"
        ? prepareHatchBoundaries(project, visibility)
        : null,
    [tool, hatchConstruction, project, visibility],
  );
  const toolDefaults = useToolDefaults(project);
  const hatchFill = toolDefaults.hatch.fill;
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
  }, []);

  const navigateHistory = useCallback(
    (direction: "undo" | "redo") => {
      dispatchEditing({ type: direction });
      cancelInteraction();
      setSelection(null);
      setDemandOpen(false);
      setTool("select");
      setModelError("");
      setExportMessage("");
    },
    [cancelInteraction, setSelection],
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
        }
        return;
      }
      const map: Record<string, ToolId> = {
        v: "select",
        w: "wall",
        s: "slab",
        l: "line",
        h: "hatch",
      };
      const next = map[event.key.toLowerCase()];
      if (next) {
        cancelInteraction();
        setTool(next);
        if (next === "window" || next === "line" || next === "hatch") setSelection(null);
        setModelError("");
        if (next === "window" || next === "wall" || next === "line" || next === "hatch")
          setMode("2D");
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
  }, [fullscreen, cancelInteraction, referenceSelection.selecting, navigateHistory, setSelection]);

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
    if (next === "window" || next === "measure") setDemandOpen(false);
    if (next === "window" || next === "line" || next === "hatch") setSelection(null);
    setModelError("");
    if (
      next === "measure" ||
      next === "window" ||
      next === "wall" ||
      next === "line" ||
      next === "hatch"
    )
      setMode("2D");
  };

  const showSelection = (
    next: Selection,
    anchor?: Point,
    index?: number,
    modelPoint?: Point,
    edgeIndex?: number,
  ) => {
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
    if (toggle && next) {
      cancelInteraction();
      choose([next], true);
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
    const solidMove = inSolid && selection.kind === "wall";
    if (!inSolid && selection.kind === "wall" && action === "move") {
      const origin = pickedPoint.anchor ?? editAnchor(project, selection);
      cancelInteraction();
      try {
        groupMove.begin(origin);
        if (layout === "single") setMode("2D");
        setModelError("");
      } catch (error) {
        setModelError(error instanceof Error ? error.message : "Bewegung nicht mÃ¯Â¿Â½glich.");
      }
      return;
    }

    if (solidMove && !pickedPoint.anchor) {
      showNotice(
        "Zuerst einen sichtbaren WandfuÃƒÅ¸punkt anklicken, dann die Bearbeitung wÃƒÂ¤hlen.",
      );
      return;
    }
    if (solidMove && !supportsWallWorkplaneEdit(selection, action, pickedPoint.index)) {
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

  const changeProject = (next: Project, selected: Selection) => {
    if (referenceSelection.selecting) return;
    dispatchEditing({ type: "project", project: next });
    showSelection(selected);
    selectCommitted(next, selected);
    showNotice("Model updated");
  };

  const saveProject = () => {
    try {
      const url = URL.createObjectURL(
        new Blob([serializeProject(project)], { type: "application/json" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "novikov-project.json";
      document.body.appendChild(anchor);
      try {
        anchor.click();
      } finally {
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setExportMessage(
        "Projektdatei erstellt Ã‚Â· Download angefordert. Noch nicht ÃƒÂ¼bernommene Eingaben sind nicht enthalten.",
      );
      setModelError("");
    } catch {
      setModelError("Projekt konnte nicht exportiert werden. Das Modell bleibt erhalten.");
    }
  };

  const openProjectFile = async (file: File) => {
    if (readingFile) return;
    setReadingFile(true);
    setModelError("");
    try {
      if (file.size > PROJECT_FILE_LIMIT)
        throw new Error("Projektdatei ist grÃƒÂ¶ÃƒÅ¸er als 10 MB.");
      const next = readProjectFile(await file.text());
      setPendingFile({ project: next, name: file.name });
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
      const id = `${tool === "hatch" ? "hatch" : "line"}-${crypto.randomUUID()}`;
      changeProject(
        createDrawing(
          base!,
          project,
          id,
          tool === "hatch"
            ? { kind: "hatch", points, ...toolDefaults.hatch }
            : {
                kind: "line",
                lineKind,
                points,
                appearance: lineAppearance,
                layerId: toolDefaults.line.layerId,
              },
        ),
        {
          kind: tool === "hatch" ? "hatch" : "line",
          id,
        },
      );
    } catch {
      setModelError(
        tool === "hatch"
          ? "Schraffur prÃƒÂ¼fen: mindestens drei verschiedene Eckpunkte ohne Kreuzungen oder ÃƒÅ“berlappung; Deckkraft 0Ã¢â‚¬â€œ100 %. Nach ModellÃƒÂ¤nderung erneut beginnen."
          : "Linie benÃƒÂ¶tigt unterschiedliche Punkte und eine StrichstÃƒÂ¤rke von 0,05 bis 2 mm.",
      );
    }
  };

  const drawPoint = (point: Point, candidate?: SnapCandidate | null) => {
    setModelError("");
    if (tool === "hatch" && hatchConstruction === "boundary") {
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
        setModelError("Das Modell wurde geÃƒÂ¤ndert. Zeichnen erneut beginnen.");
        return;
      }
      const previous = pathPoints.at(-1);
      if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) === 0) {
        setModelError("NÃƒÂ¤chsten Punkt an einer anderen Position wÃƒÂ¤hlen.");
        return;
      }
      const next = [...pathPoints, point];
      if (
        tool === "hatch" &&
        hatchConstruction !== "polygon" &&
        next.length === (hatchConstruction === "diagonal" ? 2 : 3)
      ) {
        try {
          finishPath(rectangleContour(hatchConstruction as "diagonal" | "side-height", next));
        } catch (e) {
          setModelError(e instanceof Error ? e.message : "UngÃƒÂ¼ltiges Rechteck.");
        }
      } else if (tool === "line" && lineKind === "line" && next.length === 2) finishPath(next);
      else setPathPoints(next);
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
      setModelError(error instanceof Error ? error.message : "UngÃƒÂ¼ltige Wand.");
    }
  };

  const finishChain = () => {
    if (!activeChain) return;
    try {
      const next = finishWallChain(activeChain, project);
      changeProject(next, { kind: "wall", id: activeChain.wallIds.at(-1)! });
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "UngÃƒÂ¼ltige Wandkette.");
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
  const imageTool = useImageImport(project, visibility, (next, id) =>
    changeProject(next, { kind: "reference", id }),
  );
  cancelImage.current = imageTool.cancel;
  const calibration = useReferenceCalibration(project, selections, visibility, (next, id) =>
    changeProject(next, { kind: "reference", id }),
  );
  cancelCalibration.current = calibration.cancel;
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
    measurement.adapter ?? calibration.adapter ?? imageTool.adapter ?? windowTool.adapter;
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
        "IFC export ready Ã‚Â· download requested" +
          (project.storey.lines?.length || project.storey.hatches.length
            ? " Ã‚Â· 2D-Linien und Schraffuren sind nur in der JSON-Projektdatei enthalten."
            : ""),
      );
    } catch {
      setModelError("IFC export failed. The model is unchanged; please try again.");
    } finally {
      setExportingIfc(false);
    }
  };

  return (
    <TooltipProvider>
      <CanvasDisplaySettings
        open={displaySettingsOpen}
        onOpenChange={setDisplaySettingsOpen}
        wallWidth={wallWidth}
        onWallWidth={setWallWidth}
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
          aria-label="Projektdatei auswÃƒÂ¤hlen"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void openProjectFile(file);
          }}
        />
        <Dialog
          open={Boolean(pendingFile)}
          onOpenChange={(open) => {
            if (!open) setPendingFile(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Projektdatei laden?</DialogTitle>
              <DialogDescription>
                {pendingFile?.name} Ã‚Â· {pendingFile?.project.storey.walls.length} WÃƒÂ¤nde Ã‚Â·{" "}
                {pendingFile?.project.storey.windows.length} Fenster Ã‚Â·{" "}
                {pendingFile?.project.storey.lines?.length ?? 0} Linien Ã‚Â·{" "}
                {pendingFile?.project.storey.hatches.length ?? 0} Schraffuren Ã‚Â·{" "}
                {pendingFile?.project.storey.references.length ?? 0} Bildreferenzen. Ersetzt das
                aktuelle Modell. Mit Undo kannst du zum vorherigen Modell zurÃƒÂ¼ckkehren. Nicht
                ÃƒÂ¼bernommene Formulareingaben werden verworfen.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingFile(null)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  if (pendingFile) {
                    dispatchEditing({ type: "load-project", project: pendingFile.project });
                    showSelection(null);
                    setExportMessage("Projektdatei geladen.");
                    setPendingFile(null);
                  }
                }}
              >
                Projekt laden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <HatchPatternCreator open={hatchLibraryOpen} onOpenChange={setHatchLibraryOpen} />
        {!fullscreen && (
          <TopToolbar
            onHatchLibrary={() => setHatchLibraryOpen(true)}
            onMeasure={() => selectTool("measure")}
            measuring={tool === "measure"}
            onImportImage={() => {
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
            mode={mode}
            layout={layout}
            grid={grid}
            snap={snap}
            navigatorOpen={navigatorOpen}
            demandOpen={demandOpen}
            onMode={(next) => {
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
            onOpen={() => {
              if (!readingFile) fileInput.current?.click();
            }}
            onUndo={() => navigateHistory("undo")}
            onRedo={() => navigateHistory("redo")}
            selectedLayer={project.layers.find((l) => l.id === selectedLayerId) ?? null}
            onLayerVisibility={(action) =>
              dispatchEditing({ type: "visibility", base: project, action })
            }
            canUndoVisibility={Boolean(editing.visibilityHistory?.past.length)}
            canRedoVisibility={Boolean(editing.visibilityHistory?.future.length)}
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
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
          project={project}
          onVisibility={(base, action) => dispatchEditing({ type: "visibility", base, action })}
          canUndoVisibility={Boolean(editing.visibilityHistory?.past.length)}
          canRedoVisibility={Boolean(editing.visibilityHistory?.future.length)}
          open={layersOpen}
          onOpenChange={setLayersOpen}
          error={editing.error}
          onManage={(base, request) => dispatchEditing({ type: "manage-layer", base, request })}
        />
        {demandOpen &&
          !imageTool.active &&
          !groupMove.active &&
          !referenceSelection.selecting &&
          (mode === "2D" || (tool === "select" && selection && !editSession)) && (
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
              selectionCount={selections.length}
              onMoveSelection={
                selections.length > 1 || selection?.kind === "reference"
                  ? () => {
                      cancelInteraction();
                      try {
                        groupMove.begin();
                        setDemandOpen(false);
                        setMode("2D");
                        setModelError("");
                      } catch (error) {
                        setModelError(
                          error instanceof Error ? error.message : "Bewegung nicht mÃƒÂ¶glich.",
                        );
                      }
                    }
                  : undefined
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
                  ? "Bild wird geprÃƒÂ¼ftÃ¢â‚¬Â¦"
                  : imageTool.error || "Obere linke Ecke anklicken Ã‚Â· Esc: Abbruch"}
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
                  <option value="area">FlÃƒÂ¤che</option>
                  <option value="angle">Winkel</option>
                </select>
              </label>
              <span role="status">
                {measurementMode === "angle"
                  ? "Schenkelpunkt Ã¢â€ â€™ Scheitel Ã¢â€ â€™ Schenkelpunkt Ã‚Â· Esc: Beenden"
                  : measurementMode === "area"
                    ? "Punkte setzen Ã‚Â· Doppelklick schlieÃƒÅ¸t Ã‚Â· Danach Klick fÃƒÂ¼r neue Messung Ã‚Â· Esc: Beenden"
                    : "Zwei Punkte anklicken Ã‚Â· Danach Klick fÃƒÂ¼r neue Messung Ã‚Â· Esc: Beenden"}
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
                  <option value="side-height">Rechteck: Seite und HÃƒÂ¶he</option>
                  <option value="boundary">Geschlossene Kontur ÃƒÂ¼bernehmen</option>
                </select>
              </label>
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
                  ? `${pathPoints.length} Punkte Ã‚Â· Doppelklick schlieÃƒÅ¸t`
                  : hatchConstruction === "boundary"
                    ? "In ein geschlossenes Polygon klicken"
                    : hatchConstruction === "diagonal"
                      ? "Zwei gegenÃƒÂ¼berliegende Ecken anklicken"
                      : "Zwei Seitenpunkte, danach HÃƒÂ¶he anklicken"}{" "}
                Ã‚Â· Esc verwirft
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
              <span className="text-xs">{pathPoints.length} Punkte Ã‚Â· Esc verwirft</span>
              {lineKind === "polyline" && (
                <span className="text-xs">
                  Doppelklick zum AbschlieÃƒÅ¸en Ã‚Â· Enter im Feld: nÃƒÂ¤chster Punkt Ã‚Â· Enter im
                  Grundriss: Abschluss
                </span>
              )}
              <Button size="sm" variant="ghost" onClick={() => selectTool("select")}>
                Zeichnen abbrechen
              </Button>
            </section>
          ) : selections.length > 1 ? (
            <p className="p-3 text-xs text-muted-foreground" role="status">
              {selections.length} Elemente ausgewÃƒÂ¤hlt.{" "}
              {mode === "3D"
                ? "Gemeinsam bewegen: im Grundriss oder per Modellbefehl."
                : "Im ElementmenÃƒÂ¼ Ã¢â‚¬Å¾Auswahl frei bewegenÃ¢â‚¬Å“ wÃƒÂ¤hlen, dann Ursprung und Ziel anklicken."}
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
        </section>
        <div className="relative flex min-h-0 flex-1 gap-2">
          {!fullscreen && (
            <ToolRail
              activeTool={tool}
              collapsed={railCollapsed}
              onSelect={selectTool}
              onToggle={() => setRailCollapsed((value) => !value)}
            />
          )}
          <ResizablePanelGroup orientation="horizontal" className="min-w-0 flex-1">
            <ResizablePanel
              id="workspace"
              minSize="55%"
              defaultSize={navigatorOpen && !fullscreen ? "79%" : "100%"}
            >
              <div className="relative h-full min-w-0 overflow-hidden rounded-lg border border-border bg-workspace shadow-[0_20px_60px_var(--glass-deep)]">
                <ViewportManager
                  pickupScope={measurementContext}
                  onPickup={(target) => {
                    const defaults = pickupToolDefaults(project, visibility, target);
                    if (!defaults) return;
                    toolDefaults.apply(defaults);
                    selectTool(defaults.tool);
                    setDemandOpen(false);
                  }}
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
                            if (windowTool.pickingHost)
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
                  drawingProjectAt={drawingOrigin ? interaction.adapter?.previewProject : undefined}
                  visibility={visibility}
                  referenceSelection={referenceSelection}
                  selection={selection}
                  selections={selections}
                  onSelectMany={selectMany}
                  snapping={
                    interaction.adapter?.snapping ?? (tool === "wall" ? wallStartSnapPolicy : null)
                  }
                  drawing={(tool === "wall" || pathDrawing) && mode === "2D"}
                  endpointSnap={
                    pathDrawing ||
                    tool === "measure" ||
                    tool === "select" ||
                    tool === "wall" ||
                    tool === "window"
                  }
                  hoverDwellMs={hoverDwellMs}
                  start={pathDrawing ? (pathPoints.at(-1) ?? null) : wallStart}
                  draftPoints={pathDrawing ? pathPoints : []}
                  draftFill={tool === "hatch" ? hatchFill : undefined}
                  draftContour={
                    tool === "hatch" && hatchConstruction !== "polygon"
                      ? (point) =>
                          hatchConstruction === "boundary"
                            ? (findHatchBoundary?.(point) ?? [])
                            : rectangleContour(hatchConstruction, [...pathPoints, point])
                      : undefined
                  }
                  wallOutlineWidth={wallWidth}
                  gridSettings={gridSettings}
                  snap={snap}
                  ortho={ortho}
                  onSelect={selectElement}
                  onContourStretch={(target, index, anchor) => {
                    if (target.kind === "reference") return;
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
                  onEditCancel={() =>
                    measurement.adapter ? interaction.cancel() : dispatchEditing({ type: "cancel" })
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
                  onEditCommit={(_session, point, candidate) => interaction.pick(point, candidate)}
                  {...(tool === "wall" ||
                  (tool === "line" && lineKind === "polyline") ||
                  (tool === "hatch" && hatchConstruction === "polygon")
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
                {groupMove.active && (
                  <p
                    role="status"
                    className="pointer-events-none absolute bottom-12 left-3 rounded bg-popover px-2 py-1 text-xs"
                  >
                    {groupMove.pickingOrigin
                      ? "Bewegungsursprung im Grundriss anklicken"
                      : "Klick platziert die Auswahl Ã‚Â· Tab: LÃƒÂ¤nge/Winkel Ã‚Â· Esc verwirft"}
                  </p>
                )}
                {tool === "wall" && (
                  <p
                    role="status"
                    className="pointer-events-none absolute bottom-12 left-3 rounded bg-popover px-2 py-1 text-xs"
                  >
                    Wandkette: Klick setzt Abschnitt Ã‚Â· Doppelklick/Enter beendet Ã‚Â· Esc
                    verwirft
                  </p>
                )}
                <InteractionInput
                  interaction={interaction}
                  position={demandPosition}
                  onPosition={setDemandPosition}
                />
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
                    className="absolute bottom-20 left-3 z-30 rounded bg-popover px-2 py-1 text-xs text-foreground"
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
                    project={project}
                    active={selections.length ? selections.map((t) => t.id) : [project.storey.id]}
                    onClose={() => setNavigatorOpen(false)}
                    onSelect={(id, _label, toggle) => {
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
    </TooltipProvider>
  );
}
