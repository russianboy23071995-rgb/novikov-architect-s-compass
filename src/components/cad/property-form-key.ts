import type { Project } from "../../domain/project/schema.ts";
import type { Selection } from "./bim-view.ts";

// Project snapshots are immutable. Weak keys do not retain history or embedded assets.
const revisions = new WeakMap<Project, number>();
let nextRevision = 0;
export function propertyFormKey(project: Project, selection: Selection): string {
  let revision = revisions.get(project);
  if (revision === undefined) {
    revision = ++nextRevision;
    revisions.set(project, revision);
  }
  return `${revision}:${selection?.kind ?? "none"}:${selection?.id ?? ""}`;
}
