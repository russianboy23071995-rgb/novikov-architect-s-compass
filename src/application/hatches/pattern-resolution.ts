import {
  samePattern,
  validatePatternRevisions,
  type PatternRevision,
} from "../../domain/elements/hatch/revision.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import { assertProjectFileSize } from "../../interop/project-file/size.ts";
/** Explicit revision context: schema 11 has no persisted revisions. UI integration must migrate that context first. */
export function resolveHatchPatternRevisions(
  base: Project,
  current: Project,
  embedded: readonly PatternRevision[],
  available: readonly PatternRevision[],
) {
  if (base !== current) throw new Error("Projekt wurde geändert. Musterabgleich erneut beginnen.");
  const project = validateProject(current),
    records = validatePatternRevisions(embedded),
    catalog = new Map(validatePatternRevisions(available).map((r) => [r.definition.id, r]));
  if (
    records.length !== project.hatchPatterns.length ||
    records.some(
      (r) =>
        !project.hatchPatterns.some(
          (p) => p.id === r.definition.id && samePattern(p, r.definition),
        ),
    )
  )
    throw new Error("Musterversionen passen nicht zum Projekt.");
  const updatedIds: string[] = [],
    conflicts: string[] = [],
    missingIds: string[] = [];
  const resolved = records.map((r) => {
    const candidate = catalog.get(r.definition.id);
    if (!candidate) {
      missingIds.push(r.definition.id);
      return r;
    }
    if (candidate.revision < r.revision) return r;
    if (candidate.revision === r.revision) {
      if (!samePattern(candidate.definition, r.definition)) conflicts.push(r.definition.id);
      return r;
    }
    updatedIds.push(r.definition.id);
    return candidate;
  });
  const next = updatedIds.length
    ? validateProject({ ...project, hatchPatterns: resolved.map((r) => r.definition) })
    : current;
  assertProjectFileSize(JSON.stringify(next));
  return { project: next, records: resolved, updatedIds, conflicts, missingIds };
}
