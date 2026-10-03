import { DEFAULT_HOVER_DWELL_MS } from "@/constraints/inference/hover-reference";
import { useEffect, useReducer, useRef, useState } from "react";
import { PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AiCommandBar } from "./AiCommandBar";
import { PrecisionInput } from "./PrecisionInput";
import { DemandMenu } from "./DemandMenu";
import { BimInspector } from "./BimInspector";
import { createEditingState, editingReducer } from "@/application/direct-edit/controller";
import { numericMoveAxis, previewMovementInput } from "@/application/direct-edit/numeric";
import { usePrecisionDraft } from "./usePrecisionDraft";
import { previewLineInput } from "@/application/drawing/line-input";
import type { EditAction } from "@/lib/bim/direct-edit";
import { ProjectNavigator } from "./ProjectNavigator";
import { StatusBar } from "./StatusBar";
import { ToolRail } from "./ToolRail";
import { TopToolbar } from "./TopToolbar";
import { ViewportManager } from "./CadViewport";
import { addWall, addLine, serializeProject } from "@/lib/bim/model";
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

export function CadWorkspace() {
  const [tool, setTool] = useState<ToolId>("select");
  const [mode, setMode] = useState<ViewMode>("2D");
  const [layout, setLayout] = useState<ViewportLayout>("single");
  const [grid, setGrid] = useState(true);
  const [snap, setSnap] = useState(true);
  const [ortho, setOrtho] = useState(false);
  const [hoverDwellMs, setHoverDwellMs] = useState(DEFAULT_HOVER_DWELL_MS);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(true);
  const [editing, dispatchEditing] = useReducer(editingReducer, undefined, () =>
    createEditingState(createExampleProject()),
  );
  const { history, session: editSession } = editing;
  const project = history.present;
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<{ project: Project; name: string } | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [selection, setSelection] = useState<Selection>({ kind: "wall", id: "wall-1" });
  const [wallStart, setWallStart] = useState<Point | null>(null);
  const [linePoints, setLinePoints] = useState<Point[]>([]);
  const [lineKind, setLineKind] = useState<"line" | "polyline">("line");
  const [lineBase, setLineBase] = useState<Project | null>(null);
  const lineOrigin =
    tool === "line" && lineKind === "line" && linePoints.length === 1 ? linePoints[0] : null;
  const inputDraft = usePrecisionDraft(editSession ?? lineOrigin ?? null);
  const aim = inputDraft.aim;
  const numericAxis = editSession ? numericMoveAxis(editSession) : null;
  const supportsInput =
    !!lineOrigin ||
    (!!editSession &&
      ((editSession.action === "move" && editSession.target.kind !== "window") || !!numericAxis));
  const hasInput = inputDraft.hasInput;
  const inputPreview = (() => {
    if (!supportsInput || (!hasInput && !aim)) return null;
    try {
      const result = editSession
        ? previewMovementInput(
            editSession,
            project,
            selection,
            inputDraft.angle,
            inputDraft.length,
            aim,
          )
        : previewLineInput(
            lineBase!,
            project,
            lineOrigin!,
            aim,
            inputDraft.angle,
            inputDraft.length,
          );
      return { ...result, error: "" };
    } catch (error) {
      return { point: null, error: error instanceof Error ? error.message : "Ungültige Eingabe." };
    }
  })();
  const numericPreview = hasInput ? inputPreview : null;
  const [lineAppearance, setLineAppearance] = useState(defaultLineAppearance);
  const [modelError, setModelError] = useState("");
  const [exportingIfc, setExportingIfc] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const [activeViewport, setActiveViewport] = useState(0);
  const [notice, setNotice] = useState("Ready");
  const [fullscreen, setFullscreen] = useState(false);
  const [demandOpen, setDemandOpen] = useState(false);
  const [pickedPoint, setPickedPoint] = useState<{ index: number | null; anchor: Point | null }>({
    index: null,
    anchor: null,
  });
  const propertiesRef = useRef<HTMLElement>(null);
  const [demandPosition, setDemandPosition] = useState<Point>({ x: 160, y: 180 });
  const lastPointer = useRef<Point>({ x: 144, y: 164 });

  useEffect(() => {
    // The next gesture must anchor to the updated model, not the previous click.
    setPickedPoint({ index: null, anchor: null });
  }, [project]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.target instanceof Element &&
        (event.target.closest("input, textarea, select, [contenteditable=true]") ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey)
      )
        return;
      const map: Record<string, ToolId> = { v: "select", w: "wall", s: "slab", l: "line" };
      const next = map[event.key.toLowerCase()];
      if (next) {
        dispatchEditing({ type: "cancel" });
        setTool(next);
        if (next === "line") setSelection(null);
        setWallStart(null);
        setLinePoints([]);
        setModelError("");
        if (next === "wall" || next === "line") setMode("2D");
      }
      if (event.key === "Escape") {
        dispatchEditing({ type: "cancel" });
        setDemandOpen(false);
        setWallStart(null);
        setLinePoints([]);
        setTool("select");
        setModelError("");
        if (fullscreen) setFullscreen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen]);

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
    dispatchEditing({ type: "cancel" });
    setTool(next);
    if (next === "line") setSelection(null);
    setWallStart(null);
    setLinePoints([]);
    setModelError("");
    if (next === "wall" || next === "line") setMode("2D");
  };

  const selectElement = (next: Selection, anchor?: Point, index?: number, modelPoint?: Point) => {
    dispatchEditing({ type: "cancel" });
    setPickedPoint({ index: index ?? null, anchor: modelPoint ?? null });
    setDemandOpen(Boolean(next));
    if (next && (anchor || next.id !== selection?.id)) {
      const point = anchor ?? lastPointer.current;
      setDemandPosition({ x: point.x + 16, y: point.y + 16 });
    }
    setSelection(next);
    setTool("select");
    setWallStart(null);
    setLinePoints([]);
    setModelError("");
  };

  const startEdit = (action: EditAction) => {
    if (!selection) return;
    dispatchEditing({
      type: "begin",
      target: selection,
      action,
      index: pickedPoint.index,
      ...(pickedPoint.anchor ? { anchor: pickedPoint.anchor } : {}),
    });
    if (layout === "single") setMode("2D");
    setModelError("");
  };

  const changeProject = (next: Project, selected: Selection) => {
    dispatchEditing({ type: "project", project: next });
    selectElement(selected);
    showNotice("Model updated");
  };

  const navigateHistory = (direction: "undo" | "redo") => {
    dispatchEditing({ type: direction });
    selectElement(null);
    setExportMessage("");
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

  const finishLine = (points = linePoints) => {
    try {
      const id = `line-${crypto.randomUUID()}`;
      changeProject(addLine(project, { id, kind: lineKind, points, ...lineAppearance }), {
        kind: "line",
        id,
      });
    } catch {
      setModelError(
        "Linie benötigt unterschiedliche Punkte und eine Strichstärke von 0,05 bis 2 mm.",
      );
    }
  };

  const drawPoint = (point: Point) => {
    setModelError("");
    if (tool === "line") {
      if (linePoints.length === 0) {
        setLineBase(project);
        setDemandPosition({ x: lastPointer.current.x + 16, y: lastPointer.current.y + 16 });
      } else if (lineBase !== project) {
        setModelError("Das Modell wurde geändert. Linie erneut beginnen.");
        return;
      }
      const previous = linePoints.at(-1);
      if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) === 0) {
        setModelError("Nächsten Punkt an einer anderen Position wählen.");
        return;
      }
      const next = [...linePoints, point];
      if (lineKind === "line" && next.length === 2) finishLine(next);
      else setLinePoints(next);
      return;
    }
    if (!wallStart) {
      setWallStart(point);
      return;
    }
    try {
      const id = `wall-${crypto.randomUUID()}`;
      changeProject(
        addWall(project, { id, start: wallStart, end: point, thickness: 0.36, height: 2.8 }),
        { kind: "wall", id },
      );
    } catch {
      setModelError("Choose a different end point: a wall must have a positive length.");
    }
  };

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
          (project.storey.lines?.length
            ? " · 2D-Linien sind nur in der JSON-Projektdatei enthalten."
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
                {pendingFile?.project.storey.lines?.length ?? 0} Linien. Ersetzt das aktuelle
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
                    changeProject(pendingFile.project, null);
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
              setWallStart(null);
              setLinePoints([]);
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
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
          />
        )}
        {demandOpen && tool === "select" && selection && !editSession && (
          <DemandMenu
            project={project}
            selection={selection}
            position={demandPosition}
            onPosition={setDemandPosition}
            pointIndex={pickedPoint.index}
            onAction={startEdit}
            onInfo={() => {
              setFullscreen(false);
              propertiesRef.current?.focus();
            }}
          />
        )}
        <section
          ref={propertiesRef}
          tabIndex={-1}
          aria-label="Werkzeugeigenschaften"
          className="glass-panel-strong shrink-0 max-h-[35vh] overflow-auto rounded-lg px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <h2 className="mb-1 text-xs font-semibold">Werkzeugeigenschaften</h2>
          {tool === "line" && mode === "2D" ? (
            <section aria-label="Linienwerkzeug" className="flex flex-wrap items-end gap-3">
              <label className="text-xs">
                Zeichenmodus
                <select
                  aria-label="Zeichenmodus"
                  className="block rounded border bg-background p-1"
                  value={lineKind}
                  onChange={(e) => {
                    setLineKind(e.target.value as "line" | "polyline");
                    setLinePoints([]);
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
              <span className="text-xs">{linePoints.length} Punkte · Esc verwirft</span>
              {lineKind === "polyline" && (
                <span className="text-xs">Doppelklick zum Abschließen · alternativ Enter</span>
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
                  selection={selection}
                  drawing={(tool === "wall" || tool === "line") && mode === "2D"}
                  endpointSnap={tool === "line" || tool === "select" || tool === "wall"}
                  hoverDwellMs={hoverDwellMs}
                  start={tool === "line" ? (linePoints.at(-1) ?? null) : wallStart}
                  draftPoints={tool === "line" ? linePoints : []}
                  snap={snap}
                  ortho={ortho}
                  onSelect={selectElement}
                  onPoint={drawPoint}
                  editSession={editSession?.base === project ? editSession : null}
                  numericTarget={editSession && numericPreview ? numericPreview.point : undefined}
                  drawingTarget={lineOrigin && numericPreview ? numericPreview.point : undefined}
                  onDrawingAim={lineOrigin ? inputDraft.move : undefined}
                  onEditAim={(_session, point) => inputDraft.move(point)}
                  onEditDirection={(session, point) => inputDraft.fix(session.anchor, point)}
                  onEditCommit={(session, point) =>
                    dispatchEditing({ type: "confirm", session, selection, point })
                  }
                  {...(tool === "line" && lineKind === "polyline"
                    ? { onFinish: () => finishLine() }
                    : {})}
                  layout={layout}
                  mode={mode}
                  grid={grid}
                  active={activeViewport}
                  onActive={setActiveViewport}
                  onFullscreen={() => setFullscreen((value) => !value)}
                />
                {supportsInput ? (
                  <PrecisionInput
                    focusLengthToken={inputDraft.focus}
                    position={demandPosition}
                    onPosition={setDemandPosition}
                    angle={inputDraft.angle}
                    length={inputDraft.length}
                    angleHint={
                      numericAxis
                        ? String(Number(numericAxis.degrees.toFixed(2)))
                        : inputPreview && "degrees" in inputPreview
                          ? String(Number(inputPreview.degrees.toFixed(2)))
                          : "Maus"
                    }
                    lengthHint={
                      inputPreview && "metres" in inputPreview
                        ? String(Number(inputPreview.metres.toFixed(3)))
                        : "Maus"
                    }
                    axisLabel={numericAxis?.label ?? null}
                    {...(lineOrigin ? { mouseHint: "Mausziel · Klick zeichnet · 90° oben" } : {})}
                    error={hasInput ? (inputPreview?.error ?? "") : ""}
                    canConfirm={!!inputPreview?.point}
                    onChange={inputDraft.change}
                    onConfirm={() => {
                      if (inputPreview?.point && !editSession) drawPoint(inputPreview.point);
                      else if (inputPreview?.point && editSession)
                        dispatchEditing({
                          type: "confirm",
                          session: editSession,
                          selection,
                          point: inputPreview.point,
                        });
                    }}
                    onCancel={() => {
                      dispatchEditing({ type: "cancel" });
                      setLinePoints([]);
                    }}
                  />
                ) : editSession ? (
                  <div
                    role="status"
                    className="absolute left-3 top-20 z-30 rounded bg-popover px-3 py-2 text-xs shadow"
                  >
                    Vorschau · Zielpunkt anklicken · Esc bricht ab{" "}
                    <button onClick={() => dispatchEditing({ type: "cancel" })}>Abbrechen</button>
                  </div>
                ) : null}
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
                <AiCommandBar
                  project={project}
                  selection={selection}
                  onExecute={(preview) =>
                    changeProject(applyCommand(project, selection, preview), selection)
                  }
                />
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
