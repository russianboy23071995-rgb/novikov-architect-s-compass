import { defaultPenSet, penLibrarySchema, penSetSchema } from "../../domain/pens/model.ts";
import type { PenLibrary, PenSet } from "../../domain/pens/model.ts";
import { validateProject } from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
export interface PenStorage {
  read(): string | null;
  write(value: string): void;
}
export function loadPens(storage: PenStorage): PenLibrary {
  const raw = storage.read();
  return penLibrarySchema.parse(
    raw === null ? { version: 1, sets: [defaultPenSet] } : JSON.parse(raw),
  );
}
/** Compare before publication; failed validation/storage never changes the caller's state. */
export function savePenSet(storage: PenStorage, base: PenLibrary, set: PenSet): PenLibrary {
  if (JSON.stringify(loadPens(storage)) !== JSON.stringify(base))
    throw new Error("Stiftesets wurden andernorts geändert. Fenster erneut öffnen.");
  const valid = penSetSchema.parse(set);
  const next = penLibrarySchema.parse({
    version: 1,
    sets: base.sets.some((s) => s.id === valid.id)
      ? base.sets.map((s) => (s.id === valid.id ? valid : s))
      : [...base.sets, valid],
  });
  storage.write(JSON.stringify(next));
  return next;
}
/** Project owns a portable palette snapshot; element colors remain independent values. */
export function assignPenSet(base: Project, current: Project, set: PenSet): Project {
  if (base !== current) throw new Error("Das Projekt wurde geändert. Stifteset erneut wählen.");
  const penSet = penSetSchema.parse(set);
  if (JSON.stringify(current.penSet) === JSON.stringify(penSet)) return current;
  return validateProject({ ...current, penSet });
}
