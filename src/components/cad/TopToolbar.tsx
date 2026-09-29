import { Bot, Box, Check, ChevronDown, Grid3X3, LayoutGrid, Menu, Mic, PanelRightOpen, PanelTop, Redo2, Rotate3D, Save, Settings, Undo2 } from "lucide-react";
import novikovLogo from "@/assets/novikov-logo.png";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ToolId, ViewMode, ViewportLayout } from "./cad-types";

const layouts: { id: ViewportLayout; label: string; cells: string }[] = [
  { id: "single", label: "Single View", cells: "▣" },
  { id: "horizontal", label: "2 Views Horizontal", cells: "⬒" },
  { id: "vertical", label: "2 Views Vertical", cells: "◫" },
  { id: "three", label: "3 Views", cells: "▦" },
  { id: "four", label: "4 Views", cells: "田" },
];

const toolOptions: Record<ToolId, { title: string; options: string[] }> = {
  select: { title: "Select", options: ["Window selection", "Filter"] },
  wall: { title: "Wall", options: ["Thickness 240 mm", "Height 2.80 m", "Concrete", "Centerline"] },
  slab: { title: "Slab", options: ["Thickness 220 mm", "Level 01", "Concrete"] },
  line: { title: "Line", options: ["Layer A-WALL", "Continuous", "0.25 mm"] },
};

type TopToolbarProps = {
  tool: ToolId;
  mode: ViewMode;
  layout: ViewportLayout;
  grid: boolean;
  snap: boolean;
  navigatorOpen: boolean;
  demandOpen: boolean;
  onMode: (mode: ViewMode) => void;
  onLayout: (layout: ViewportLayout) => void;
  onGrid: () => void;
  onSnap: () => void;
  onNavigator: () => void;
  onDemand: () => void;
  onAction: (text: string) => void;
};

function IconControl({ label, children, onClick, active }: { label: string; children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return <Tooltip delayDuration={300}><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={label} aria-pressed={active} onClick={onClick} className={cn("size-8 rounded text-muted-foreground hover:bg-accent hover:text-foreground", active && "bg-primary/15 text-primary")}>{children}</Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
}

export function TopToolbar(props: TopToolbarProps) {
  const current = toolOptions[props.tool];
  return (
    <header className="glass-panel-strong z-40 shrink-0 overflow-hidden rounded-lg">
      <div className="flex h-11 min-w-0 items-center gap-2 px-2.5">
        <div className="flex min-w-[190px] items-center gap-2 border-r border-border pr-3">
          <img src={novikovLogo} alt="NOVIKOV Logo" width={1024} height={1024} className="size-7 shrink-0 rounded-md object-contain" />
          <div className="min-w-0"><div className="font-display text-[13px] font-semibold text-foreground">NOVIKOV <span className="font-normal text-primary">CAD</span></div><div className="truncate text-[11px] text-muted-foreground">Haus am See · 01</div></div>
        </div>
        <nav className="hidden items-center gap-0.5 border-r border-border pr-2 xl:flex" aria-label="Application menu">
          {["File", "Edit", "View", "Insert", "Modify", "Tools"].map((item) => <Button key={item} variant="ghost" size="sm" className="h-7 px-2 text-[12px] font-normal text-muted-foreground" onClick={() => props.onAction(`${item} menu`)}>{item}</Button>)}
        </nav>
        <div className="flex items-center gap-0.5 border-r border-border pr-2">
          <IconControl label="Undo" onClick={() => props.onAction("Undo")}><Undo2 /></IconControl>
          <IconControl label="Redo" onClick={() => props.onAction("Redo")}><Redo2 /></IconControl>
          <IconControl label="Save project" onClick={() => props.onAction("Project saved")}><Save /></IconControl>
        </div>
        <div className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
          <span className="shrink-0 px-2 text-[12px] font-semibold text-foreground">{current.title}</span>
          {current.options.map((option) => <Button key={option} variant="outline" size="sm" className="h-6 max-w-36 rounded px-2 text-[11px] font-normal text-muted-foreground" onClick={() => props.onAction(option)}>{option}<ChevronDown className="size-2.5" /></Button>)}
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <div className="flex h-8 items-center rounded-md border border-border bg-background/30 p-0.5 shadow-[inset_0_1px_0_var(--glass-highlight)] backdrop-blur-xl">
            {(["2D", "3D"] as ViewMode[]).map((mode) => <Button key={mode} variant="ghost" size="sm" onClick={() => props.onMode(mode)} className={cn("h-6 rounded-sm px-2 text-[11px]", props.mode === mode && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}>{mode === "2D" ? <Grid3X3 /> : <Box />}{mode}</Button>)}
          </div>
          <DropdownMenu>
            <Tooltip delayDuration={300}><TooltipTrigger asChild><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Viewport layout"><LayoutGrid /></Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent>Viewport layout</TooltipContent></Tooltip>
            <DropdownMenuContent align="end" className="w-48"><DropdownMenuLabel className="text-xs">Viewport layout</DropdownMenuLabel><DropdownMenuSeparator />{layouts.map((layout) => <DropdownMenuItem key={layout.id} onClick={() => props.onLayout(layout.id)} className="text-xs"><span className="w-5 font-mono text-primary">{layout.cells}</span>{layout.label}{props.layout === layout.id && <Check className="ml-auto" />}</DropdownMenuItem>)}</DropdownMenuContent>
          </DropdownMenu>
          <IconControl label="Orbit view" onClick={() => props.onAction("Orbit mode")}><Rotate3D /></IconControl>
          <IconControl label="Grid" active={props.grid} onClick={props.onGrid}><Grid3X3 /></IconControl>
          <Button variant="ghost" size="sm" className={cn("h-8 px-2 text-[11px] text-muted-foreground", props.snap && "bg-primary/15 text-primary")} onClick={props.onSnap}>SNAP</Button>
          <div className="mx-1 h-5 w-px bg-border" />
          <IconControl label="NOVIKOV AI" onClick={() => props.onAction("AI ready")}><Bot /></IconControl>
          <IconControl label="Voice command" onClick={() => props.onAction("Use the microphone in the command bar")}><Mic /></IconControl>
          <IconControl label="Project navigator" active={props.navigatorOpen} onClick={props.onNavigator}><PanelRightOpen /></IconControl>
          <IconControl label="Demand menu" active={props.demandOpen} onClick={props.onDemand}><PanelTop /></IconControl>
          <IconControl label="Settings" onClick={() => props.onAction("Settings")}><Settings /></IconControl>
          <Button variant="ghost" size="icon" className="size-8" aria-label="User profile"><span className="flex size-6 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[11px] font-semibold text-primary">CN</span></Button>
          <Button variant="ghost" size="icon" className="size-8 xl:hidden" aria-label="Menu"><Menu /></Button>
        </div>
      </div>
    </header>
  );
}
