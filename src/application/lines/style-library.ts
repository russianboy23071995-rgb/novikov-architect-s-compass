import { validateLineStyle } from "../../domain/elements/line/style.ts";
import type { LineStyleDefinition } from "../../domain/elements/line/style.ts";
export { validateLineStyle } from "../../domain/elements/line/style.ts";
export type { LineStyleDefinition, StyleSegment } from "../../domain/elements/line/style.ts";
export const builtInLineStyles: readonly LineStyleDefinition[] = [
  {
    id: "solid",
    name: "Durchgezogen",
    dashes: [],
    color: "#334155",
    period: 20,
    segments: [{ start: { x: 0, y: 0 }, end: { x: 20, y: 0 } }],
  },
  {
    id: "dashed",
    name: "Gestrichelt",
    dashes: [8, 5],
    color: "#334155",
    period: 13,
    segments: [{ start: { x: 0, y: 0 }, end: { x: 8, y: 0 } }],
  },
  {
    id: "break",
    name: "Bruchlinie",
    dashes: [],
    color: "#334155",
    period: 24,
    segments: [
      { start: { x: 0, y: 0 }, end: { x: 6, y: 0 } },
      { start: { x: 6, y: 0 }, end: { x: 9, y: -5 } },
      { start: { x: 9, y: -5 }, end: { x: 15, y: 5 } },
      { start: { x: 15, y: 5 }, end: { x: 18, y: 0 } },
      { start: { x: 18, y: 0 }, end: { x: 24, y: 0 } },
    ],
  },
];
export interface LineStyleStorage {
  read(): string | null;
  write(value: string): void;
}
function validateLibrary(styles: readonly LineStyleDefinition[]): LineStyleDefinition[] {
  if (!Array.isArray(styles) || styles.length > 103) throw new Error("Maximal 103 Linienarten.");
  const result = styles.map(validateLineStyle);
  if (new Set(result.map((s) => s.id)).size !== result.length)
    throw new Error("Doppelte Linienart-ID.");
  return result;
}
export function loadLineStyles(storage: LineStyleStorage): LineStyleDefinition[] {
  const raw = storage.read();
  if (raw === null) return validateLibrary(builtInLineStyles);
  if (raw.length > 2000000) throw new Error("Linienbibliothek ist zu groß.");
  const data = JSON.parse(raw);
  if (!data || ![1, 2].includes(data.version))
    throw new Error("Unbekannte Linienbibliothek-Version.");
  const styles = validateLibrary(data.styles);
  return data.version === 1
    ? validateLibrary([
        ...builtInLineStyles.filter((b) => !styles.some((s) => s.id === b.id)),
        ...styles,
      ])
    : styles;
}
export function saveLineStyle(
  storage: LineStyleStorage,
  styles: readonly LineStyleDefinition[],
  style: LineStyleDefinition,
): LineStyleDefinition[] {
  const owned = validateLineStyle(style);
  const exists = styles.some((s) => s.id === owned.id);
  const next = validateLibrary(
    exists ? styles.map((s) => (s.id === owned.id ? owned : s)) : [...styles, owned],
  );
  storage.write(
    JSON.stringify({
      version: 2,
      styles: next,
      inventory: loadLineInventory(storage, styles).filter((id) => next.some((s) => s.id === id)),
    }),
  );
  return next;
}
export function deleteLineStyle(
  storage: LineStyleStorage,
  styles: readonly LineStyleDefinition[],
  id: string,
): LineStyleDefinition[] {
  if (!styles.some((s) => s.id === id)) throw new Error("Linienart existiert nicht mehr.");
  const next = validateLibrary(styles.filter((s) => s.id !== id));
  storage.write(
    JSON.stringify({
      version: 2,
      styles: next,
      inventory: loadLineInventory(storage, styles).filter((id) => next.some((s) => s.id === id)),
    }),
  );
  return next;
}

export function validateLineInventory(
  ids: readonly string[],
  styles: readonly LineStyleDefinition[],
): string[] {
  if (
    !Array.isArray(ids) ||
    ids.length > 10 ||
    new Set(ids).size !== ids.length ||
    !ids.every((id) => typeof id === "string" && styles.some((s) => s.id === id))
  )
    throw new Error("Inventar: maximal zehn unterschiedliche vorhandene Linienarten.");
  return [...ids];
}
export function loadLineInventory(
  storage: LineStyleStorage,
  styles: readonly LineStyleDefinition[],
): string[] {
  const raw = storage.read();
  const data = raw === null ? null : JSON.parse(raw);
  const ids =
    data?.inventory ??
    builtInLineStyles.filter((b) => styles.some((s) => s.id === b.id)).map((s) => s.id);
  return validateLineInventory(ids, styles);
}
export function saveLineInventory(
  storage: LineStyleStorage,
  styles: readonly LineStyleDefinition[],
  ids: readonly string[],
): string[] {
  const owned = validateLineInventory(ids, styles);
  storage.write(JSON.stringify({ version: 2, styles: validateLibrary(styles), inventory: owned }));
  return owned;
}
