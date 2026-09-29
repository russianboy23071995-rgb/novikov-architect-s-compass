import { Box, Crosshair, Expand, Focus, Hand, Minus, Orbit, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ViewMode, ViewportLayout } from "./cad-types";

const viewNames = ["Perspective", "Level 01", "North Elevation", "Section A-A"];

type CadViewportProps = {
  index: number;
  mode: ViewMode;
  grid: boolean;
  active: boolean;
  onActivate: () => void;
  onFullscreen: () => void;
};

function MiniControl({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <Tooltip delayDuration={300}><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={onClick} className="size-7 rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={label}>{children}</Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
}

function FloorPlan({ mode }: { mode: ViewMode }) {
  return (
    <div className={cn("floor-plan absolute left-1/2 top-1/2 h-[48%] w-[56%] -translate-x-1/2 -translate-y-1/2 opacity-85 transition-transform duration-500", mode === "3D" && "floor-plan-3d")} aria-hidden="true">
      <div className="wall wall-top" /><div className="wall wall-right" /><div className="wall wall-bottom" /><div className="wall wall-left" />
      <div className="wall inner-v-one" /><div className="wall inner-v-two" /><div className="wall inner-h-one" /><div className="wall inner-h-two" />
      <div className="door door-one" /><div className="door door-two" />
      <div className="window window-one" /><div className="window window-two" /><div className="window window-three" />
      <div className="furniture table"><i /><i /><i /><i /></div>
      <div className="furniture sofa" />
      <span className="room room-living">LIVING / DINING<br /><b>42.6 m²</b></span>
      <span className="room room-kitchen">KITCHEN<br /><b>16.4 m²</b></span>
      <span className="room room-office">OFFICE<br /><b>13.8 m²</b></span>
      <span className="dimension dimension-x">8 640</span>
      <span className="dimension dimension-y">6 200</span>
    </div>
  );
}

export function CadViewport({ index, mode, grid, active, onActivate, onFullscreen }: CadViewportProps) {
  const label = mode === "3D" && index === 0 ? "Perspective" : viewNames[index % viewNames.length];
  return (
    <section className={cn("cad-viewport group relative min-h-0 overflow-hidden border border-transparent", active && "border-primary/45")} onClick={onActivate} aria-label={`${label} viewport`}>
      <div className={cn("absolute inset-0", grid && "cad-grid")} />
      <FloorPlan mode={mode === "3D" && index === 0 ? "3D" : "2D"} />
      <div className="absolute left-3 top-3 flex items-center gap-1 rounded border border-border bg-popover/70 px-2 py-1 text-[9px] text-muted-foreground backdrop-blur-md"><span className={cn("size-1.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground")} />{mode === "3D" && index === 0 ? "3D" : "2D"} · {label}</div>
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded border border-border bg-popover/70 p-0.5 backdrop-blur-md">
        <MiniControl label="Pan"><Hand /></MiniControl><MiniControl label="Orbit"><Orbit /></MiniControl><MiniControl label="Zoom in"><Plus /></MiniControl><MiniControl label="Zoom out"><Minus /></MiniControl><MiniControl label="Fit view"><Focus /></MiniControl><MiniControl label="Fullscreen" onClick={onFullscreen}><Expand /></MiniControl>
      </div>
      <div className={cn("view-cube absolute bottom-[74px] right-5 hidden size-14 items-center justify-center text-[8px] font-semibold text-foreground sm:flex", mode === "3D" && index === 0 && "is-3d")}><span>TOP</span><i>FRONT</i><b>RIGHT</b></div>
      <div className="absolute bottom-[75px] left-4 flex items-end gap-0.5 font-mono text-[8px]"><span className="block h-7 w-px bg-axis-z" /><span className="block h-px w-7 bg-axis-x" /><span className="text-axis-x">X</span><span className="-ml-10 -translate-y-5 text-axis-z">Z</span></div>
      <div className="absolute bottom-2 left-3 flex items-center gap-2 rounded border border-border bg-popover/65 px-2 py-1 text-[9px] text-muted-foreground backdrop-blur-md"><Crosshair className="size-3 text-primary" /><span>{mode === "3D" && index === 0 ? "3D Perspective" : label}</span><span>·</span><span>Level 01</span><span>·</span><span className="font-mono">1:100</span></div>
      <Button variant="ghost" size="icon" className="absolute bottom-2 right-3 size-7 bg-popover/65 text-muted-foreground" aria-label="Reset view"><RotateCcw /></Button>
    </section>
  );
}

export function ViewportManager({ layout, mode, grid, active, onActive, onFullscreen }: { layout: ViewportLayout; mode: ViewMode; grid: boolean; active: number; onActive: (index: number) => void; onFullscreen: () => void }) {
  const count = layout === "single" ? 1 : layout === "horizontal" || layout === "vertical" ? 2 : layout === "three" ? 3 : 4;
  return <div className={cn("viewport-grid h-full min-h-0 gap-px bg-border", `layout-${layout}`)}>{Array.from({ length: count }, (_, index) => <CadViewport key={`${layout}-${index}`} index={index} mode={mode} grid={grid} active={active === index} onActivate={() => onActive(index)} onFullscreen={onFullscreen} />)}</div>;
}
