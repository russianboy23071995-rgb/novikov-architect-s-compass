import type { PdfMatrix, PdfPoint, PdfSubpath } from "./pdf-writer.ts";

/** Applies an affine matrix (SVG/PDF order a b c d e f) to a point. */
export function apply(m: PdfMatrix, p: PdfPoint): PdfPoint {
  return { x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] };
}
/** m · n: first n, then m. */
export function multiply(m: PdfMatrix, n: PdfMatrix): PdfMatrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}
/** The length factor of a matrix (geometric mean of its axes; exact for similarity). */
export function scaleOf(m: PdfMatrix): number {
  return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
}

/** Subpaths of a polyline or polygon, transformed. */
export function polySubpath(points: readonly PdfPoint[], closed: boolean, m: PdfMatrix) {
  const [first, ...rest] = points.map((p) => apply(m, p));
  if (!first) return [];
  return [
    { start: first, segments: rest.map((to) => ({ kind: "line" as const, to })), closed },
  ] satisfies PdfSubpath[];
}

/** Points of an SVG `points` attribute. */
export function parsePoints(value: string): PdfPoint[] {
  const n = value
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  const out: PdfPoint[] = [];
  for (let i = 0; i + 1 < n.length; i += 2) out.push({ x: n[i]!, y: n[i + 1]! });
  return out;
}

/** Cubic Béziers of an elliptical arc (SVG endpoint form), in local coordinates. */
function arcCurves(
  from: PdfPoint,
  rxIn: number,
  ryIn: number,
  rotationDeg: number,
  large: boolean,
  sweep: boolean,
  to: PdfPoint,
): { c1: PdfPoint; c2: PdfPoint; to: PdfPoint }[] {
  let rx = Math.abs(rxIn),
    ry = Math.abs(ryIn);
  if (!rx || !ry || (from.x === to.x && from.y === to.y)) return [{ c1: from, c2: to, to }];
  const phi = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(phi),
    sin = Math.sin(phi);
  const dx = (from.x - to.x) / 2,
    dy = (from.y - to.y) / 2;
  const x1 = cos * dx + sin * dy,
    y1 = -sin * dx + cos * dy;
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const sign = large === sweep ? -1 : 1;
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const k = sign * Math.sqrt(Math.max(0, num / den));
  const cx1 = (k * rx * y1) / ry,
    cy1 = (-k * ry * x1) / rx;
  const cx = cos * cx1 - sin * cy1 + (from.x + to.x) / 2,
    cy = sin * cx1 + cos * cy1 + (from.y + to.y) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number) =>
    Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let dt = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  if (sweep && dt < 0) dt += 2 * Math.PI;
  const parts = Math.ceil(Math.abs(dt) / (Math.PI / 2));
  const step = dt / parts;
  const alpha = (4 / 3) * Math.tan(step / 4);
  const point = (t: number) => ({
    x: cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin,
    y: cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos,
  });
  const tangent = (t: number) => ({
    x: -rx * Math.sin(t) * cos - ry * Math.cos(t) * sin,
    y: -rx * Math.sin(t) * sin + ry * Math.cos(t) * cos,
  });
  const curves = [];
  for (let i = 0; i < parts; i++) {
    const a = t1 + i * step,
      b = a + step;
    const p0 = point(a),
      p1 = point(b),
      d0 = tangent(a),
      d1 = tangent(b);
    curves.push({
      c1: { x: p0.x + alpha * d0.x, y: p0.y + alpha * d0.y },
      c2: { x: p1.x - alpha * d1.x, y: p1.y - alpha * d1.y },
      to: i === parts - 1 ? to : p1,
    });
  }
  return curves;
}

/**
 * Subpaths of an SVG path `d` (M L H V C S Q T A Z, absolute and relative), transformed by `m`.
 * Quadratic curves and arcs become cubic Béziers before the transform, so any affine matrix
 * keeps them exact.
 */
export function parsePath(d: string, m: PdfMatrix): PdfSubpath[] {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const out: PdfSubpath[] = [];
  let current: {
    start: PdfPoint;
    segments: PdfSubpath["segments"][number][];
    closed: boolean;
  } | null = null;
  let at: PdfPoint = { x: 0, y: 0 },
    start: PdfPoint = { x: 0, y: 0 },
    lastControl: PdfPoint | null = null,
    lastQuad: PdfPoint | null = null;
  let i = 0,
    command = "";
  const isCommand = (t: string | undefined) => !!t && /[a-zA-Z]/.test(t);
  const n = () => Number(tokens[i++]);
  const line = (to: PdfPoint) => {
    current?.segments.push({ kind: "line", to: apply(m, to) });
    at = to;
  };
  const curve = (c1: PdfPoint, c2: PdfPoint, to: PdfPoint) => {
    current?.segments.push({ kind: "curve", c1: apply(m, c1), c2: apply(m, c2), to: apply(m, to) });
    at = to;
  };
  while (i < tokens.length) {
    if (isCommand(tokens[i])) command = tokens[i++]!;
    else if (!command) break;
    const rel = command === command.toLowerCase();
    const base = rel ? at : { x: 0, y: 0 };
    const pt = (x: number, y: number) => ({ x: base.x + x, y: base.y + y });
    const c = command.toUpperCase();
    if (c === "Z") {
      if (current) {
        current.closed = true;
        out.push(current);
        current = null;
      }
      at = start;
      lastControl = lastQuad = null;
      continue;
    }
    if (i >= tokens.length || isCommand(tokens[i])) continue;
    if (c === "M") {
      if (current) out.push(current);
      at = start = pt(n(), n());
      current = { start: apply(m, at), segments: [], closed: false };
      command = rel ? "l" : "L";
      lastControl = lastQuad = null;
      continue;
    }
    if (!current) current = { start: apply(m, at), segments: [], closed: false };
    if (c === "L") line(pt(n(), n()));
    else if (c === "H") line({ x: rel ? at.x + n() : n(), y: at.y });
    else if (c === "V") line({ x: at.x, y: rel ? at.y + n() : n() });
    else if (c === "C") {
      const c1 = pt(n(), n()),
        c2 = pt(n(), n()),
        to = pt(n(), n());
      curve(c1, c2, to);
      lastControl = c2;
      lastQuad = null;
      continue;
    } else if (c === "S") {
      const c1 = lastControl ? { x: 2 * at.x - lastControl.x, y: 2 * at.y - lastControl.y } : at;
      const c2 = pt(n(), n()),
        to = pt(n(), n());
      curve(c1, c2, to);
      lastControl = c2;
      lastQuad = null;
      continue;
    } else if (c === "Q" || c === "T") {
      const q: PdfPoint =
        c === "Q"
          ? pt(n(), n())
          : lastQuad
            ? { x: 2 * at.x - lastQuad.x, y: 2 * at.y - lastQuad.y }
            : at;
      const to = pt(n(), n());
      const from = at;
      curve(
        { x: from.x + (2 / 3) * (q.x - from.x), y: from.y + (2 / 3) * (q.y - from.y) },
        { x: to.x + (2 / 3) * (q.x - to.x), y: to.y + (2 / 3) * (q.y - to.y) },
        to,
      );
      lastQuad = q;
      lastControl = null;
      continue;
    } else if (c === "A") {
      const rx = n(),
        ry = n(),
        rotation = n(),
        large = n() !== 0,
        sweep = n() !== 0,
        to = pt(n(), n());
      for (const part of arcCurves(at, rx, ry, rotation, large, sweep, to))
        curve(part.c1, part.c2, part.to);
    } else {
      // Unknown command: stop rather than draw something wrong.
      break;
    }
    lastControl = lastQuad = null;
  }
  if (current) out.push(current);
  return out.filter((s) => s.segments.length > 0 || s.closed);
}
