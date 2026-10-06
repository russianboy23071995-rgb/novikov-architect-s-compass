import { useEffect, useRef, useState } from "react";
import { fitPlan, planScaleBar, zoomPlan } from "@/rendering/viewport/plan-camera";
import type { PlanCamera } from "@/rendering/viewport/plan-camera";
import { planBounds } from "./bim-view";
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
  pressed,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
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
          aria-pressed={pressed}
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
  const surface = useRef<HTMLDivElement>(null);
  const initialBounds = useRef(planBounds(model.project));
  const [size, setSize] = useState({ width: 800, height: 400 });
  const [planCamera, setPlanCamera] = useState<PlanCamera | null>(null);
  const [planPan, setPlanPan] = useState(false);
  const placing = Boolean(model.placement);
  useEffect(() => {
    setPlanPan(false);
    setPan(false);
  }, [model.drawing, model.editSession, placing]);
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const next = {
        width: Math.max(1, bounds.width),
        height: Math.max(1, bounds.height),
      };
      setSize(next);
      setPlanCamera((previous) => previous ?? fitPlan(initialBounds.current, next));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, []);
  const plan = planCamera ?? fitPlan(initialBounds.current, size);
  const bar = planScaleBar(plan.pixelsPerMetre);
  const fit = () => {
    if (is3D) setCamera((value) => ({ ...value, zoom: 1, panX: 0, panY: 0 }));
    else setPlanCamera(fitPlan(planBounds(model.project), size));
  };
  const zoom = (factor: number) =>
    is3D
      ? setCamera((value) => ({ ...value, zoom: Math.max(0.2, Math.min(5, value.zoom * factor)) }))
      : setPlanCamera(zoomPlan(plan, size, factor));
  const label = is3D ? "3D model · Orthographic" : "Level 01 · Plan";
  return (
    <section
      className={cn(
        "cad-viewport group relative min-h-0 overflow-hidden border border-transparent transition-[border-color,box-shadow] duration-200",
        active &&
          "border-primary/40 shadow-[inset_0_0_36px_color-mix(in_oklab,var(--primary)_5%,transparent)]",
      )}
      onClickCapture={(event) => {
        if (!active) {
          onActivate();
          event.stopPropagation();
        }
      }}
      onKeyDownCapture={(event) => {
        if (event.key === "Escape") setPlanPan(false);
      }}
      aria-label={`${label} viewport`}
    >
      <div className={cn("absolute inset-0", grid && is3D && "cad-grid")} />
      <div ref={surface} className="absolute inset-x-4 bottom-24 top-16">
        {is3D ? (
          <BimSolidView
            {...model}
            interactive={active}
            selection={model.selection}
            camera={camera}
            onCamera={setCamera}
            snap={model.snap}
            pan={pan}
            onSelect={model.onSelect}
          />
        ) : (
          <BimPlan
            {...model}
            referenceSelection={active ? model.referenceSelection : undefined}
            referenceScope={model.referenceSelection?.scope}
            interactive={active}
            camera={plan}
            viewSize={size}
            onCamera={setPlanCamera}
            pan={planPan}
            grid={grid}
          />
        )}
      </div>
      <p className="pointer-events-none absolute left-3 top-12 text-[11px] text-muted-foreground">
        {model.drawing
          ? model.start
            ? "Click end point · Esc cancels"
            : model.snap
              ? "Click start point · SNAP an"
              : "Click start point · Snap off"
          : mode === "3D" && index === 0
            ? model.editSession
              ? pan
                ? "Navigation: Ziehen verschiebt die Ansicht · Pan erneut: Bearbeitung"
                : model.editSession.action === "point"
                  ? "Wandecke auf z=0 bewegen · Klick übernimmt Ziel · Tab: Maße · Esc: Abbruch"
                  : model.editSession.action === "move"
                    ? "Wand auf z=0 bewegen · Klick fixiert Richtung · Tab: Maße · Esc: Abbruch"
                    : "Feste Achse auf z=0 · Klick übernimmt Ziel · Tab: Strecke · Esc: Abbruch"
              : pan
                ? "Klick: Wand/Fenster wählen · Strg/Cmd-Klick: Mehrfachauswahl · Ziehen: Pan"
                : "Klick: Wand/Fenster wählen · Strg/Cmd-Klick: Mehrfachauswahl · Ziehen: Orbit"
            : planPan
              ? "Ziehen verschiebt die Ansicht · Mausrad zoomt · Esc beendet Pan"
              : "Mausrad: Zoom · Mittlere Maustaste: Ansicht verschieben · Maße in Metern"}
      </p>
      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md border border-border bg-popover/60 px-2 py-1 text-[9px] text-muted-foreground shadow-[inset_0_1px_0_var(--glass-highlight)] backdrop-blur-2xl">
        <span
          className={cn("size-1.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground")}
        />
        {mode === "3D" && index === 0 ? "3D" : "2D"} · {label}
      </div>
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-border bg-popover/60 p-0.5 shadow-[inset_0_1px_0_var(--glass-highlight)] backdrop-blur-2xl">
        <MiniControl
          label="Pan"
          pressed={is3D ? pan : planPan}
          onClick={() => (is3D ? setPan((value) => !value) : setPlanPan((value) => !value))}
        >
          <Hand />
        </MiniControl>
        <MiniControl
          label="Orbit"
          disabled={!is3D || !!model.editSession}
          onClick={() => setPan(false)}
        >
          <Orbit />
        </MiniControl>
        <MiniControl label="Zoom in" onClick={() => zoom(1.2)}>
          <Plus />
        </MiniControl>
        <MiniControl label="Zoom out" onClick={() => zoom(1 / 1.2)}>
          <Minus />
        </MiniControl>
        <MiniControl label="Fit view" onClick={fit}>
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
        <span className="-ml-10 -translate-y-5 text-axis-z">{is3D ? "Z" : "Y"}</span>
      </div>
      <div
        className={cn(
          "absolute bottom-2 left-3 flex gap-2 rounded border border-border bg-popover/65 px-2 py-1 text-[9px] text-muted-foreground backdrop-blur-md",
          is3D ? "items-center" : "flex-col items-start",
        )}
      >
        {is3D && (
          <>
            <Crosshair className="size-3 text-primary" />
            <span>3D Orthographic · Level 01 ·</span>
          </>
        )}
        {is3D ? (
          <span className="font-mono">Fit · m</span>
        ) : (
          <>
            <label className="flex items-center gap-1">
              Ansicht
              <select
                aria-label="2D Ansichtsmaßstab"
                value={String(plan.pixelsPerMetre)}
                className="rounded border bg-popover px-1"
                onChange={(event) =>
                  setPlanCamera({ ...plan, pixelsPerMetre: Number(event.target.value) })
                }
              >
                <option value={String(plan.pixelsPerMetre)}>
                  {plan.pixelsPerMetre.toFixed(1)} px/m
                </option>
                {[25, 50, 100, 200, 500]
                  .filter((value) => value !== plan.pixelsPerMetre)
                  .map((value) => (
                    <option key={value} value={String(value)}>
                      {value} px/m
                    </option>
                  ))}
              </select>
            </label>
            <span
              aria-label="Grafischer Maßstab"
              className="inline-flex flex-col items-center font-mono"
              title="Bildschirmmaßstab in CSS-Pixeln; kein Druckmaßstab"
            >
              {Number(bar.metres.toPrecision(6))} m
              <span
                style={{ width: bar.pixels }}
                className="h-1 border-x border-b border-current"
              />
            </span>
          </>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-2 right-3 size-7 bg-popover/65 text-muted-foreground"
        aria-label="Reset view"
        onClick={() => {
          if (is3D) setCamera(initialCamera);
          else setPlanCamera(fitPlan(planBounds(model.project), size));
          setPan(false);
          setPlanPan(false);
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
