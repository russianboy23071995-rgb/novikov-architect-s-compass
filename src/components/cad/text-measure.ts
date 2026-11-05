import { TEXT_FONT_CSS, textLines, type PlanText } from "@/domain/elements/text/model";

let measureContext: CanvasRenderingContext2D | null | undefined;
/** Widest line in letter heights, measured with the real font; estimate without a canvas. */
export function measuredTextWidth(
  text: Pick<PlanText, "content" | "font" | "bold" | "italic">,
): number {
  const lines = textLines(text);
  if (measureContext === undefined)
    measureContext =
      typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  if (!measureContext) return Math.max(...lines.map((l) => l.length), 1) * 0.6;
  measureContext.font = `${text.italic ? "italic " : ""}${text.bold ? "bold " : ""}100px ${TEXT_FONT_CSS[text.font]}`;
  return Math.max(...lines.map((l) => measureContext!.measureText(l).width), 1) / 100;
}
