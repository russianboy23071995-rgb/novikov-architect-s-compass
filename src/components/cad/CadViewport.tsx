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
import { recallCamera, rememberCamera } from "./view-cameras";
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
import { captureSheet } from "@/interop/pdf/svg-capture";
import { writePdf } from "@/interop/pdf/pdf-writer";

/** A request to export the open sheet as PDF (docs/PDF_EXPORT.md, PDF1); `id` makes it new. */
export type PdfRequest = {
  id: number;
  filename: string;
  onDone: (result: { ok: boolean; message: string }) => void;
};

/** CSS pixels per metre of paper at the browser's reference 96 dpi. */
const PAPER_PIXELS_PER_METRE = 96 / 0.0254;

type CadViewportProps = BimPlanProps & {
  documentFraming?: DocumentFraming | undefined;
  onPlanCapture?: ((frame: DocumentFraming | null) => void) | undefined;
  onScale?: (denominator: number) => void;
  zoomSlot?: HTMLElement | null;
  /** Shown bottom left of the first view instead of its indicator while set. */
  startupNotice?: React.ReactNode;
  /** Stage parts covered by floating palettes (docs/GLAS_PALETTEN.md); single view only. */
  safe?: ScreenInsets | undefined;
  /** The view's own camera for this session (KA1); without a key every opening fits anew. */
  cameraKey?: string | undefined;
  /** Export of the sheet as PDF; only the active view of a paper sheet takes it. */
  pdfRequest?: PdfRequest | null | undefined;
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
  cameraKey,
  pdfRequest,
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
  // The Plankopfplaner fits its paper underlay (docs/PLANKOPF.md, PK3).
  const underlayBounds = (u: NonNullable<BimPlanProps["underlay"]>) => {
    const pad = 0.04 * Math.max(u.paper.x1 - u.paper.x0, u.paper.y1 - u.paper.y0);
    return `${u.paper.x0 - pad} ${-u.paper.y1 - pad} ${u.paper.x1 - u.paper.x0 + 2 * pad} ${u.paper.y1 - u.paper.y0 + 2 * pad}`;
  };
  const initialBounds = useRef(
    model.underlay
      ? underlayBounds(model.underlay)
      : planBounds(model.project, model.viewContext.visibility),
  );
  const savedFraming = useRef(documentFraming);
  const [size, setSize] = useState({ width: 800, height: 400 });
  // A view that was open before comes back as it was left (KA1).
  const [planCamera, setPlanCamera] = useState<PlanCamera | null>(() => recallCamera(cameraKey));
  useEffect(() => {
    if (cameraKey && planCamera) rememberCamera(cameraKey, planCamera);
  }, [cameraKey, planCamera]);
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
  // PDF export (PDF1): the sheet is drawn once more, unseen, at 100 % and without aids, so every
  // width the plan draws in screen pixels comes out as at 100 % zoom.
  const [pdfJob, setPdfJob] = useState<PdfRequest | null>(null);
  const exportBox = useRef<HTMLDivElement>(null);
  const takenPdf = useRef<number | null>(null);
  useEffect(() => {
    if (!pdfRequest || takenPdf.current === pdfRequest.id || !active || is3D) return;
    takenPdf.current = pdfRequest.id;
    if (!model.underlay)
      return pdfRequest.onDone({ ok: false, message: "PDF gibt es für Layouts und Planköpfe." });
    setPdfJob(pdfRequest);
  }, [pdfRequest, active, is3D, model.underlay]);
  useEffect(() => {
    if (!pdfJob || !model.underlay) return;
    const paper = model.underlay.paper;
    // The sheet is in the DOM once React committed it; a timer (not an animation frame) also
    // runs in a background tab.
    const timer = window.setTimeout(() => {
      {
        const svg = exportBox.current?.querySelector("svg");
        try {
          if (!svg) throw new Error("Das Blatt ließ sich nicht zeichnen.");
          const { page, skippedImages } = captureSheet(svg, paper);
          const bytes = writePdf(page);
          const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = pdfJob.filename;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
          pdfJob.onDone({
            ok: true,
            message:
              `PDF „${pdfJob.filename}“ angefordert · ${Math.round((paper.x1 - paper.x0) * 1000)} × ${Math.round((paper.y1 - paper.y0) * 1000)} mm` +
              (skippedImages ? ` · ${skippedImages} Bildreferenz(en) noch nicht im PDF` : ""),
          });
        } catch (error) {
          pdfJob.onDone({
            ok: false,
            message: error instanceof Error ? error.message : "PDF nicht möglich.",
          });
        } finally {
          setPdfJob(null);
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pdfJob, model.underlay]);
  const pdfSheet =
    pdfJob && model.underlay
      ? (() => {
          const p = model.underlay.paper;
          // Drafts, previews and selection are on-screen aids: the sheet is drawn without them.
          const {
            cornerPreview: _corner,
            drawingPreview: _preview,
            textPreview: _text,
            stairDraft: _stair,
            sectionDraft: _section,
            dimensionDraft: _dimension,
            editSession: _edit,
            tracing: _tracing,
            selectionAnchor: _anchor,
            referenceSelection: _references,
            referenceScope: _scope,
            draftContour: _contour,
            draftFill: _fill,
            draftShape: _shape,
            draftCircle: _circle,
            ...sheet
          } = model;
          const width = (p.x1 - p.x0) * PAPER_PIXELS_PER_METRE,
            height = (p.y1 - p.y0) * PAPER_PIXELS_PER_METRE;
          return (
            <div
              ref={exportBox}
              aria-hidden
              className="pointer-events-none fixed"
              style={{ left: -100000, top: 0, width, height }}
            >
              <BimPlan
                {...sheet}
                selection={null}
                selections={[]}
                selectedSectionId={null}
                drawing={false}
                start={null}
                draftPoints={[]}
                interactive={false}
                camera={{
                  center: { x: (p.x0 + p.x1) / 2, y: (p.y0 + p.y1) / 2 },
                  pixelsPerMetre: PAPER_PIXELS_PER_METRE,
                }}
                viewSize={{ width, height }}
                onCamera={() => {}}
                pan={false}
                grid={false}
              />
            </div>
          );
        })()
      : null;
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
          : fitPlan(
              model.underlay
                ? underlayBounds(model.underlay)
                : planBounds(model.project, model.viewContext.visibility),
              size,
            ),
      );
  };
  const zoom = (factor: number) =>
    is3D
      ? setCamera((value) => ({ ...value, zoom: Math.max(0.2, Math.min(5, value.zoom * factor)) }))
      : setPlanCamera(zoomPlan(plan, size, factor));
  // On paper (layout, Plankopf at 1:1) 100 % is the original size (docs/LAYOUTS.md).
  const paper = !is3D && !!model.underlay;
  const zoomPercent = is3D
    ? camera.zoom * 100
    : paper
      ? (plan.pixelsPerMetre / PAPER_PIXELS_PER_METRE) * 100
      : plan.pixelsPerMetre;
  const zoomControl = (
    <select
      aria-label="Ansichtszoom"
      title={
        is3D
          ? "3D: 100 % entspricht der Standardansicht"
          : paper
            ? "Papier: 100 % = Originalgröße, 1 mm Papier = 1 mm am Bildschirm (96 dpi)"
            : "2D: 100 % = 100 CSS-Pixel pro Meter; kein Druckmaßstab"
      }
      value={String(zoomPercent)}
      className="h-6 rounded border border-border bg-popover px-1 text-[11px] text-foreground"
      onChange={(event) => zoom(Number(event.target.value) / zoomPercent)}
    >
      <option value={String(zoomPercent)}>{Number(zoomPercent.toFixed(1))} %</option>
      {[25, 50, 75, 100, 150, 200, 400, 500, 800, 1000, 2000]
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
      {pdfSheet}
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
              {paper && (
                <span
                  className="text-[11px] text-muted-foreground"
                  title="Layouts und Planköpfe werden in echter Papiergröße gezeichnet und ausgegeben."
                >
                  Papier 1:1
                </span>
              )}
              {!is3D && !paper && scaleContext && onScale && (
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
                  : fitPlan(
                      model.underlay
                        ? underlayBounds(model.underlay)
                        : planBounds(model.project, model.viewContext.visibility),
                      size,
                    ),
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
  cameraKey,
  pdfRequest,
  ...model
}: BimPlanProps & {
  pdfRequest?: PdfRequest | null | undefined;
  /** Names the view whose cameras are kept (KA1); one per split pane. */
  cameraKey?: string | undefined;
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
          cameraKey={cameraKey && `${cameraKey}#${index}`}
          pdfRequest={pdfRequest}
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
