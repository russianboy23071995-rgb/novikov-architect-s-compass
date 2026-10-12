import {
  validatePatternRevisions,
  type PatternRevision,
} from "../../domain/elements/hatch/revision.ts";
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
export type PatternLibrary = { clock: number; records: PatternRevision[] };
export function loadPatternLibrary(storage: HatchPatternStorage): PatternLibrary {
  const raw = storage.read();
  if (raw === null) return { clock: 0, records: [] };
  if (raw.length > MAX_LIBRARY_SIZE) throw new Error("Schraffurbibliothek ist zu groß.");
  const data = JSON.parse(raw);
  if (data?.version === 1) {
    const records = validateHatchLibrary(data.patterns).map((definition) => ({
      definition,
      revision: 1,
    }));
    return { clock: records.length ? 1 : 0, records };
  }
  if (data?.version !== 2 || !Number.isSafeInteger(data.clock) || data.clock < 0)
    throw new Error("Unbekannte oder ungültige Schraffurbibliothek-Version.");
  const records = validatePatternRevisions(data.records);
  if (records.some((r) => r.revision > data.clock))
    throw new Error("Musterrevision über Bibliotheksstand.");
  return { clock: data.clock, records };
}
export function writePatternLibrary(storage: HatchPatternStorage, library: PatternLibrary): void {
  const records = validatePatternRevisions(library.records);
  if (
    !Number.isSafeInteger(library.clock) ||
    library.clock < 0 ||
    records.some((r) => r.revision > library.clock)
  )
    throw new Error("Ungültiger Bibliotheksstand.");
  const raw = JSON.stringify({ version: 2, clock: library.clock, records });
  if (raw.length > MAX_LIBRARY_SIZE) throw new Error("Schraffurbibliothek ist zu groß.");
  storage.write(raw);
}
export function loadHatchPatterns(storage: HatchPatternStorage): HatchPatternDefinition[] {
  return loadPatternLibrary(storage).records.map((r) => r.definition);
}
/** Existing creator remains append-only; revision editing uses its own history action. */
export function saveHatchPattern(
  storage: HatchPatternStorage,
  pattern: HatchPatternDefinition,
): HatchPatternDefinition[] {
  const current = loadPatternLibrary(storage);
  const definition = validateHatchPattern(pattern);
  if (current.records.some((r) => r.definition.id === definition.id))
    throw new Error("Doppelte Muster-ID.");
  const clock = current.clock + 1;
  const records = validatePatternRevisions([...current.records, { definition, revision: clock }]);
  writePatternLibrary(storage, { clock, records });
  return records.map((r) => r.definition);
}
