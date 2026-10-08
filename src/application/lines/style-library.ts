export type LineStyleDefinition = { id: string; name: string; dashes: readonly number[] };
export const builtInLineStyles: readonly LineStyleDefinition[] = [
  { id: "solid", name: "Durchgezogen", dashes: [] },
  { id: "dashed", name: "Gestrichelt", dashes: [8, 5] },
  { id: "break", name: "Bruchlinie", dashes: [] },
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
    !Array.isArray(style.dashes) ||
    style.dashes.length < 2 ||
    style.dashes.length > 32 ||
    style.dashes.length % 2 ||
    !style.dashes.every((v) => Number.isFinite(v) && v > 0 && v <= 1000)
  )
    throw new Error("Name und 2–32 positive Strich-/Lückenwerte benötigt (maximal 1000 je Wert).");
  if (builtInLineStyles.some((b) => b.id === style.id))
    throw new Error("Standardlinienarten können nicht geändert werden.");
  return { id: style.id, name: style.name.trim(), dashes: [...style.dashes] };
}
function validateLibrary(styles: readonly LineStyleDefinition[]): LineStyleDefinition[] {
  if (!Array.isArray(styles) || styles.length > 100)
    throw new Error("Maximal 100 eigene Linienarten.");
  const result = styles.map(validateLineStyle);
  if (new Set(result.map((s) => s.id)).size !== result.length)
    throw new Error("Doppelte Linienart-ID.");
  return result;
}
export function loadLineStyles(storage: LineStyleStorage): LineStyleDefinition[] {
  const raw = storage.read();
  if (raw === null) return [];
  if (raw.length > 100000) throw new Error("Linienbibliothek ist zu groß.");
  const data = JSON.parse(raw);
  if (!data || data.version !== 1) throw new Error("Unbekannte Linienbibliothek-Version.");
  return validateLibrary(data.styles);
}
export function saveLineStyle(
  storage: LineStyleStorage,
  styles: readonly LineStyleDefinition[],
  style: LineStyleDefinition,
): LineStyleDefinition[] {
  const owned = validateLineStyle(style);
  const next = validateLibrary([...styles.filter((s) => s.id !== owned.id), owned]);
  storage.write(JSON.stringify({ version: 1, styles: next }));
  return next;
}
export function deleteLineStyle(
  storage: LineStyleStorage,
  styles: readonly LineStyleDefinition[],
  id: string,
): LineStyleDefinition[] {
  if (builtInLineStyles.some((s) => s.id === id))
    throw new Error("Standardlinienarten können nicht gelöscht werden.");
  if (!styles.some((s) => s.id === id)) throw new Error("Linienart existiert nicht mehr.");
  const next = validateLibrary(styles.filter((s) => s.id !== id));
  storage.write(JSON.stringify({ version: 1, styles: next }));
  return next;
}
