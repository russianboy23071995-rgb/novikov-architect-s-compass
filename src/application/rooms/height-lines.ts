import {
  clearHeightLine,
  MAX_ROOM_HEIGHT_LINES,
  type HeightLine,
} from "../../domain/elements/room/height-line.ts";

/** Metres as German text with two decimals: 2,30. */
export function formatMetres(value: number): string {
  return value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

/** Short plan label of a line: "2,30", with the references when they are not the defaults
 * ("2,30 Dachhaut", "2,30 Rohfußb."). */
export function heightLineLabel(line: Pick<HeightLine, "height" | "lower" | "upper">): string {
  return [
    formatMetres(line.height),
    line.upper === "outerSkin" ? "Dachhaut" : "",
    line.lower === "rawFloor" ? "Rohfußb." : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Next free id h1, h2 … in a list. */
export function nextHeightLineId(lines: readonly Pick<HeightLine, "id">[]): string {
  const used = new Set(lines.map((l) => l.id));
  let n = 1;
  while (used.has(`h${n}`)) n++;
  return `h${n}`;
}

/** Adds a line 0,50 m above the highest one (default look, clear height); refused at the limit. */
export function withAddedHeightLine(lines: readonly HeightLine[]): HeightLine[] {
  if (lines.length >= MAX_ROOM_HEIGHT_LINES)
    throw new Error(`Höchstens ${MAX_ROOM_HEIGHT_LINES} Höhenlinien je Raum.`);
  const highest = Math.max(0.5, ...lines.map((l) => l.height));
  return [...lines, clearHeightLine(nextHeightLineId(lines), Math.min(10, highest + 0.5))];
}

/** Line for summaries: "2,30 m (bis Dachhaut)", "1,00 m (ab Rohfußboden)". */
export function heightLineText(line: Pick<HeightLine, "height" | "lower" | "upper">): string {
  const refs = [
    line.upper === "outerSkin" ? "bis Dachhaut" : "",
    line.lower === "rawFloor" ? "ab Rohfußboden" : "",
  ].filter(Boolean);
  return `${formatMetres(line.height)} m${refs.length ? ` (${refs.join(", ")})` : ""}`;
}
