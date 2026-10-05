import type { Project } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../selection/target.ts";

/** One typed selection lookup for all current layer property consumers. */
export function selectedLayerElement(project: Project, target: ElementTarget | null) {
  if (!target) return undefined;
  const elements =
    target.kind === "wall"
      ? project.storey.walls
      : target.kind === "window"
        ? project.storey.windows
        : target.kind === "hatch"
          ? project.storey.hatches
          : project.storey.lines;
  return elements?.find((element) => element.id === target.id);
}
