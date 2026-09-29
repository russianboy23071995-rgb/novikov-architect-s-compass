import { useState } from "react";
import { BimSolidView } from "./BimSolidView";
import { initialCamera } from "@/lib/bim/geometry";
import { Box, Crosshair, Expand, Focus, Hand, Minus, Orbit, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ViewMode, ViewportLayout } from "./cad-types";
import { BimPlan } from "./BimPlan";
import type { BimPlanProps } from "./BimPlan";

type CadViewportProps = BimPlanProps & {
  index: number;
  mode: ViewMode;
  grid: boolean;
  active: boolean;
  onActivate: () => void;
  onFullscreen: () => void;
};

function MiniControl({
  label,
  children,
  onClick,
  disabled = false,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          className="size-7 rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function CadViewport({
  index,
  mode,
  grid,
  active,
  onActivate,
  onFullscreen,
  ...model
}: CadViewportProps) {
  const is3D = mode === "3D" && index === 0;
  const [camera, setCamera] = useState(initialCamera);
  const [pan, setPan] = useState(false);
  const zoom = (factor: number) =>
    setCamera((value) => ({ ...value, zoom: Math.max(0.2, Math.min(5, value.zoom * factor)) }));
  const label = is3D ? "3D model · Orthographic" : "Level 01 · Plan";
  return (
    <section
      className={cn(
        "cad-viewport group relative min-h-0 overflow-hidden border border-transparent transition-[border-color,box-shadow] duration-200",
        active &&
          "border-primary/40 shadow-[inset_0_0_36px_color-mix(in_oklab,var(--primary)_5%,transparent)]",
      )}
      onClick={onActivate}
      aria-label={`${label} viewport`}
    >
      <div className={cn("absolute inset-0", grid && "cad-grid")} />
      <div className="absolute inset-x-4 bottom-24 top-16">
        {is3D ? (
          <BimSolidView
            project={model.project}
            selection={model.selection}
            camera={camera}
            onCamera={setCamera}
            pan={pan}
          />
        ) : (
          <BimPlan {...model} />
        )}
      </div>
      <p className="pointer-events-none absolute left-3 top-12 text-[11px] text-muted-foreground">
        {model.drawing
          ? model.start
            ? "Click end point · Esc cancels"
            : model.snap
              ? "Click start point · Snap 0.10 m"
              : "Click start point · Snap off"
          : mode === "3D" && index === 0
            ? pan
              ? "Drag to pan · Wheel to zoom · Select elements in Navigator"
              : "Drag to orbit · Wheel to zoom · Select elements in Navigator"
            : "Select a wall or window · Dimensions in metres"}
      </p>
      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md border border-border bg-popover/60 px-2 py-1 text-[9px] text-muted-foreground shadow-[inset_0_1px_0_var(--glass-highlight)] backdrop-blur-2xl">
        <span
          className={cn("size-1.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground")}
        />
        {mode === "3D" && index === 0 ? "3D" : "2D"} · {label}
      </div>
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-border bg-popover/60 p-0.5 shadow-[inset_0_1px_0_var(--glass-highlight)] backdrop-blur-2xl">
        <MiniControl label="Pan" disabled={!is3D} onClick={() => setPan(true)}>
          <Hand />
        </MiniControl>
        <MiniControl label="Orbit" disabled={!is3D} onClick={() => setPan(false)}>
          <Orbit />
        </MiniControl>
        <MiniControl label="Zoom in" disabled={!is3D} onClick={() => zoom(1.2)}>
          <Plus />
        </MiniControl>
        <MiniControl label="Zoom out" disabled={!is3D} onClick={() => zoom(1 / 1.2)}>
          <Minus />
        </MiniControl>
        <MiniControl
          label="Fit view"
          disabled={!is3D}
          onClick={() => setCamera((value) => ({ ...value, zoom: 1, panX: 0, panY: 0 }))}
        >
          <Focus />
        </MiniControl>
        <MiniControl label="Fullscreen" onClick={onFullscreen}>
          <Expand />
        </MiniControl>
      </div>
      <div
        className={cn(
          "view-cube absolute bottom-[74px] right-5 hidden size-14 items-center justify-center text-[8px] font-semibold text-foreground sm:flex",
          mode === "3D" && index === 0 && "is-3d",
        )}
      >
        <span>TOP</span>
        <i>FRONT</i>
        <b>RIGHT</b>
      </div>
      <div className="absolute bottom-[75px] left-4 flex items-end gap-0.5 font-mono text-[8px]">
        <span className="block h-7 w-px bg-axis-z" />
        <span className="block h-px w-7 bg-axis-x" />
        <span className="text-axis-x">X</span>
        <span className="-ml-10 -translate-y-5 text-axis-z">Z</span>
      </div>
      <div className="absolute bottom-2 left-3 flex items-center gap-2 rounded border border-border bg-popover/65 px-2 py-1 text-[9px] text-muted-foreground backdrop-blur-md">
        <Crosshair className="size-3 text-primary" />
        <span>{mode === "3D" && index === 0 ? "3D Orthographic" : label}</span>
        <span>·</span>
        <span>Level 01</span>
        <span>·</span>
        <span className="font-mono">Fit · m</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-2 right-3 size-7 bg-popover/65 text-muted-foreground"
        aria-label="Reset view"
        disabled={!is3D}
        onClick={() => {
          setCamera(initialCamera);
          setPan(false);
        }}
      >
        <RotateCcw />
      </Button>
    </section>
  );
}

export function ViewportManager({
  layout,
  mode,
  grid,
  active,
  onActive,
  onFullscreen,
  ...model
}: BimPlanProps & {
  layout: ViewportLayout;
  mode: ViewMode;
  grid: boolean;
  active: number;
  onActive: (index: number) => void;
  onFullscreen: () => void;
}) {
  const count =
    layout === "single"
      ? 1
      : layout === "horizontal" || layout === "vertical"
        ? 2
        : layout === "three"
          ? 3
          : 4;
  return (
    <div className={cn("viewport-grid h-full min-h-0 gap-px bg-border", `layout-${layout}`)}>
      {Array.from({ length: count }, (_, index) => (
        <CadViewport
          key={`${layout}-${index}`}
          {...model}
          index={index}
          mode={mode}
          grid={grid}
          active={active === index}
          onActivate={() => onActive(index)}
          onFullscreen={onFullscreen}
        />
      ))}
    </div>
  );
}
