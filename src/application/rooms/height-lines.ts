import {
  MAX_ROOM_HEIGHT_LINE,
  MAX_ROOM_HEIGHT_LINES,
  MIN_ROOM_HEIGHT_LINE,
  ROOM_HEIGHT_LINES,
} from "../../domain/elements/room/heights.ts";

/** Height lines as German text: "1,00; 2,00". */
export function formatHeightLines(lines: readonly number[]): string {
  return lines
    .map((h) => h.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 3 }))
    .join("; ");
}

/** Reads "1; 2,2" or "1 2.2" (separators ; or spaces; decimal comma or point), sorted and
 * checked like the schema (R3). Returns the lines or a readable German refusal. */
export function parseHeightLines(text: string): number[] | string {
  const parts = text
    .split(/[;\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const values = parts.map((part) => Number(part.replace(",", ".")));
  if (values.some((v) => !Number.isFinite(v)))
    return "Höhenlinien als Zahlen in Metern angeben, z. B. 1,00; 2,00.";
  if (values.length > MAX_ROOM_HEIGHT_LINES)
    return `Höchstens ${MAX_ROOM_HEIGHT_LINES} Höhenlinien.`;
  if (values.some((v) => v < MIN_ROOM_HEIGHT_LINE || v > MAX_ROOM_HEIGHT_LINE))
    return `Höhenlinien zwischen ${formatHeightLines([MIN_ROOM_HEIGHT_LINE])} und ${formatHeightLines([MAX_ROOM_HEIGHT_LINE])} m.`;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.some((v, i) => i > 0 && v === sorted[i - 1]))
    return "Jede Höhenlinie nur einmal angeben.";
  return sorted;
}

/** True when the lines are the defaults 1,00/2,00 m (then the room stores none). */
export function isDefaultHeightLines(lines: readonly number[]): boolean {
  return (
    lines.length === ROOM_HEIGHT_LINES.length && lines.every((h, i) => h === ROOM_HEIGHT_LINES[i])
  );
}
