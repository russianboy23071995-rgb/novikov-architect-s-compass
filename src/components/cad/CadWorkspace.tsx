import { CanvasDisplaySettings } from "./CanvasDisplaySettings";
import { useCanvasDisplaySettings } from "./useCanvasDisplaySettings";
import { beginWallChain, appendWallChain, finishWallChain } from "@/application/drawing/wall-chain";
import type { WallChain } from "@/application/drawing/wall-chain";
import { defaultGridSettings } from "@/application/snapping/grid-settings";
import { HatchFillFields } from "./HatchControls";
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
import { editInteraction, drawingInteraction } from "@/application/tools/adapters";
import { DemandMenu } from "./DemandMenu";
import { BimInspector } from "./BimInspector";
import {
  createEditingState,
  editingReducer,
  supportsWallWorkplaneEdit,
} from "@/application/direct-edit/controller";
import { createDrawing, defaultHatchFill } from "@/application/drawing/actions";
import type { EditAction } from "@/lib/bim/direct-edit";
import { ProjectNavigator } from "./ProjectNavigator";
import { StatusBar } from "./StatusBar";
import { ToolRail } from "./ToolRail";
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
import { applyCommand } from "@/lib/bim/commands";
import type { Point, Project } from "@/lib/bim/model";
import { createExampleProject } from "./bim-view";
import type { Selection } from "./bim-view";
import type { ToolId, ViewMode, ViewportLayout } from "./cad-types";
import { defaultLineAppearance } from "@/lib/bim/lines";
import { LineStyleFields } from "./LineControls";
import { LayerProperties } from "./LayerProperties";
import { LayerManager } from "./LayerManager";

export function CadWorkspace({
  layerVisibility,
}: { layerVisibility?: LayerVisibilityContext } = {}) {
  const [layersOpen, setLayersOpen] = useState(false);
  const [tool, setTool] = useState<ToolId>("select");
  const [mode, setMode] = useState<ViewMode>("2D");
  const [layout, setLayout] = useState<ViewportLayout>("single");
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
    createEditingState(createExampleProject()),
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
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<{ project: Project; name: string } | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [requestedSelection, setSelection] = useState<Selection>({ kind: "wall", id: "wall-1" });
  const selection = visibleLayerTarget(project, visibility, requestedSelection);
  const selectedLayerId = selectedLayerElement(project, selection)?.layerId;
  useEffect(() => {
    if (requestedSelection && !selection) setSelection(null);
  }, [requestedSelection, selection]);
  const currentSelection = useRef(selection);
  currentSelection.current = selection;
  const [wallChain, setWallChain] = useState<WallChain | null>(null);
  const activeChain = wallChain?.base === project ? wallChain : null;
  const wallStart = activeChain?.points.at(-1) ?? null;
  const [pathPoints, setPathPoints] = useState<Point[]>([]);
  const [lineKind, setLineKind] = useState<"line" | "polyline">("line");
  const [drawingBase, setDrawingBase] = useState<Project | null>(null);
  const pathDrawing = tool === "line" || tool === "hatch";
  const [hatchFill, setHatchFill] = useState(defaultHatchFill);
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
  const [lineAppearance, setLineAppearance] = useState(defaultLineAppearance);
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
    [cancelInteraction],
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
        if (next === "line" || next === "hatch") setSelection(null);
        setModelError("");
        if (next === "wall" || next === "line" || next === "hatch") setMode("2D");
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
  }, [fullscreen, cancelInteraction, referenceSelection.selecting, navigateHistory]);

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
    if (next === "line" || next === "hatch") setSelection(null);
    setModelError("");
    if (next === "wall" || next === "line" || next === "hatch") setMode("2D");
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
  ) => {
    if (
      next &&
      !visibleLayerTarget(visibilityNow.current.project, visibilityNow.current.visibility, next)
    )
      return;
    showSelection(next, anchor, index, modelPoint, edgeIndex);
  };

  const startEdit = (action: EditAction) => {
    setDemandOpen(false);
    if (!selection) return;
    const inSolid = mode === "3D" && activeViewport === 0;
    const solidMove = inSolid && selection.kind === "wall";
    if (solidMove && !pickedPoint.anchor) {
      showNotice("Zuerst einen sichtbaren Wandfußpunkt anklicken, dann die Bearbeitung wählen.");
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
        "Projektdatei erstellt · Download angefordert. Noch nicht übernommene Eingaben sind nicht enthalten.",
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
      if (file.size > PROJECT_FILE_LIMIT) throw new Error("Projektdatei ist größer als 10 MB.");
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

  const finishPath = (points = pathPoints) => {
    try {
      const id = `${tool === "hatch" ? "hatch" : "line"}-${crypto.randomUUID()}`;
      changeProject(
        createDrawing(
          drawingBase!,
          project,
          id,
          tool === "hatch"
            ? { kind: "hatch", points, fill: hatchFill }
            : {
                kind: "line",
                lineKind,
                points,
                appearance: lineAppearance,
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
          ? "Schraffur prüfen: mindestens drei verschiedene Eckpunkte ohne Kreuzungen oder Überlappung; Deckkraft 0–100 %. Nach Modelländerung erneut beginnen."
          : "Linie benötigt unterschiedliche Punkte und eine Strichstärke von 0,05 bis 2 mm.",
      );
    }
  };

  const drawPoint = (point: Point) => {
    setModelError("");
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
      const next = [...pathPoints, point];
      if (tool === "line" && lineKind === "line" && next.length === 2) finishPath(next);
      else setPathPoints(next);
      return;
    }
    try {
      if (!activeChain) {
        setDrawingBase(project);
        setDemandPosition({ x: lastPointer.current.x + 16, y: lastPointer.current.y + 16 });
        setWallChain(beginWallChain(project, point));
      } else {
        setWallChain(appendWallChain(activeChain, project, `wall-${crypto.randomUUID()}`, point));
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

  const interaction = useToolInteraction(
    editSession
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
            dispatchEditing({ type: "confirm", session: editSession, selection, point, candidate });
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
          )
        : null,
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
          (project.storey.lines?.length || project.storey.hatches.length
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
          aria-label="Projektdatei auswählen"
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
                {pendingFile?.name} · {pendingFile?.project.storey.walls.length} Wände ·{" "}
                {pendingFile?.project.storey.windows.length} Fenster ·{" "}
                {pendingFile?.project.storey.lines?.length ?? 0} Linien ·{" "}
                {pendingFile?.project.storey.hatches.length ?? 0} Schraffuren. Ersetzt das aktuelle
                Modell. Mit Undo kannst du zum vorherigen Modell zurückkehren. Nicht übernommene
                Formulareingaben werden verworfen.
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
        {!fullscreen && (
          <TopToolbar
            onCanvasDisplay={() => setDisplaySettingsOpen(true)}
            onLayers={() => {
              cancelInteraction();
              setDemandOpen(false);
              setModelError("");
              setLayersOpen(true);
            }}
            tool={tool}
            mode={mode}
            layout={layout}
            grid={grid}
            snap={snap}
            navigatorOpen={navigatorOpen}
            demandOpen={demandOpen}
            onMode={(next) => {
              dispatchEditing({ type: "cancel" });
              setMode(next);
              setWallChain(null);
              setPathPoints([]);
              if (next === "3D") setTool("select");
            }}
            onLayout={(next) => {
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
          !referenceSelection.selecting &&
          (mode === "2D" || (tool === "select" && selection && !editSession)) && (
            <DemandMenu
              project={project}
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
                key={`layer:${JSON.stringify([selection, project])}`}
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
          {tool === "hatch" && mode === "2D" ? (
            <section aria-label="Schraffurwerkzeug" className="flex flex-wrap items-end gap-3">
              <HatchFillFields value={hatchFill} onChange={setHatchFill} />
              <span className="text-xs">
                {pathPoints.length} Punkte · Doppelklick schließt · Esc verwirft
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
              <LineStyleFields value={lineAppearance} onChange={setLineAppearance} />
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
                  Doppelklick zum Abschließen · Enter im Feld: nächster Punkt · Enter im Grundriss:
                  Abschluss
                </span>
              )}
              <Button size="sm" variant="ghost" onClick={() => selectTool("select")}>
                Zeichnen abbrechen
              </Button>
            </section>
          ) : (
            <BimInspector
              key={JSON.stringify([selection, project])}
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
                  project={project}
                  drawingPreview={activeChain?.preview}
                  visibility={visibility}
                  referenceSelection={referenceSelection}
                  selection={selection}
                  snapping={interaction.adapter?.snapping ?? null}
                  drawing={(tool === "wall" || pathDrawing) && mode === "2D"}
                  endpointSnap={pathDrawing || tool === "select" || tool === "wall"}
                  hoverDwellMs={hoverDwellMs}
                  start={pathDrawing ? (pathPoints.at(-1) ?? null) : wallStart}
                  draftPoints={pathDrawing ? pathPoints : []}
                  draftFill={tool === "hatch" ? hatchFill : undefined}
                  wallOutlineWidth={wallWidth}
                  gridSettings={gridSettings}
                  snap={snap}
                  ortho={ortho}
                  onSelect={selectElement}
                  onContourStretch={(target, index, anchor) => {
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
                  onEditCancel={() => dispatchEditing({ type: "cancel" })}
                  onPoint={(point) =>
                    referenceSelection.selecting
                      ? undefined
                      : interaction.adapter
                        ? interaction.pick(point)
                        : drawPoint(point)
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
                  tool === "hatch"
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
                    project={project}
                    selection={selection}
                    onExecute={(preview) =>
                      changeProject(applyCommand(project, selection, preview), selection)
                    }
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
                    active={selection?.id ?? project.storey.id}
                    onClose={() => setNavigatorOpen(false)}
                    onSelect={(id) => {
                      if (project.storey.walls.some((wall) => wall.id === id))
                        selectElement({ kind: "wall", id });
                      else if (project.storey.windows.some((opening) => opening.id === id))
                        selectElement({ kind: "window", id });
                      else if (project.storey.hatches.some((hatch) => hatch.id === id))
                        selectElement({ kind: "hatch", id });
                      else if (project.storey.lines?.some((line) => line.id === id))
                        selectElement({ kind: "line", id });
                      else selectElement(null);
                    }}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
        {!fullscreen && (
          <StatusBar
            gridSettings={gridSettings}
            onGridSettings={setGridSettings}
            grid={grid}
            snap={snap}
            ortho={ortho}
            selection={selection ? 1 : 0}
            onGrid={() => setGrid((value) => !value)}
            onSnap={() => setSnap((value) => !value)}
            onOrtho={() => setOrtho((value) => !value)}
          />
        )}
      </main>
    </TooltipProvider>
  );
}
