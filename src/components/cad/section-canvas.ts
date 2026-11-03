import type { SectionDrawing, SectionPoint } from "@/rendering/viewport/section-drawing";
import { insulationZigzag } from "../../rendering/viewport/wall-layers.ts";

/**
 * The section drawing of the section tab on a canvas (docs/performance/SECTION_CANVAS.md): the
 * same content and order as `SectionGraphic` (views beyond, storey lines, cut parts, border),
 * which stays the SVG of layouts and the PDF export. Height marks, previews and the storey marks
 * with their text stay SVG above it. Widths and dashes are screen pixels like the SVG's
 * non-scaling strokes; everything else is drawing metres, y flipped.
 */
export type CanvasBox = { x: number; y: number; w: number; h: number };
/** Resolved colours of the CSS variables the SVG uses. */
export type SectionCanvasColors = { background: string; foreground: string; muted: string };
export type SectionCanvasStyle = {
  colors: SectionCanvasColors;
  /** Cut paint (`cutPaint`), its colour already resolved. */
  cut: { fill: string; fillOpacity: number };
  selection: string;
  /** Hatch spacing of cut layers in metres. */
  hatch: number;
  /** Vertical extent of the border lines (`sectionGraphicExtent`). */
  extent: { minY: number; maxY: number };
};
/** The part of the canvas 2D context used here; a recording stand-in tests the drawing. */
export type SectionCanvasContext = Pick<
  CanvasRenderingContext2D,
  | "save"
  | "restore"
  | "beginPath"
  | "moveTo"
  | "lineTo"
  | "closePath"
  | "rect"
  | "arc"
  | "fill"
  | "stroke"
  | "clip"
  | "setLineDash"
  | "fillStyle"
  | "strokeStyle"
  | "lineWidth"
  | "globalAlpha"
>;

/** Device pixels per metre and offset of a view box drawn with `xMidYMid meet`, like the SVG. */
export function viewTransform(view: CanvasBox, width: number, height: number) {
  const scale = Math.min(width / view.w, height / view.h);
  return {
    scale,
    x: (width - view.w * scale) / 2 - view.x * scale,
    y: (height - view.h * scale) / 2 - view.y * scale,
  };
}

/**
 * Where an image drawn for `from` lies on a canvas showing `to` (same canvas size): zooming and
 * panning move and scale the last sharp image until it is drawn anew.
 */
export function imagePlacement(from: CanvasBox, to: CanvasBox, width: number, height: number) {
  const a = viewTransform(from, width, height),
    b = viewTransform(to, width, height);
  const k = b.scale / a.scale;
  return { x: b.x - a.x * k, y: b.y - a.y * k, w: width * k, h: height * k };
}

/** Stroke weights of cut outlines as in `SectionGraphic`, screen pixels. */
const CUT_STROKE = { part: 1.75, frame: 1.1, glass: 0.6 } as const;

/**
 * Draws the drawing for `view` on a canvas of `width` × `height` device pixels with `ratio`
 * device pixels per CSS pixel. The canvas is cleared by the caller.
 */
export function drawSectionCanvas(
  ctx: SectionCanvasContext,
  drawing: SectionDrawing,
  view: CanvasBox,
  size: { width: number; height: number; ratio: number },
  style: SectionCanvasStyle,
  selectedIds?: ReadonlySet<string>,
): void {
  const t = viewTransform(view, size.width, size.height);
  const px = (x: number) => t.x + x * t.scale;
  const py = (y: number) => t.y - y * t.scale;
  const r = size.ratio;
  const { colors } = style;
  const picked = (id: string) => selectedIds?.has(id) ?? false;
  const ink = (id: string) => (picked(id) ? style.selection : colors.foreground);
  const ring = (points: readonly SectionPoint[]) => {
    points.forEach((p, i) => (i ? ctx.lineTo(px(p.x), py(p.y)) : ctx.moveTo(px(p.x), py(p.y))));
    ctx.closePath();
  };
  const line = (a: SectionPoint, b: SectionPoint) => {
    ctx.moveTo(px(a.x), py(a.y));
    ctx.lineTo(px(b.x), py(b.y));
  };
  const stroke = (color: string, width: number, dash: readonly number[] = [], alpha = 1) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width * r;
    ctx.setLineDash(dash.map((d) => d * r));
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  const fill = (color: string, alpha = 1, rule: CanvasFillRule = "nonzero") => {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill(rule);
    ctx.globalAlpha = 1;
  };

  // Views beyond, farthest first: the background of each hides what lies behind it.
  for (const v of drawing.views) {
    ctx.beginPath();
    ring(v.points);
    fill(colors.background);
    if (picked(v.id)) fill(style.selection, 0.25);
    if (v.edges.length) {
      ctx.beginPath();
      for (const [a, b] of v.edges) line(a, b);
      stroke(ink(v.id), picked(v.id) ? 1.25 : 0.75);
    }
    if (v.marks?.segments.length) {
      ctx.beginPath();
      for (const [a, b] of v.marks.segments) line(a, b);
      stroke(colors.foreground, 0.6, v.marks.dashed ? [6, 4] : []);
    }
  }
  // Storey lines; their marks with the text are SVG.
  for (const level of drawing.levels) {
    ctx.beginPath();
    line({ x: 0, y: level.elevation }, { x: drawing.width, y: level.elevation });
    stroke(colors.muted, 0.75, [8, 4]);
  }
  // Cut parts.
  for (const cut of drawing.cuts) {
    if (cut.loops.length) {
      const outline = () => {
        ctx.beginPath();
        cut.loops.forEach(ring);
      };
      if (cut.layers) {
        const ys = cut.loops.flat().map((p) => p.y);
        const bottom = Math.min(...ys),
          top = Math.max(...ys);
        ctx.save();
        outline();
        ctx.clip("evenodd");
        drawLayers(ctx, cut.layers, bottom, top, style, px, py, r);
        ctx.restore();
      }
      outline();
      if (!cut.layers)
        fill(
          cut.kind === "part" ? style.cut.fill : colors.background,
          cut.kind === "part" ? style.cut.fillOpacity : 1,
          "evenodd",
        );
      stroke(ink(cut.id), CUT_STROKE[cut.kind]);
      if (picked(cut.id)) {
        outline();
        fill(style.selection, 0.55, "evenodd");
      }
    }
    for (const piece of cut.open) {
      ctx.beginPath();
      piece.forEach((p, i) => (i ? ctx.lineTo(px(p.x), py(p.y)) : ctx.moveTo(px(p.x), py(p.y))));
      stroke(ink(cut.id), CUT_STROKE[cut.kind]);
    }
  }
  // Border at both ends of the line.
  for (const x of [0, drawing.width]) {
    ctx.beginPath();
    line({ x, y: style.extent.maxY - 0.5 }, { x, y: style.extent.minY + 0.5 });
    stroke(colors.foreground, 0.75);
  }
}

/** Layers of a cut wall as `SectionLayerGraphic` draws them, inside the clipped outline. */
function drawLayers(
  ctx: SectionCanvasContext,
  layers: NonNullable<SectionDrawing["cuts"][number]["layers"]>,
  bottom: number,
  top: number,
  style: SectionCanvasStyle,
  px: (x: number) => number,
  py: (y: number) => number,
  r: number,
) {
  const u = style.hatch;
  const hatchLine = () => {
    ctx.strokeStyle = style.colors.foreground;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 0.5 * r;
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  for (const layer of layers) {
    const x0 = px(layer.from),
      x1 = px(layer.to),
      y0 = py(top),
      y1 = py(bottom);
    ctx.beginPath();
    ctx.rect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = layer.material.color;
    ctx.fill();
    const pattern = layer.material.pattern;
    if (pattern === "diagonal" || pattern === "cross") {
      // Pattern cells of u × u from the drawing origin, as the SVG pattern in user space.
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, x1 - x0, y1 - y0);
      ctx.clip();
      ctx.beginPath();
      // Rising lines x + y = k·u (in SVG coordinates, y = -height), falling ones x - y = k·u;
      // k covers every line that crosses the strip.
      const k0 = Math.floor(Math.min(layer.from - top, layer.from + bottom) / u) - 1,
        k1 = Math.ceil(Math.max(layer.to - bottom, layer.to + top) / u) + 1;
      for (let k = k0; k <= k1; k++) {
        const c = k * u;
        ctx.moveTo(px(c + top), py(top));
        ctx.lineTo(px(c + bottom), py(bottom));
        if (pattern === "cross") {
          ctx.moveTo(px(c - top), py(top));
          ctx.lineTo(px(c - bottom), py(bottom));
        }
      }
      hatchLine();
      ctx.restore();
    } else if (pattern === "dots") {
      ctx.beginPath();
      const i0 = Math.floor(layer.from / u),
        i1 = Math.ceil(layer.to / u),
        j0 = Math.floor(-top / u),
        j1 = Math.ceil(-bottom / u);
      const radius = (u / 10) * (px(1) - px(0));
      for (let i = i0; i <= i1; i++)
        for (let j = j0; j <= j1; j++) {
          const cx = px((i + 0.5) * u),
            cy = py(-(j + 0.5) * u);
          ctx.moveTo(cx + radius, cy);
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        }
      ctx.fillStyle = style.colors.foreground;
      ctx.globalAlpha = 0.55;
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (pattern === "insulation") {
      ctx.beginPath();
      insulationZigzag({ from: layer.from, to: layer.to }, bottom, top).forEach((p, i) =>
        i ? ctx.lineTo(px(p.y), py(p.x)) : ctx.moveTo(px(p.y), py(p.x)),
      );
      hatchLine();
    }
  }
  ctx.beginPath();
  for (const layer of layers.slice(1)) {
    ctx.moveTo(px(layer.from), py(top));
    ctx.lineTo(px(layer.from), py(bottom));
  }
  ctx.strokeStyle = style.colors.foreground;
  ctx.lineWidth = 0.6 * r;
  ctx.setLineDash([]);
  ctx.stroke();
}
