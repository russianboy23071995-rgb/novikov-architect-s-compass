import { validateHatchPattern, type HatchPatternDefinition } from "./pattern.ts";
export type PatternRevision = { definition: HatchPatternDefinition; revision: number };
export function validatePatternRevisions(records: readonly PatternRevision[]): PatternRevision[] {
  if (!Array.isArray(records) || records.length > 100)
    throw new Error("Maximal 100 Musterversionen.");
  const owned = records.map((record) => {
    if (!record || !Number.isSafeInteger(record.revision) || record.revision < 1)
      throw new Error("Ungültige Musterrevision.");
    return { definition: validateHatchPattern(record.definition), revision: record.revision };
  });
  if (new Set(owned.map((r) => r.definition.id)).size !== owned.length)
    throw new Error("Doppelte Muster-ID.");
  return owned;
}
export function samePattern(a: HatchPatternDefinition, b: HatchPatternDefinition): boolean {
  return JSON.stringify(validateHatchPattern(a)) === JSON.stringify(validateHatchPattern(b));
}
