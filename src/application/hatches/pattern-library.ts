import { validateHatchPattern } from "../../domain/elements/hatch/pattern.ts";
import type { HatchPatternDefinition } from "../../domain/elements/hatch/pattern.ts";
export interface HatchPatternStorage {
  read(): string | null;
  write(value: string): void;
}
const MAX_LIBRARY_SIZE = 2_000_000;
export function validateHatchLibrary(
  patterns: readonly HatchPatternDefinition[],
): HatchPatternDefinition[] {
  if (!Array.isArray(patterns) || patterns.length > 100)
    throw new Error("Maximal 100 Schraffurmuster.");
  const owned = patterns.map(validateHatchPattern);
  if (new Set(owned.map((p) => p.id)).size !== owned.length) throw new Error("Doppelte Muster-ID.");
  return owned;
}
export function loadHatchPatterns(storage: HatchPatternStorage): HatchPatternDefinition[] {
  const raw = storage.read();
  if (raw === null) return [];
  if (raw.length > MAX_LIBRARY_SIZE) throw new Error("Schraffurbibliothek ist zu groß.");
  const data = JSON.parse(raw);
  if (!data || data.version !== 1) throw new Error("Unbekannte Schraffurbibliothek-Version.");
  return validateHatchLibrary(data.patterns);
}
/** Append only: changing used definitions belongs to the later synchronization action. */
export function saveHatchPattern(
  storage: HatchPatternStorage,
  pattern: HatchPatternDefinition,
): HatchPatternDefinition[] {
  const current = loadHatchPatterns(storage);
  const next = validateHatchLibrary([...current, pattern]);
  const raw = JSON.stringify({ version: 1, patterns: next });
  if (raw.length > MAX_LIBRARY_SIZE) throw new Error("Schraffurbibliothek ist zu groß.");
  storage.write(raw);
  return next;
}
