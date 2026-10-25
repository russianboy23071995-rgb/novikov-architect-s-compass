import type { Project } from "../../domain/project/schema.ts";
import { projectSnapPrimitives } from "./project-references.ts";
import { createPrimitiveSourceIndex } from "../../constraints/snapping/local-source-index.ts";
import { createDerivedCache } from "../../domain/project/derived-cache.ts";
export { completeLocalQuery } from "../../constraints/snapping/local-source-index.ts";

export function createLocalSnapSources(project: Project) {
  return createPrimitiveSourceIndex(projectSnapPrimitives(project));
}
export type LocalSnapSources = ReturnType<typeof createLocalSnapSources>;
const cache = createDerivedCache<Project, LocalSnapSources>();
export function getLocalSnapSources(project: Project): LocalSnapSources {
  let sources = cache.get(project);
  if (!sources) {
    sources = createLocalSnapSources(project);
    cache.set(project, sources);
  }
  return sources;
}
