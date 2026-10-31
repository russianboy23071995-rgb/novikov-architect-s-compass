import type { PlanText } from "../../domain/elements/text/model.ts";
import { columnSettings, type ColumnDefaults } from "../columns/defaults.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { patternSize } from "../hatches/pattern-size.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { Hatch } from "../../domain/elements/hatch/model.ts";
import type { ElementTarget } from "../selection/target.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";

export type HatchDefaults = Pick<Hatch, "fill" | "background" | "contour" | "layerId"> & {
  patternRotation?: number | undefined;
  patternSize?: import("../../domain/elements/hatch/model.ts").HatchPatternSize | undefined;
  patternDefinition?:
    import("../../domain/elements/hatch/pattern.ts").HatchPatternDefinition | null | undefined;
};
export type WindowDefaults = Pick<
  Project["storeys"][number]["windows"][number],
  "width" | "height" | "sillHeight" | "layerId"
>;
export type LineDefaults = Pick<
  NonNullable<Project["storeys"][number]["lines"]>[number],
  "color" | "penWidth" | "style" | "layerId" | "pattern" | "repeatLength"
>;
export type WallDefaults = Pick<
  Project["storeys"][number]["walls"][number],
  "thickness" | "height" | "bodyOffset" | "layerId" | "renovation"
>;
export type ToolDefaults =
  | { tool: "hatch"; values: HatchDefaults }
  | { tool: "window"; values: WindowDefaults }
  | { tool: "line"; values: LineDefaults }
  | { tool: "wall"; values: WallDefaults }
  | { tool: "column"; values: ColumnDefaults }
  | { tool: "text"; values: Omit<PlanText, "id" | "position" | "content"> };

/** Read-only capability boundary. Add supported element adapters here, not gesture copies. */
export function pickupToolDefaults(
  project: Project,
  visibility: LayerVisibilityPolicy,
  target: ElementTarget,
): ToolDefaults | null {
  if (!visibility.evaluate(project, visibility.context, target.id).eligible) return null;
  if (target.kind === "wall") {
    const source = storeyOf(project).walls.find((item) => item.id === target.id);
    if (!source) return null;
    return {
      tool: "wall",
      values: {
        thickness: source.thickness,
        height: source.height,
        bodyOffset: source.bodyOffset,
        layerId: source.layerId,
        renovation: source.renovation ?? "existing",
      },
    };
  }
  if (target.kind === "line") {
    const source = storeyOf(project).lines?.find((item) => item.id === target.id);
    if (!source) return null;
    return {
      tool: "line",
      values: {
        color: source.color,
        penWidth: source.penWidth,
        style: source.style,
        ...(source.pattern
          ? { pattern: structuredClone(source.pattern), repeatLength: source.repeatLength }
          : {}),
        layerId: source.layerId,
      },
    };
  }
  if (target.kind === "window") {
    const source = storeyOf(project).windows.find((item) => item.id === target.id);
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
  // Columns hand over every setting, size and height rule included (docs/STUETZEN.md, P3).
  if (target.kind === "column") {
    const source = storeyOf(project).columns?.find((item) => item.id === target.id);
    return source ? { tool: "column", values: columnSettings(source) } : null;
  }
  // Texts hand over every setting except position and content (docs/TEXT.md).
  if (target.kind === "text") {
    const source = storeyOf(project).texts?.find((item) => item.id === target.id);
    if (!source) return null;
    const { id: _id, position: _position, content: _content, ...values } = source;
    return { tool: "text", values: structuredClone(values) };
  }
  if (target.kind !== "hatch") return null;
  const source = storeyOf(project).hatches.find((item) => item.id === target.id);
  if (!source) return null;
  return {
    tool: "hatch",
    values: {
      ...(source.pattern?.rotation === undefined
        ? {}
        : { patternRotation: source.pattern.rotation }),
      ...(source.pattern ? { patternSize: patternSize(source.pattern) } : {}),
      patternDefinition: source.pattern
        ? structuredClone(project.hatchPatterns.find((p) => p.id === source.pattern!.patternId)!)
        : null,
      fill: { ...source.fill },
      background: { ...source.background },
      contour: { ...source.contour },
      layerId: source.layerId,
    },
  };
}
