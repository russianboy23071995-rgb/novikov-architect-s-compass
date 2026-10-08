import type { Project } from "../../domain/project/schema.ts";
import type { Hatch } from "../../domain/elements/hatch/model.ts";
import type { ElementTarget } from "../selection/target.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";

export type HatchDefaults = Pick<Hatch, "fill" | "background" | "contour" | "layerId">;
export type WindowDefaults = Pick<
  Project["storey"]["windows"][number],
  "width" | "height" | "sillHeight" | "layerId"
>;
export type LineDefaults = Pick<
  NonNullable<Project["storey"]["lines"]>[number],
  "color" | "penWidth" | "style" | "layerId"
>;
export type ToolDefaults =
  | { tool: "hatch"; values: HatchDefaults }
  | { tool: "window"; values: WindowDefaults }
  | { tool: "line"; values: LineDefaults };

/** Read-only capability boundary. Add supported element adapters here, not gesture copies. */
export function pickupToolDefaults(
  project: Project,
  visibility: LayerVisibilityPolicy,
  target: ElementTarget,
): ToolDefaults | null {
  if (!visibility.evaluate(project, visibility.context, target.id).eligible) return null;
  if (target.kind === "line") {
    const source = project.storey.lines?.find((item) => item.id === target.id);
    if (!source) return null;
    return {
      tool: "line",
      values: {
        color: source.color,
        penWidth: source.penWidth,
        style: source.style,
        layerId: source.layerId,
      },
    };
  }
  if (target.kind === "window") {
    const source = project.storey.windows.find((item) => item.id === target.id);
    if (!source) return null;
    return {
      tool: "window",
      values: {
        width: source.width,
        height: source.height,
        sillHeight: source.sillHeight,
        layerId: source.layerId,
      },
    };
  }
  if (target.kind !== "hatch") return null;
  const source = project.storey.hatches.find((item) => item.id === target.id);
  if (!source) return null;
  return {
    tool: "hatch",
    values: {
      fill: { ...source.fill },
      background: { ...source.background },
      contour: { ...source.contour },
      layerId: source.layerId,
    },
  };
}
