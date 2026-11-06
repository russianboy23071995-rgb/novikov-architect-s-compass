import {
  PT_PER_M,
  type PdfColor,
  type PdfCommand,
  type PdfFill,
  type PdfMatrix,
  type PdfPage,
  type PdfPattern,
  type PdfStroke,
  type PdfSubpath,
} from "./pdf-writer.ts";
import { apply, multiply, parsePath, parsePoints, polySubpath, scaleOf } from "./svg-path.ts";
import { penFactor } from "./pens.ts";

/** What the paper shows, in plan metres (y up), and what the capture had to leave out. */
export type SheetCapture = { page: PdfPage; skippedImages: number };

const SKIPPED_TAGS = new Set([
  "defs",
  "clipPath",
  "pattern",
  "mask",
  "marker",
  "title",
  "desc",
  "style",
  "script",
  "foreignObject",
  "linearGradient",
  "radialGradient",
]);

function inverse(m: PdfMatrix): PdfMatrix {
  const det = m[0] * m[3] - m[1] * m[2];
  if (!det) return [1, 0, 0, 1, 0, 0];
  return [
    m[3] / det,
    -m[1] / det,
    -m[2] / det,
    m[0] / det,
    (m[2] * m[5] - m[3] * m[4]) / det,
    (m[1] * m[4] - m[0] * m[5]) / det,
  ];
}
const fromDom = (m: DOMMatrix | SVGMatrix): PdfMatrix => [m.a, m.b, m.c, m.d, m.e, m.f];

/** Any CSS colour (oklch, color-mix, named …) to sRGB through a 1 × 1 canvas. */
function colorReader() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const cache = new Map<string, { color: PdfColor; alpha: number } | null>();
  return (value: string | null | undefined) => {
    if (!value || value === "none" || value.startsWith("url(")) return null;
    if (cache.has(value)) return cache.get(value)!;
    let result: { color: PdfColor; alpha: number } | null = null;
    if (context) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = "#000";
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      result = a ? { color: { r: r! / 255, g: g! / 255, b: b! / 255 }, alpha: a! / 255 } : null;
    }
    cache.set(value, result);
    return result;
  };
}

/**
 * Captures a plan sheet drawn as SVG at 100 % paper zoom (docs/PDF_EXPORT.md, PDF1) into one PDF
 * page of the paper's size. Geometry keeps its true size; widths that the plan draws in screen
 * pixels become 0.75 pt per pixel (96 dpi), exactly what 100 % shows. Elements marked
 * `data-export="skip"` (paper surface, margin frame, grid, on-screen aids) stay out; images do
 * not reach the PDF yet and are counted.
 */
export function captureSheet(
  svg: SVGSVGElement,
  paper: { x0: number; y0: number; x1: number; y1: number },
): SheetCapture {
  const color = colorReader();
  const box = svg.viewBox.baseVal;
  const rect = svg.getBoundingClientRect();
  // Root user space (plan metres, y down) to screen, then root to page points (y up).
  const rootToScreen: PdfMatrix = [
    rect.width / box.width,
    0,
    0,
    rect.height / box.height,
    rect.left - (box.x * rect.width) / box.width,
    rect.top - (box.y * rect.height) / box.height,
  ];
  const screenToRoot = inverse(rootToScreen);
  const page: PdfMatrix = [PT_PER_M, 0, 0, -PT_PER_M, -paper.x0 * PT_PER_M, -paper.y0 * PT_PER_M];
  const toPage = (element: SVGGraphicsElement): PdfMatrix => {
    const screen = element.getScreenCTM();
    return screen ? multiply(page, multiply(screenToRoot, fromDom(screen))) : page;
  };
  const commands: PdfCommand[] = [];
  let skippedImages = 0;

  const shapeOf = (element: Element, m: PdfMatrix): PdfSubpath[] => {
    const n = (name: string) => Number(element.getAttribute(name) ?? 0);
    switch (element.tagName) {
      case "line":
        return polySubpath(
          [
            { x: n("x1"), y: n("y1") },
            { x: n("x2"), y: n("y2") },
          ],
          false,
          m,
        );
      case "polyline":
      case "polygon":
        return polySubpath(
          parsePoints(element.getAttribute("points") ?? ""),
          element.tagName === "polygon",
          m,
        );
      case "rect": {
        const x = n("x"),
          y = n("y"),
          w = n("width"),
          h = n("height");
        if (!(w > 0 && h > 0)) return [];
        return polySubpath(
          [
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + h },
            { x, y: y + h },
          ],
          true,
          m,
        );
      }
      case "circle":
      case "ellipse": {
        const cx = n("cx"),
          cy = n("cy");
        const rx = element.tagName === "circle" ? n("r") : n("rx"),
          ry = element.tagName === "circle" ? n("r") : n("ry");
        if (!(rx > 0 && ry > 0)) return [];
        return parsePath(
          `M${cx + rx} ${cy} A${rx} ${ry} 0 1 1 ${cx - rx} ${cy} A${rx} ${ry} 0 1 1 ${cx + rx} ${cy} Z`,
          m,
        );
      }
      case "path":
        return parsePath(element.getAttribute("d") ?? "", m);
      default:
        return [];
    }
  };

  const patternFill = (
    element: SVGGraphicsElement,
    reference: string,
    alpha: number,
    evenOdd: boolean,
  ): PdfFill | undefined => {
    const id = /url\(["']?#([^"')]+)["']?\)/.exec(reference)?.[1];
    const pattern = id ? document.getElementById(id) : null;
    if (!(pattern instanceof SVGPatternElement)) return undefined;
    const x = pattern.x.baseVal.value,
      y = pattern.y.baseVal.value,
      width = pattern.width.baseVal.value,
      height = pattern.height.baseVal.value;
    if (!(width > 0 && height > 0)) return undefined;
    const view = pattern.getAttribute("viewBox") ? pattern.viewBox.baseVal : null;
    const tile: PdfMatrix =
      view && view.width > 0 && view.height > 0
        ? [
            width / view.width,
            0,
            0,
            height / view.height,
            x - (view.x * width) / view.width,
            y - (view.y * height) / view.height,
          ]
        : [1, 0, 0, 1, 0, 0];
    const own = pattern.patternTransform.baseVal.consolidate();
    const transform: PdfMatrix = own ? fromDom(own.matrix) : [1, 0, 0, 1, 0, 0];
    const lines = [...pattern.querySelectorAll("line")];
    const first = lines[0];
    const stroke = color(first?.getAttribute("stroke") ?? "#000");
    const result: PdfPattern = {
      box: view
        ? { x: view.x, y: view.y, width: view.width, height: view.height }
        : { x, y, width, height },
      matrix: multiply(toPage(element), multiply(transform, tile)),
      lines: lines.map((l) => ({
        from: { x: Number(l.getAttribute("x1") ?? 0), y: Number(l.getAttribute("y1") ?? 0) },
        to: { x: Number(l.getAttribute("x2") ?? 0), y: Number(l.getAttribute("y2") ?? 0) },
      })),
      color: stroke?.color ?? { r: 0, g: 0, b: 0 },
      lineWidth: Number(first?.getAttribute("stroke-width") ?? 0),
    };
    return { kind: "pattern", pattern: result, alpha, evenOdd };
  };

  const text = (element: SVGTextElement, opacity: number) => {
    const m = toPage(element);
    const scale = scaleOf(m);
    const angle = Math.atan2(m[1], m[0]);
    let index = 0;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const content = node.textContent ?? "";
      const parent = node.parentElement;
      if (content.trim() && parent) {
        const style = getComputedStyle(parent);
        const fill = color(style.fill);
        try {
          const start = element.getStartPositionOfChar(index);
          if (fill)
            commands.push({
              kind: "text",
              text: content.replace(/\s+/g, " ").trim(),
              at: apply(m, { x: start.x, y: start.y }),
              size: parseFloat(style.fontSize) * scale,
              angle,
              color: fill.color,
              alpha: fill.alpha * opacity * Number(style.fillOpacity || 1),
              bold: Number(style.fontWeight) >= 600 || style.fontWeight === "bold",
            });
        } catch {
          // A character the browser does not lay out (hidden, zero size) has no position.
        }
      }
      // Addressable characters count UTF-16 units, as the browser lays them out.
      index += content.length;
    }
  };

  const visit = (element: Element, opacity: number) => {
    if (SKIPPED_TAGS.has(element.tagName)) return;
    if (element.getAttribute("data-export") === "skip") return;
    if (element.tagName === "image") {
      skippedImages++;
      return;
    }
    const style = getComputedStyle(element);
    if (style.display === "none") return;
    const alpha = opacity * Number(style.opacity || 1);
    if (alpha <= 0) return;
    const clip = style.clipPath && style.clipPath !== "none" ? style.clipPath : null;
    const clipId = clip ? /url\(["']?#([^"')]+)["']?\)/.exec(clip)?.[1] : undefined;
    const clipElement = clipId ? document.getElementById(clipId) : null;
    let clipped = false;
    if (clipElement instanceof SVGClipPathElement && element instanceof SVGGraphicsElement) {
      const m = toPage(element);
      const subpaths = [...clipElement.children].flatMap((c) => shapeOf(c, m));
      commands.push({ kind: "clip", subpaths });
      clipped = true;
    }
    if (element.tagName === "g" || element.tagName === "svg" || element.tagName === "a")
      for (const child of element.children) visit(child, alpha);
    else if (element.tagName === "text" && element instanceof SVGTextElement) {
      if (style.visibility !== "hidden") text(element, alpha);
    } else if (element instanceof SVGGraphicsElement && style.visibility !== "hidden") {
      const m = toPage(element);
      const subpaths = shapeOf(element, m);
      if (subpaths.length) {
        const nonScaling = style.vectorEffect === "non-scaling-stroke";
        // Screen pixels at 100 % become points at 96 dpi; geometry widths scale with it.
        const width = (value: number) => (nonScaling ? value * 0.75 : value * scaleOf(m));
        const evenOdd = style.fillRule === "evenodd";
        const fillAlpha = alpha * Number(style.fillOpacity || 1);
        const isLine = element.tagName === "line" || element.tagName === "polyline";
        let fill: PdfFill | undefined;
        if (!isLine && style.fill.startsWith("url("))
          fill = patternFill(element, style.fill, fillAlpha, evenOdd);
        else if (!isLine) {
          const c = color(style.fill);
          if (c) fill = { kind: "color", color: c.color, alpha: c.alpha * fillAlpha, evenOdd };
        }
        let stroke: PdfStroke | undefined;
        const s = color(style.stroke);
        const strokeWidth = parseFloat(style.strokeWidth);
        if (s && strokeWidth > 0) {
          const dash =
            style.strokeDasharray && style.strokeDasharray !== "none"
              ? style.strokeDasharray
                  .split(/[\s,]+/)
                  .map((d) => width(parseFloat(d)))
                  .filter((d) => Number.isFinite(d))
              : undefined;
          stroke = {
            color: s.color,
            alpha: s.alpha * alpha * Number(style.strokeOpacity || 1),
            width:
              width(strokeWidth) *
              penFactor(element.closest("[data-pen]")?.getAttribute("data-pen")),
            ...(dash?.length ? { dash } : {}),
            cap: (style.strokeLinecap as PdfStroke["cap"]) || "butt",
            join: (style.strokeLinejoin as PdfStroke["join"]) || "miter",
          };
        }
        if (fill || stroke)
          commands.push({
            kind: "path",
            subpaths,
            ...(fill ? { fill } : {}),
            ...(stroke ? { stroke } : {}),
          });
      }
    }
    if (clipped) commands.push({ kind: "unclip" });
  };
  for (const child of svg.children) visit(child, 1);
  return {
    page: {
      width: (paper.x1 - paper.x0) * PT_PER_M,
      height: (paper.y1 - paper.y0) * PT_PER_M,
      commands,
    },
    skippedImages,
  };
}
