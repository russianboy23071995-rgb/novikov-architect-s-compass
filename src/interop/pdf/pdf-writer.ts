/**
 * A small PDF 1.4 writer for plan sheets (docs/PDF_EXPORT.md, PDF1): pages in exact paper size, vector paths with stroke, fill, dashes and opacity, clipping, coloured tiling patterns
 * for hatches, JPEG pictures, and text in the built-in Helvetica (WinAnsi, so German umlauts and
 * ß work).
 * No fonts or libraries are downloaded; the output is plain ASCII apart from the header line.
 * Coordinates are PDF points with the origin at the lower left of the page.
 */

export type PdfColor = { r: number; g: number; b: number };
/** a b c d e f as in SVG and PDF: x' = a·x + c·y + e, y' = b·x + d·y + f. */
export type PdfMatrix = readonly [number, number, number, number, number, number];
export type PdfPoint = { x: number; y: number };

/** One subpath: a start point and segments (lines or cubic Béziers). */
export type PdfSubpath = {
  start: PdfPoint;
  segments: readonly (
    { kind: "line"; to: PdfPoint } | { kind: "curve"; c1: PdfPoint; c2: PdfPoint; to: PdfPoint }
  )[];
  closed: boolean;
};

export type PdfStroke = {
  color: PdfColor;
  alpha: number;
  width: number;
  dash?: readonly number[];
  cap?: "butt" | "round" | "square";
  join?: "miter" | "round" | "bevel";
};

/** A coloured tiling pattern: lines in pattern space, `matrix` maps pattern space to the page. */
export type PdfPattern = {
  box: { x: number; y: number; width: number; height: number };
  matrix: PdfMatrix;
  lines: readonly { from: PdfPoint; to: PdfPoint }[];
  color: PdfColor;
  lineWidth: number;
};

export type PdfFill =
  | { kind: "color"; color: PdfColor; alpha: number; evenOdd?: boolean }
  | { kind: "pattern"; pattern: PdfPattern; alpha: number; evenOdd?: boolean };

/** A JPEG in hex digits, which keeps the file ASCII; `width` and `height` are its pixels. */
export type PdfImage = { width: number; height: number; hex: string };

export type PdfCommand =
  | { kind: "path"; subpaths: readonly PdfSubpath[]; fill?: PdfFill; stroke?: PdfStroke }
  /** `matrix` maps the unit square of the picture (y up) to the page. */
  | { kind: "image"; image: PdfImage; matrix: PdfMatrix; alpha: number }
  | { kind: "clip"; subpaths: readonly PdfSubpath[] }
  | { kind: "unclip" }
  | {
      kind: "text";
      text: string;
      at: PdfPoint;
      size: number;
      /** Counter-clockwise, radians. */
      angle: number;
      color: PdfColor;
      alpha: number;
      bold?: boolean;
    };

export type PdfPage = { width: number; height: number; commands: readonly PdfCommand[] };

/** Points per millimetre and per metre. */
export const PT_PER_MM = 72 / 25.4;
export const PT_PER_M = PT_PER_MM * 1000;

const num = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
};
/** Unit-square matrices carry the whole size of a picture, so they keep more digits. */
const exact = (value: number) => (Number.isFinite(value) ? String(+value.toFixed(5)) : "0");
const channel = (value: number) => num(Math.max(0, Math.min(1, value)));
const rgb = (c: PdfColor) => `${channel(c.r)} ${channel(c.g)} ${channel(c.b)}`;

/** WinAnsi bytes of a string as a hex string; characters outside it become „?“. */
export function winAnsiHex(text: string): string {
  const special: Record<string, number> = {
    "€": 0x80,
    "‚": 0x82,
    "„": 0x84,
    "…": 0x85,
    "‘": 0x91,
    "’": 0x92,
    "“": 0x93,
    "”": 0x94,
    "•": 0x95,
    "–": 0x96,
    "—": 0x97,
  };
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0)!;
    const byte =
      special[char] ??
      ((code >= 0x20 && code < 0x7f) || (code >= 0xa0 && code <= 0xff) ? code : 0x3f);
    out += byte.toString(16).padStart(2, "0");
  }
  return `<${out}>`;
}

function pathOps(subpaths: readonly PdfSubpath[]): string[] {
  const ops: string[] = [];
  const p = (point: PdfPoint) => `${num(point.x)} ${num(point.y)}`;
  for (const sub of subpaths) {
    ops.push(`${p(sub.start)} m`);
    for (const s of sub.segments)
      ops.push(s.kind === "line" ? `${p(s.to)} l` : `${p(s.c1)} ${p(s.c2)} ${p(s.to)} c`);
    if (sub.closed) ops.push("h");
  }
  return ops;
}

/** The PDF file of one or several pages, each in its own size, as bytes. */
export function writePdf(input: PdfPage | readonly PdfPage[]): Uint8Array<ArrayBuffer> {
  const pages = "commands" in input ? [input] : input;
  if (!pages.length) throw new Error("Ein PDF braucht mindestens ein Blatt.");
  const alphas = new Map<string, string>();
  const patterns: { name: string; pattern: PdfPattern }[] = [];
  const alphaName = (fill: number, stroke: number) => {
    const key = `${channel(fill)}/${channel(stroke)}`;
    let name = alphas.get(key);
    if (!name) alphas.set(key, (name = `GS${alphas.size + 1}`));
    return name;
  };
  const images = new Map<string, { name: string; image: PdfImage }>();
  let usesBold = false;
  const contents = pages.map((page) => {
    const ops: string[] = [];
    for (const command of page.commands) {
      if (command.kind === "clip") {
        ops.push("q", ...pathOps(command.subpaths), "W n");
        continue;
      }
      if (command.kind === "unclip") {
        ops.push("Q");
        continue;
      }
      if (command.kind === "image") {
        // The same picture twice is stored once.
        const { image } = command;
        let entry = images.get(image.hex);
        if (!entry) images.set(image.hex, (entry = { name: `Im${images.size + 1}`, image }));
        ops.push(
          "q",
          `/${alphaName(command.alpha, 1)} gs`,
          `${command.matrix.map(exact).join(" ")} cm`,
          `/${entry.name} Do`,
          "Q",
        );
        continue;
      }
      if (command.kind === "text") {
        if (!command.text.trim() || command.size <= 0) continue;
        usesBold ||= !!command.bold;
        const cos = Math.cos(command.angle),
          sin = Math.sin(command.angle);
        ops.push(
          "q",
          `/${alphaName(command.alpha, 1)} gs`,
          `${rgb(command.color)} rg`,
          "BT",
          `/${command.bold ? "F2" : "F1"} ${num(command.size)} Tf`,
          `${num(cos)} ${num(sin)} ${num(-sin)} ${num(cos)} ${num(command.at.x)} ${num(command.at.y)} Tm`,
          `${winAnsiHex(command.text)} Tj`,
          "ET",
          "Q",
        );
        continue;
      }
      const { fill, stroke } = command;
      const filled = fill && fill.alpha > 0;
      const stroked = stroke && stroke.alpha > 0 && stroke.width > 0;
      if (!filled && !stroked) continue;
      ops.push("q", `/${alphaName(filled ? fill.alpha : 1, stroked ? stroke.alpha : 1)} gs`);
      if (filled) {
        if (fill.kind === "color") ops.push(`${rgb(fill.color)} rg`);
        else {
          const name = `P${patterns.length + 1}`;
          patterns.push({ name, pattern: fill.pattern });
          ops.push("/Pattern cs", `/${name} scn`);
        }
      }
      if (stroked) {
        ops.push(`${rgb(stroke.color)} RG`, `${num(stroke.width)} w`);
        ops.push(`${{ butt: 0, round: 1, square: 2 }[stroke.cap ?? "butt"]} J`);
        ops.push(`${{ miter: 0, round: 1, bevel: 2 }[stroke.join ?? "miter"]} j`);
        const dash = stroke.dash?.filter((d) => d > 0) ?? [];
        ops.push(dash.length ? `[${dash.map(num).join(" ")}] 0 d` : "[] 0 d");
      }
      ops.push(...pathOps(command.subpaths));
      const even = filled && fill.evenOdd ? "*" : "";
      ops.push(filled && stroked ? `B${even}` : filled ? `f${even}` : "S", "Q");
    }
    return ops.join("\n");
  });

  // Objects: 1 catalog, 2 pages, 3 first page, 4 its content, 5–6 fonts, then states, patterns,
  // pictures and further pages; all pages share the resources.
  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[6] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  let next = 7;
  const gsRefs: string[] = [];
  for (const [key, name] of alphas) {
    const [fill, stroke] = key.split("/");
    objects[next] = `<< /Type /ExtGState /ca ${fill} /CA ${stroke} >>`;
    gsRefs.push(`/${name} ${next} 0 R`);
    next++;
  }
  const patternRefs: string[] = [];
  for (const { name, pattern } of patterns) {
    const { box } = pattern;
    const body = [
      `${rgb(pattern.color)} RG`,
      `${num(pattern.lineWidth)} w`,
      ...pattern.lines.map(
        (l) => `${num(l.from.x)} ${num(l.from.y)} m ${num(l.to.x)} ${num(l.to.y)} l S`,
      ),
    ].join("\n");
    objects[next] =
      `<< /Type /Pattern /PatternType 1 /PaintType 1 /TilingType 1` +
      ` /BBox [${num(box.x)} ${num(box.y)} ${num(box.x + box.width)} ${num(box.y + box.height)}]` +
      ` /XStep ${num(box.width)} /YStep ${num(box.height)}` +
      ` /Matrix [${pattern.matrix.map(num).join(" ")}] /Resources << >> /Length ${body.length} >>` +
      `\nstream\n${body}\nendstream`;
    patternRefs.push(`/${name} ${next} 0 R`);
    next++;
  }
  const imageRefs: string[] = [];
  for (const { name, image } of images.values()) {
    objects[next] =
      `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height}` +
      ` /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode]` +
      ` /Length ${image.hex.length + 1} >>\nstream\n${image.hex}>\nendstream`;
    imageRefs.push(`/${name} ${next} 0 R`);
    next++;
  }
  const resources =
    `<< /Font << /F1 5 0 R${usesBold ? " /F2 6 0 R" : ""} >>` +
    ` /ExtGState << ${gsRefs.join(" ")} >> /Pattern << ${patternRefs.join(" ")} >>` +
    ` /XObject << ${imageRefs.join(" ")} >> >>`;
  const pageIds = pages.map((page, i) => {
    const pageId = i ? next++ : 3,
      contentId = i ? next++ : 4,
      content = contents[i]!;
    objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(page.width)} ${num(page.height)}]` +
      ` /Contents ${contentId} 0 R /Resources ${resources} >>`;
    return pageId;
  });
  objects[2] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}]` +
    ` /Count ${pages.length} >>`;

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let length = 0;
  const push = (text: string) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    length += bytes.length;
  };
  push("%PDF-1.4\n");
  const offsets: number[] = [];
  for (let i = 1; i < next; i++) {
    offsets[i] = length;
    push(`${i} 0 obj\n${objects[i]}\nendobj\n`);
  }
  const xref = length;
  push(`xref\n0 ${next}\n0000000000 65535 f \n`);
  for (let i = 1; i < next; i++) push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${next} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(length);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}
