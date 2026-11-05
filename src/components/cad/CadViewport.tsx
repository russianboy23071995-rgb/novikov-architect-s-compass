import { CameraAxes } from "./CameraAxes";
import { buildBuildingSolid } from "@/rendering/viewport/building-solid";
import { createProjectionFrame } from "@/geometry/projections/orthographic";
import { storeyOf } from "../../domain/storeys/access.ts";
import type { DocumentFraming } from "@/domain/views/documents";
import { capturePlanFraming } from "@/rendering/viewport/plan-camera";
import { createPortal } from "react-dom";
import { ViewScaleControl } from "./ViewScaleControl";
import { assertWorkingViewCurrent } from "@/application/views/working-context";
import { useEffect, useRef, useState } from "react";
import { fitPlanInset, zoomPlan, type ScreenInsets } from "@/rendering/viewport/plan-camera";
import type { PlanCamera } from "@/rendering/viewport/plan-camera";
import { planBounds } from "./bim-view";
import { BimSolidView } from "./BimSolidView";
import { initialCamera } from "@/lib/bim/geometry";
import { Focus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ViewMode, ViewportLayout } from "./cad-types";
import { BimPlan } from "./BimPlan";
import type { BimPlanProps } from "./BimPlan";

type CadViewportProps = BimPlanProps & {
  documentFraming?: DocumentFraming | undefined;
  onPlanCapture?: ((frame: DocumentFraming | null) => void) | undefined;
  onScale?: (denominator: number) => void;
  zoomSlot?: HTMLElement | null;
  /** Shown bottom left of the first view instead of its indicator while set. */
  startupNotice?: React.ReactNode;
  /** Stage parts covered by floating palettes (docs/GLAS_PALETTEN.md); single view only. */
  safe?: ScreenInsets | undefined;
  index: number;
  mode: ViewMode;
  grid: boolean;
  active: boolean;
  onActivate: () => void;
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

const NO_INSETS: ScreenInsets = { left: 0, top: 0, right: 0, bottom: 0 };
/** Room around a fitted plan for the view header above and scale/command bar below. */
const PLAN_MARGINS: ScreenInsets = { left: 16, top: 64, right: 16, bottom: 96 };

export function CadViewport({
  documentFraming,
  onPlanCapture,
  onScale,
  zoomSlot,
  startupNotice,
  safe,
  index,
  mode,
  grid,
  active,
  onActivate,
  ...model
}: CadViewportProps) {
  assertWorkingViewCurrent(model.viewContext, model.project);
  const scaleContext = model.viewContext.scale;
  const is3D = mode === "3D" && index === 0;
  // The 2D surface runs under the palettes; drawings are fitted into the free part, and every
  // view control sits there too (docs/GLAS_PALETTEN.md). 3D keeps its surface in the free part.
  const insets = safe ?? NO_INSETS;
  const fullBleed = !!safe && !is3D;
  const margined = {
    left: insets.left + PLAN_MARGINS.left,
    top: insets.top + PLAN_MARGINS.top,
    right: insets.right + PLAN_MARGINS.right,
    bottom: insets.bottom + PLAN_MARGINS.bottom,
  };
  const fitInsets = useRef<ScreenInsets>(NO_INSETS);
  fitInsets.current = fullBleed ? margined : NO_INSETS;
  const fitPlan = (bounds: string, view: { width: number; height: number }) =>
    fitPlanInset(bounds, view, fitInsets.current);
  const [camera, setCamera] = useState(initialCamera);
  const [solidFrame, setSolidFrame] = useState<ReturnType<typeof createProjectionFrame> | null>(
    null,
  );
  useEffect(() => {
    if (is3D && !solidFrame)
      setSolidFrame(createProjectionFrame(buildBuildingSolid(model.project)));
  }, [is3D, solidFrame, model.project]);
  const surface = useRef<HTMLDivElement>(null);
  const initialBounds = useRef(planBounds(model.project, model.viewContext.visibility));
  const savedFraming = useRef(documentFraming);
  const [size, setSize] = useState({ width: 800, height: 400 });
  const [planCamera, setPlanCamera] = useState<PlanCamera | null>(null);
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const next = {
        width: Math.max(1, bounds.width),
        height: Math.max(1, bounds.height),
      };
      setSize((previous) =>
        previous.width === next.width && previous.height === next.height ? previous : next,
      );
      setPlanCamera(
        (previous) =>
          previous ??
          (savedFraming.current
            ? {
                center: { ...savedFraming.current.center },
                pixelsPerMetre: savedFraming.current.pixelsPerMetre,
              }
            : fitPlan(initialBounds.current, next)),
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, []);
  const plan = planCamera ?? fitPlan(initialBounds.current, size);
  useEffect(() => {
    // Never publish a framing based on the temporary pre-measurement size.
    if (active && (is3D || planCamera))
      onPlanCapture?.(is3D ? null : capturePlanFraming(plan, size));
  }, [active, is3D, onPlanCapture, plan, planCamera, size]);
  const fit = () => {
    if (is3D) {
      setSolidFrame(createProjectionFrame(buildBuildingSolid(model.project)));
      setCamera((value) => ({ ...value, zoom: 1, panX: 0, panY: 0 }));
    } else
      setPlanCamera(
        savedFraming.current
          ? {
              center: { ...savedFraming.current.center },
              pixelsPerMetre: savedFraming.current.pixelsPerMetre,
            }
          : fitPlan(planBounds(model.project, model.viewContext.visibility), size),
      );
  };
  const zoom = (factor: number) =>
    is3D
      ? setCamera((value) => ({ ...value, zoom: Math.max(0.2, Math.min(5, value.zoom * factor)) }))
      : setPlanCamera(zoomPlan(plan, size, factor));
  const zoomPercent = is3D ? camera.zoom * 100 : plan.pixelsPerMetre;
  const zoomControl = (
    <select
      aria-label="Ansichtszoom"
      title={
        is3D
          ? "3D: 100 % entspricht der Standardansicht"
          : "2D: 100 % = 100 CSS-Pixel pro Meter; kein Druckmaßstab"
      }
      value={String(zoomPercent)}
      className="h-6 rounded border border-border bg-popover px-1 text-[11px] text-foreground"
      onChange={(event) => zoom(Number(event.target.value) / zoomPercent)}
    >
      <option value={String(zoomPercent)}>{Number(zoomPercent.toFixed(1))} %</option>
      {[25, 50, 75, 100, 150, 200, 400, 500]
        .filter((value) => value !== zoomPercent)
        .map((value) => (
          <option key={value} value={String(value)}>
            {value} %
          </option>
        ))}
    </select>
  );
  const binding = model.viewContext.binding;
  const label =
    binding.kind === "drawing-document"
      ? `Abbild · ${model.project.drawingDocuments?.find((d) => d.id === binding.documentId)?.name ?? ""}`
      : is3D
        ? "Gesamtgebäude · Orthographic"
        : `${storeyOf(model.project).name} · Plan`;
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
      aria-label={`${label} viewport`}
    >
      {/* No background grid behind the 3D view (user decision 01.11.2026); the plan keeps its grid. */}
      <div ref={surface} className="absolute" style={fullBleed ? { inset: 0 } : margined}>
        {is3D ? (
          <BimSolidView
            {...model}
            visibility={model.viewContext.visibility}
            interactive={active}
            selection={model.selection}
            camera={camera}
            {...(solidFrame ? { projectionFrame: solidFrame } : {})}
            onCamera={setCamera}
            snap={model.snap}
            pan={false}
            onSelect={model.onSelect}
          />
        ) : planCamera ? (
          <BimPlan
            {...model}
            referenceSelection={active ? model.referenceSelection : undefined}
            referenceScope={model.referenceSelection?.scope}
            interactive={active}
            camera={plan}
            viewSize={size}
            onCamera={setPlanCamera}
            pan={false}
            grid={grid}
          />
        ) : null}
      </div>
      <div
        className="pointer-events-none absolute [&>*:not(.pointer-events-none)]:pointer-events-auto"
        style={insets}
      >
        {is3D && <CameraAxes camera={camera} />}
        {active &&
          zoomSlot &&
          createPortal(
            <div className="flex items-center gap-2">
              {zoomControl}
              <MiniControl label="Alles anzeigen" onClick={fit}>
                <Focus size={14} />
              </MiniControl>
              {!is3D && scaleContext && onScale && (
                <ViewScaleControl
                  key={JSON.stringify(scaleContext)}
                  context={scaleContext}
                  onChange={onScale}
                />
              )}
            </div>,
            zoomSlot,
          )}
        {startupNotice && index === 0 && (
          <div className="absolute bottom-2 left-3 z-10 max-w-[calc(100%-4rem)]">
            {startupNotice}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-2 right-3 size-7 bg-popover/65 text-muted-foreground"
          aria-label="Reset view"
          onClick={() => {
            if (is3D) {
              setSolidFrame(createProjectionFrame(buildBuildingSolid(model.project)));
              setCamera(initialCamera);
            } else
              setPlanCamera(
                savedFraming.current
                  ? {
                      center: { ...savedFraming.current.center },
                      pixelsPerMetre: savedFraming.current.pixelsPerMetre,
                    }
                  : fitPlan(planBounds(model.project, model.viewContext.visibility), size),
              );
          }}
        >
          <RotateCcw />
        </Button>
      </div>
    </section>
  );
}

export function ViewportManager({
  documentFraming,
  layout,
  mode,
  grid,
  active,
  onActive,
  onScale,
  onPlanCapture,
  startupNotice,
  safe,
  ...model
}: BimPlanProps & {
  startupNotice?: React.ReactNode;
  safe?: ScreenInsets | undefined;
  documentFraming?: DocumentFraming | undefined;
  onPlanCapture?: ((frame: DocumentFraming | null) => void) | undefined;
  onScale: (denominator: number) => void;
  zoomSlot?: HTMLElement | null;
  layout: ViewportLayout;
  mode: ViewMode;
  grid: boolean;
  active: number;
  onActive: (index: number) => void;
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
          onScale={onScale}
          onPlanCapture={onPlanCapture}
          startupNotice={startupNotice}
          safe={layout === "single" ? safe : undefined}
          documentFraming={documentFraming}
          {...model}
          index={index}
          mode={mode}
          grid={grid}
          active={active === index}
          onActivate={() => onActive(index)}
        />
      ))}
    </div>
  );
}
