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
import type { ToolId, ViewMode, ViewportLayout } from "./cad-types";

export function CadWorkspace() {
  const [tool, setTool] = useState<ToolId>("select");
  const [mode, setMode] = useState<ViewMode>("3D");
  const [layout, setLayout] = useState<ViewportLayout>("single");
  const [grid, setGrid] = useState(true);
  const [snap, setSnap] = useState(true);
  const [ortho, setOrtho] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(true);
  const [activeTree, setActiveTree] = useState("floor-level-01");
  const [context, setContext] = useState("Level 01");
  const [activeViewport, setActiveViewport] = useState(0);
  const [notice, setNotice] = useState("Ready");
  const [fullscreen, setFullscreen] = useState(false);
  const [demandOpen, setDemandOpen] = useState(true);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const map: Record<string, ToolId> = { v: "select", w: "wall", s: "slab", l: "line" };
      const next = map[event.key.toLowerCase()];
      if (next) setTool(next);
      if (event.key === "Escape" && fullscreen) setFullscreen(false);
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
    setContext(next === "select" ? "Level 01" : `${next.charAt(0).toUpperCase()}${next.slice(1)} tool`);
  };

  return (
    <TooltipProvider>
      <main className="cad-shell flex h-dvh min-h-[560px] flex-col gap-2 overflow-hidden p-2 text-foreground">
        {!fullscreen && <TopToolbar tool={tool} mode={mode} layout={layout} grid={grid} snap={snap} navigatorOpen={navigatorOpen} demandOpen={demandOpen} onMode={setMode} onLayout={(next) => { setLayout(next); setActiveViewport(0); }} onGrid={() => setGrid((value) => !value)} onSnap={() => setSnap((value) => !value)} onNavigator={() => setNavigatorOpen((value) => !value)} onDemand={() => setDemandOpen((value) => !value)} onAction={showNotice} />}
        {!fullscreen && <DemandMenu open={demandOpen} />}
        <div className="relative flex min-h-0 flex-1 gap-2">
          {!fullscreen && <ToolRail activeTool={tool} collapsed={railCollapsed} onSelect={selectTool} onToggle={() => setRailCollapsed((value) => !value)} />}
          <ResizablePanelGroup orientation="horizontal" className="min-w-0 flex-1">
            <ResizablePanel id="workspace" minSize="55%" defaultSize={navigatorOpen && !fullscreen ? "79%" : "100%"}>
              <div className="relative h-full min-w-0 overflow-hidden rounded-lg border border-border bg-workspace shadow-[0_20px_60px_var(--glass-deep)]">
                <ViewportManager layout={layout} mode={mode} grid={grid} active={activeViewport} onActive={setActiveViewport} onFullscreen={() => setFullscreen((value) => !value)} />
                <AiCommandBar context={context} onExecute={showNotice} />
                <div className="pointer-events-none absolute left-3 top-12 z-30 rounded border border-border bg-popover/70 px-2 py-1 font-mono text-[9px] text-muted-foreground opacity-0 backdrop-blur transition-opacity data-[visible=true]:opacity-100" data-visible={notice !== "Ready"}>{notice}</div>
                {fullscreen && <Button variant="outline" size="sm" className="absolute right-3 top-3 z-40 h-7 bg-popover/80 text-[10px]" onClick={() => setFullscreen(false)}>Exit fullscreen</Button>}
                {!navigatorOpen && !fullscreen && <Button variant="outline" size="icon" className="absolute right-3 top-3 z-30 size-8 bg-popover/75" onClick={() => setNavigatorOpen(true)} aria-label="Open project navigator"><PanelRightOpen /></Button>}
              </div>
            </ResizablePanel>
            {navigatorOpen && !fullscreen && <><ResizableHandle withHandle className="mx-1 bg-transparent hover:bg-primary/30" /><ResizablePanel id="navigator" defaultSize="21%" minSize="16%" maxSize="32%"><ProjectNavigator active={activeTree} onClose={() => setNavigatorOpen(false)} onSelect={(id, label) => { setActiveTree(id); setContext(label.includes("Level") ? label : `Selection: ${label}`); showNotice(`${label} selected`); }} /></ResizablePanel></>}
          </ResizablePanelGroup>
        </div>
        {!fullscreen && <StatusBar grid={grid} snap={snap} ortho={ortho} selection={tool === "select" ? 3 : 0} onGrid={() => setGrid((value) => !value)} onSnap={() => setSnap((value) => !value)} onOrtho={() => setOrtho((value) => !value)} />}
      </main>
    </TooltipProvider>
  );
}
