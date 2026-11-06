import type { PdfImage } from "./pdf-writer.ts";

/** Resolution on paper and the longest side a picture keeps (docs/PDF_EXPORT.md, P3). */
const PAPER_DPI = 200;
const MAX_SIDE = 4000;

const hexOf = (base64: string) => {
  const bytes = atob(base64);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes.charCodeAt(i).toString(16).padStart(2, "0");
  return out;
};

/**
 * The pictures of a sheet drawn at 100 % paper zoom, as JPEG on white for the PDF. A picture is
 * never enlarged. One that does not load has no entry, the capture counts it as left out.
 */
export async function sheetImages(svg: SVGSVGElement): Promise<Map<Element, PdfImage>> {
  const images = new Map<Element, PdfImage>();
  for (const element of svg.querySelectorAll("image")) {
    const href = element.href.baseVal;
    const screen = element.getScreenCTM();
    if (!href || !screen) continue;
    const source = new Image();
    source.src = href;
    try {
      await source.decode();
    } catch {
      continue;
    }
    const { naturalWidth: width, naturalHeight: height } = source;
    if (!(width > 0 && height > 0)) continue;
    const shown = element.width.baseVal.value * Math.hypot(screen.a, screen.b);
    const scale = Math.min(1, (shown * PAPER_DPI) / 96 / width, MAX_SIDE / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) continue;
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const hex = hexOf(canvas.toDataURL("image/jpeg", 0.9).split(",")[1] ?? "");
    if (hex) images.set(element, { width: canvas.width, height: canvas.height, hex });
  }
  return images;
}
