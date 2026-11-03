import type { Project } from "../../domain/project/schema.ts";
import { createDerivedCache } from "../../domain/project/derived-cache.ts";

// Released with the snapshot by the undo history (docs/performance/EDIT_MEMORY.md); the plan
// scene of a source lives as long as the source.
const sources = createDerivedCache<Project, Map<string, Project>>();

/**
 * The project as a placed drawing sees it (docs/ZEICHNUNG.md, ZW2): the document's storey as
 * working storey. Kept per project so the drawn scene is derived once, not on every render.
 */
export function documentSource(project: Project, storeyId: string): Project {
  let byStorey = sources.get(project);
  if (!byStorey) sources.set(project, (byStorey = new Map()));
  let source = byStorey.get(storeyId);
  if (!source) byStorey.set(storeyId, (source = { ...project, workingStoreyId: storeyId }));
  return source;
}
