import type { Point2 } from "../../geometry/primitives/point.ts";
export type StyleSegment = { start: Point2; end: Point2 };
export type LineStyleDefinition = {
  id: string;
  name: string;
  dashes: readonly number[];
  color?: string;
  period?: number;
  segments?: readonly StyleSegment[];
};
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
export function validateLineStyle(style: LineStyleDefinition): LineStyleDefinition {
  if (
    !style ||
    typeof style.id !== "string" ||
    !style.id.trim() ||
    typeof style.name !== "string" ||
    !style.name.trim() ||
    style.name.trim().length > 80 ||
    !Array.isArray(style.dashes)
  )
    throw new Error("Linienart benötigt ID und Namen (maximal 80 Zeichen).");
  const color = style.color ?? "#334155";
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error("Ungültige Linienfarbe.");
  let period = style.period;
  let segments = style.segments;
  if (!segments) {
    if (
      style.dashes.length < 2 ||
      style.dashes.length > 32 ||
      style.dashes.length % 2 ||
      !style.dashes.every((v) => Number.isFinite(v) && v > 0 && v <= 1000)
    )
      throw new Error("Ungültiges Strich-/Lückenmuster.");
    period = style.dashes.reduce((sum, v) => sum + v, 0);
    let x = 0;
    const derived: StyleSegment[] = [];
    for (let i = 0; i < style.dashes.length; i++) {
      const next = x + style.dashes[i]!;
      if (i % 2 === 0) derived.push({ start: { x, y: 0 }, end: { x: next, y: 0 } });
      x = next;
    }
    segments = derived;
  }
  if (
    !Number.isFinite(period) ||
    period! <= 0 ||
    period! > 32000 ||
    !Array.isArray(segments) ||
    segments.length < 1 ||
    segments.length > 128
  )
    throw new Error(
      "Eine Linienstruktur mit 1–128 Abschnitten und positiver Wiederholungslänge benötigt.",
    );
  for (const line of segments) {
    if (!line?.start || !line?.end) throw new Error("Ungültiger Linienabschnitt.");
    for (const p of [line.start, line.end])
      if (
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        p.x < 0 ||
        p.x > period! ||
        Math.abs(p.y) > 10
      )
        throw new Error("Linienstruktur außerhalb des Zeichenfeldes.");
    if (Math.hypot(line.end.x - line.start.x, line.end.y - line.start.y) < 1e-8)
      throw new Error("Nullabschnitt ist nicht erlaubt.");
  }
  return {
    id: style.id,
    name: style.name.trim(),
    dashes: [...style.dashes],
    color,
    period: period!,
    segments: segments.map((line) => ({ start: { ...line.start }, end: { ...line.end } })),
  };
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
