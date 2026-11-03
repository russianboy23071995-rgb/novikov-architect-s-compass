import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SectionDrawing } from "@/rendering/viewport/section-drawing";
import { CAD_TURQUOISE } from "@/rendering/viewport/highlight";
import { cutPaint, type CutFill } from "./cut-fill";
import {
  drawSectionCanvas,
  imagePlacement,
  type CanvasBox,
  type SectionCanvasStyle,
} from "./section-canvas";

/** Pause after the last zoom or pan step before the image is drawn sharp again. */
const SHARP_AFTER_MS = 120;

/**
 * The section drawing of the section tab as a canvas (docs/performance/SECTION_CANVAS.md). A
 * changed drawing, fill, scale, selection, size or theme draws it at once; zooming and panning
 * move and scale the last sharp image and draw it sharp after a short pause. `data-sharp` tells
 * whether the shown image is sharp (for measurements).
 */
export function SectionCanvas({
  drawing,
  view,
  cutFill,
  hatch,
  extent,
  selectedIds,
}: {
  drawing: SectionDrawing;
  view: CanvasBox;
  cutFill: CutFill;
  /** Hatch spacing of cut layers in metres. */
  hatch: number;
  extent: { minY: number; maxY: number };
  selectedIds?: ReadonlySet<string> | undefined;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0, ratio: 1 });
  const [theme, setTheme] = useState(0);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const measure = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = Math.round(element.clientWidth * ratio),
        height = Math.round(element.clientHeight * ratio);
      setSize((s) =>
        s.width === width && s.height === height && s.ratio === ratio
          ? s
          : { width, height, ratio },
      );
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    // Light and dark change the CSS variables the drawing is painted with.
    const themes = new MutationObserver(() => setTheme((t) => t + 1));
    themes.observe(document.documentElement, { attributeFilter: ["class", "style", "data-theme"] });
    return () => {
      resize.disconnect();
      themes.disconnect();
    };
  }, []);

  const snapshot = useRef<{ image: HTMLCanvasElement; view: CanvasBox; key: unknown[] } | null>(
    null,
  );
  const timer = useRef(0);
  const viewRef = useRef(view);
  viewRef.current = view;
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const key = [drawing, cutFill, hatch, extent.minY, extent.maxY, selectedIds, size, theme];

  useLayoutEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext("2d");
    if (!element || !ctx || !size.width || !size.height) return;
    if (element.width !== size.width) element.width = size.width;
    if (element.height !== size.height) element.height = size.height;
    const sharp = (shown: CanvasBox) => {
      const style = canvasStyle(element, cutFill, hatch, extent);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, size.width, size.height);
      drawSectionCanvas(ctx, drawing, shown, size, style, selectedIds);
      let image = snapshot.current?.image;
      if (!image) image = document.createElement("canvas");
      image.width = size.width;
      image.height = size.height;
      image.getContext("2d")?.drawImage(element, 0, 0);
      snapshot.current = { image, view: shown, key };
      element.dataset["sharp"] = "1";
    };
    window.clearTimeout(timer.current);
    const last = snapshot.current;
    if (!last || last.key.some((value, i) => !Object.is(value, key[i]))) return sharp(view);
    if (same(last.view, view)) return;
    // Zoom or pan: the last sharp image, moved and scaled, until the pause.
    const at = imagePlacement(last.view, view, size.width, size.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.drawImage(last.image, at.x, at.y, at.w, at.h);
    element.dataset["sharp"] = "0";
    timer.current = window.setTimeout(() => sharp(viewRef.current), SHARP_AFTER_MS);
    // key lists every input of the drawing; view alone only moves the image.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, ...key]);

  return (
    <canvas
      ref={canvas}
      data-section-canvas=""
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

const same = (a: CanvasBox, b: CanvasBox) =>
  a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

/** The colours of the SVG drawing, resolved from the CSS variables at the canvas. */
function canvasStyle(
  element: HTMLElement,
  cutFill: CutFill,
  hatch: number,
  extent: { minY: number; maxY: number },
): SectionCanvasStyle {
  const resolve = (value: string) => {
    if (!value.startsWith("var(")) return value;
    element.style.color = value;
    const color = getComputedStyle(element).color;
    element.style.color = "";
    return color;
  };
  const paint = cutPaint(cutFill);
  return {
    colors: {
      background: resolve("var(--background)"),
      foreground: resolve("var(--foreground)"),
      muted: resolve("var(--muted-foreground)"),
    },
    cut: { fill: resolve(paint.fill), fillOpacity: paint.fillOpacity },
    selection: CAD_TURQUOISE,
    hatch,
    extent,
  };
}
