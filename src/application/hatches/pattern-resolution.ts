import {
  samePattern,
  validatePatternRevisions,
  type PatternRevision,
} from "../../domain/elements/hatch/revision.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import { assertProjectFileSize } from "../../interop/project-file/size.ts";
/** Compatibility action for callers with an explicit, validated revision context. */
export function resolveHatchPatternRevisions(
  base: Project,
  current: Project,
  embedded: readonly PatternRevision[],
  available: readonly PatternRevision[],
) {
  const result = resolve(base, current, validatePatternRevisions(embedded), available);
  return { ...result, records: result.records as PatternRevision[] };
}

/** File opening and project History share the same resolution, without writing the library. */
export function resolveProjectHatchPatterns(
  base: Project,
  current: Project,
  available: readonly PatternRevision[],
) {
  return resolve(
    base,
    current,
    current.hatchPatterns.map((definition) => ({
      definition,
      revision: definition.revision,
    })),
    available,
  );
}

function resolve(
  base: Project,
  current: Project,
  embedded: readonly { definition: PatternRevision["definition"]; revision?: number | undefined }[],
  available: readonly PatternRevision[],
) {
  if (base !== current) throw new Error("Projekt wurde geändert. Musterabgleich erneut beginnen.");
  const project = validateProject(current),
    records = embedded,
    catalog = new Map(validatePatternRevisions(available).map((r) => [r.definition.id, r]));
  if (
    records.length !== project.hatchPatterns.length ||
    records.some(
      (r) =>
        !project.hatchPatterns.some(
          (p) =>
            p.id === r.definition.id &&
            samePattern(p, r.definition) &&
            (p.revision === undefined || p.revision === r.revision),
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
    if (r.revision !== undefined && candidate.revision < r.revision) return r;
    if (candidate.revision === r.revision) {
      if (!samePattern(candidate.definition, r.definition)) conflicts.push(r.definition.id);
      return r;
    }
    updatedIds.push(r.definition.id);
    return candidate;
  });
  const next = updatedIds.length
    ? validateProject({
        ...project,
        hatchPatterns: resolved.map((r) => ({
          ...r.definition,
          ...(r.revision === undefined ? {} : { revision: r.revision }),
        })),
      })
    : current;
  assertProjectFileSize(JSON.stringify(next));
  return { project: next, records: resolved, updatedIds, conflicts, missingIds };
}
