import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../selection/target.ts";

/** One typed selection lookup for all current layer property consumers. */
export function selectedLayerElement(project: Project, target: ElementTarget | null) {
  if (!target) return undefined;
  const elements =
    target.kind === "reference"
      ? storeyOf(project).references
      : target.kind === "wall"
        ? storeyOf(project).walls
        : target.kind === "window"
          ? storeyOf(project).windows
          : target.kind === "hatch"
            ? storeyOf(project).hatches
            : storeyOf(project).lines;
  return elements?.find((element) => element.id === target.id);
}
