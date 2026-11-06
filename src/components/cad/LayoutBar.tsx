import { PAPER_FORMAT_LABELS, sheetSize, type Sheet } from "@/domain/views/layouts";

const text = (v: number) => String(v).replace(".", ",");
/** Bar of a layout tab: what is open, its sheet, its master and the settings window. */
export function LayoutBar({
  name,
  kind,
  sheet,
  master,
  onSettings,
  onPdf,
  onPrint,
}: {
  name: string;
  kind: "Layout" | "Masterlayout";
  sheet: Sheet;
  /** The followed master; null: none; undefined: a master layout itself. */
  master?: string | null | undefined;
  onSettings: () => void;
  /** Exports the sheet as PDF in its paper size (docs/PDF_EXPORT.md). */
  onPdf?: (() => void) | undefined;
  onPrint?: (() => void) | undefined;
}) {
  const { width, height } = sheetSize(sheet);
  const m = sheet.margins;
  return (
    <div
      role="toolbar"
      aria-label="Layout"
      className="absolute left-1/2 top-12 z-40 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md border border-border bg-popover/80 px-2 py-1 text-[11px] text-muted-foreground shadow backdrop-blur"
    >
      <span className="font-semibold text-foreground">
        {kind} {name}
      </span>
      <span>
        {sheet.format === "custom" ? "Frei" : PAPER_FORMAT_LABELS[sheet.format]}{" "}
        {sheet.orientation === "landscape" ? "quer" : "hoch"} · {text(width)} × {text(height)} mm ·
        Ränder {text(m.top)}/{text(m.right)}/{text(m.bottom)}/{text(m.left)} mm
      </span>
      {master !== undefined && (
        <span>{master ? `folgt Masterlayout „${master}“` : "ohne Masterlayout"}</span>
      )}
      <button
        type="button"
        className="rounded border bg-background px-2 py-0.5"
        onClick={onSettings}
      >
        Einstellungen …
      </button>
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
