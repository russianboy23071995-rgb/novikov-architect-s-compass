import type { TitleBlock } from "@/domain/project/schema";
import {
  PAPER_FORMATS,
  PAPER_FORMAT_LABELS,
  sheetSize,
  type PaperFormat,
  type Sheet,
} from "@/domain/views/layouts";

const text = (v: number) => String(v).replace(".", ",");

/**
 * Bar of the Plankopfplaner tab (docs/PLANKOPF.md, PK3): the paper underlay to judge the size
 * of the title block. The lower right corner of the dashed margin frame is the title block's
 * reference point.
 */
export function TitleBlockBar({
  block,
  onSheet,
  onPdf,
  onPrint,
}: {
  block: TitleBlock;
  onSheet: (sheet: Sheet) => void;
  /** Exports the Plankopf on its underlay as PDF (docs/PDF_EXPORT.md). */
  onPdf?: (() => void) | undefined;
  onPrint?: (() => void) | undefined;
}) {
  const sheet = block.sheet;
  const { width, height } = sheetSize(sheet);
  const setFormat = (format: PaperFormat) => {
    if (format === "custom") return onSheet({ ...sheet, format, width, height });
    const { width: _w, height: _h, ...rest } = sheet;
    onSheet({ ...rest, format });
  };
  const setOrientation = (orientation: Sheet["orientation"]) => {
    if (sheet.format !== "custom") return onSheet({ ...sheet, orientation });
    // A free size turns by swapping its sides.
    onSheet({ ...sheet, orientation, width: height, height: width });
  };
  return (
    <div
      role="toolbar"
      aria-label="Plankopf-Unterlage"
      className="absolute left-1/2 top-12 z-40 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md border border-border bg-popover/80 px-2 py-1 text-[11px] text-muted-foreground shadow backdrop-blur"
    >
      <span className="font-semibold text-foreground">Plankopf {block.name}</span>
      <span>Unterlage</span>
      <select
        aria-label="Unterlage Größe"
        className="h-6 rounded border bg-background px-1"
        value={sheet.format}
        onChange={(e) => setFormat(e.target.value as PaperFormat)}
      >
        {PAPER_FORMATS.filter((f) => f !== "custom" || sheet.format === "custom").map((f) => (
          <option key={f} value={f}>
            {PAPER_FORMAT_LABELS[f]}
          </option>
        ))}
      </select>
      <select
        aria-label="Unterlage Format"
        className="h-6 rounded border bg-background px-1"
        value={sheet.orientation}
        onChange={(e) => setOrientation(e.target.value as Sheet["orientation"])}
      >
        <option value="portrait">Hochformat</option>
        <option value="landscape">Querformat</option>
      </select>
      <span>
        {text(width)} × {text(height)} mm · Bezugspunkt: rechte untere Ecke des Randrahmens
      </span>
      {onPdf && (
        <button type="button" className="rounded border bg-background px-2 py-0.5" onClick={onPdf}>
          PDF exportieren
        </button>
      )}
      {onPrint && (
        <button
          type="button"
          className="rounded border bg-background px-2 py-0.5"
          onClick={onPrint}
        >
          Drucken
        </button>
      )}
    </div>
  );
}
