import type { Project } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../selection/target.ts";

/** One typed selection lookup for all current layer property consumers. */
export function selectedLayerElement(project: Project, target: ElementTarget | null) {
  if (!target) return undefined;
  for (const storey of project.storeys) {
    const elements =
      target.kind === "reference"
        ? storey.references
        : target.kind === "wall"
          ? storey.walls
          : target.kind === "window"
            ? storey.windows
            : target.kind === "hatch"
              ? storey.hatches
              : storey.lines;
    const found = elements?.find((element) => element.id === target.id);
    if (found) return found;
  }
  return undefined;
}
