import { useEffect, useState } from "react";
import { PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AiCommandBar } from "./AiCommandBar";
import { DemandMenu } from "./DemandMenu";
import { ProjectNavigator } from "./ProjectNavigator";
import { StatusBar } from "./StatusBar";
import { ToolRail } from "./ToolRail";
import { TopToolbar } from "./TopToolbar";
import { ViewportManager } from "./CadViewport";
import { addWall } from "@/lib/bim/model";
import type { Point, Project } from "@/lib/bim/model";
import { createExampleProject } from "./bim-view";
import type { Selection } from "./bim-view";
import type { ToolId, ViewMode, ViewportLayout } from "./cad-types";

export function CadWorkspace() {
  const [tool, setTool] = useState<ToolId>("select");
  const [mode, setMode] = useState<ViewMode>("2D");
  const [layout, setLayout] = useState<ViewportLayout>("single");
  const [grid, setGrid] = useState(true);
  const [snap, setSnap] = useState(true);
  const [ortho, setOrtho] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(true);
  const [project, setProject] = useState(createExampleProject);
  const [selection, setSelection] = useState<Selection>({ kind: "wall", id: "wall-1" });
  const [wallStart, setWallStart] = useState<Point | null>(null);
  const [modelError, setModelError] = useState("");
  const [context, setContext] = useState("Level 01");
  const [activeViewport, setActiveViewport] = useState(0);
  const [notice, setNotice] = useState("Ready");
  const [fullscreen, setFullscreen] = useState(false);
  const [demandOpen, setDemandOpen] = useState(true);

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
        setTool(next);
        setWallStart(null);
        setModelError("");
        if (next === "wall") setMode("2D");
      }
      if (event.key === "Escape") {
        setWallStart(null);
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
    setTool(next);
    setWallStart(null);
    setModelError("");
    if (next === "wall") setMode("2D");
    setContext(
      next === "select" ? "Level 01" : `${next.charAt(0).toUpperCase()}${next.slice(1)} tool`,
    );
  };

  const selectElement = (next: Selection) => {
    setSelection(next);
    setTool("select");
    setWallStart(null);
    setModelError("");
    if (next) setNavigatorOpen(true);
    setContext(next ? `${next.kind}: ${next.id}` : "Level 01");
  };

  const changeProject = (next: Project, selected: Selection) => {
    setProject(next);
    selectElement(selected);
    showNotice("Model updated");
  };

  const drawPoint = (point: Point) => {
    setModelError("");
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

  return (
    <TooltipProvider>
      <main className="cad-shell flex h-dvh min-h-[560px] flex-col gap-2 overflow-hidden p-2 text-foreground">
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
              setMode(next);
              setWallStart(null);
              if (next === "3D") setTool("select");
            }}
            onLayout={(next) => {
              setLayout(next);
              setActiveViewport(0);
            }}
            onGrid={() => setGrid((value) => !value)}
            onSnap={() => setSnap((value) => !value)}
            onNavigator={() => setNavigatorOpen((value) => !value)}
            onDemand={() => setDemandOpen((value) => !value)}
            onAction={showNotice}
          />
        )}
        {!fullscreen && <DemandMenu open={demandOpen} />}
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
                  drawing={tool === "wall" && mode === "2D"}
                  start={wallStart}
                  snap={snap}
                  ortho={ortho}
                  onSelect={selectElement}
                  onPoint={drawPoint}
                  layout={layout}
                  mode={mode}
                  grid={grid}
                  active={activeViewport}
                  onActive={setActiveViewport}
                  onFullscreen={() => setFullscreen((value) => !value)}
                />
                {modelError && (
                  <p
                    role="alert"
                    className="absolute left-3 top-20 z-30 max-w-sm rounded bg-popover p-2 text-xs text-destructive"
                  >
                    {modelError}
                  </p>
                )}
                <AiCommandBar context={context} onExecute={showNotice} />
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
                    selection={selection}
                    onChange={changeProject}
                    active={selection?.id ?? project.storey.id}
                    onClose={() => setNavigatorOpen(false)}
                    onSelect={(id) => {
                      if (project.storey.walls.some((wall) => wall.id === id))
                        selectElement({ kind: "wall", id });
                      else if (project.storey.windows.some((opening) => opening.id === id))
                        selectElement({ kind: "window", id });
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
