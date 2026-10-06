import type { Project } from "../../lib/bim/model.ts";
import { projectSnapPrimitives } from "./project-references.ts";
import { createPrimitiveSourceIndex } from "../../constraints/snapping/local-source-index.ts";
export { completeLocalQuery } from "../../constraints/snapping/local-source-index.ts";

export function createLocalSnapSources(project: Project) {
  return createPrimitiveSourceIndex(projectSnapPrimitives(project));
}
export type LocalSnapSources = ReturnType<typeof createLocalSnapSources>;
const cache = new WeakMap<Project, LocalSnapSources>();
export function getLocalSnapSources(project: Project): LocalSnapSources {
  let sources = cache.get(project);
  if (!sources) {
    sources = createLocalSnapSources(project);
    cache.set(project, sources);
  }
  return sources;
}
