import type { Project } from "../../domain/project/schema.ts";
import type { EditTarget } from "../../lib/bim/direct-edit.ts";

/** One typed selection lookup for all current layer property consumers. */
export function selectedLayerElement(project: Project, target: EditTarget | null) {
  if (!target) return undefined;
  const elements =
    target.kind === "wall"
      ? project.storey.walls
      : target.kind === "window"
        ? project.storey.windows
        : project.storey.lines;
  return elements?.find((element) => element.id === target.id);
}
