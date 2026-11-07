import type { PlanText } from "../../domain/elements/text/model.ts";
import { columnSettings, type ColumnDefaults } from "../columns/defaults.ts";
import { terrainSettings, type TerrainDefaults } from "../terrain/actions.ts";
import { objectSettings, type ObjectToolDefaults } from "../objects/defaults.ts";
import { railingSettings, type RailingDefaults } from "../railings/defaults.ts";
import { roofWindowSettings, type RoofWindowDefaults } from "../roof-windows/defaults.ts";
import { stairSettings, type StairDefaults } from "../stairs/defaults.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { patternSize } from "../hatches/pattern-size.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { Hatch } from "../../domain/elements/hatch/model.ts";
import type { Slab } from "../../domain/elements/slab/model.ts";
import type { Roof } from "../../domain/elements/roof/model.ts";
import { defaultHeightLines, type HeightLine } from "../../domain/elements/room/height-line.ts";
import type { RoomAreaUse } from "../../domain/elements/room/model.ts";
import type { Dimension } from "../../domain/elements/dimension/model.ts";
import type { DoorSettingsDraft } from "../drawing/door-placement.ts";
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
  "thickness" | "height" | "bodyOffset" | "layerId" | "renovation" | "assemblyId"
>;
export type ToolDefaults =
  | { tool: "door"; values: DoorSettingsDraft }
  | { tool: "slab"; values: Pick<Slab, "thickness" | "topOffset" | "layerId"> }
  | { tool: "slabOpening"; values: Record<string, never> }
  | { tool: "terrain"; values: TerrainDefaults }
  | {
      tool: "room";
      values: {
        name: string;
        floorBuildUpEnabled: boolean;
        floorBuildUp: number;
        heightLines: HeightLine[];
        areaUse: RoomAreaUse;
        layerId: string;
      };
    }
  | {
      tool: "roof";
      values: Pick<
        Roof,
        "pitch" | "thickness" | "referenceHeight" | "eaveCut" | "topCut" | "layerId"
      >;
    }
  | {
      tool: "dimension";
      values: Pick<Dimension, "orientation" | "terminator" | "units" | "textSize" | "layerId">;
    }
  | { tool: "hatch"; values: HatchDefaults }
  | { tool: "window"; values: WindowDefaults }
  | { tool: "line"; values: LineDefaults }
  | { tool: "wall"; values: WallDefaults }
  | { tool: "column"; values: ColumnDefaults }
  | { tool: "library"; values: ObjectToolDefaults }
  | { tool: "railing"; values: RailingDefaults }
  | { tool: "roofWindow"; values: RoofWindowDefaults }
  | { tool: "stair"; values: StairDefaults }
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
        ...(source.assemblyId ? { assemblyId: source.assemblyId } : {}),
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
  // Objects hand over catalogue entry, size, turn and status (docs/OBJEKTBIBLIOTHEK.md, M1).
  if (target.kind === "object") {
    const source = storeyOf(project).objects?.find((item) => item.id === target.id);
    return source ? { tool: "library", values: objectSettings(source) } : null;
  }
  // Roof windows hand over size, frame, layer and status, not their place (D3).
  if (target.kind === "roofWindow") {
    const source = storeyOf(project).roofWindows?.find((item) => item.id === target.id);
    return source ? { tool: "roofWindow", values: roofWindowSettings(source) } : null;
  }
  // Railings hand over every setting except their line (docs/GELAENDER.md, G3).
  if (target.kind === "railing") {
    const source = storeyOf(project).railings?.find((item) => item.id === target.id);
    return source ? { tool: "railing", values: railingSettings(source) } : null;
  }
  // Stairs hand over every setting, axis and height rule included (docs/TREPPE.md, TR2).
  if (target.kind === "stair") {
    const source = storeyOf(project).stairs?.find((item) => item.id === target.id);
    return source ? { tool: "stair", values: stairSettings(source) } : null;
  }
  // Texts hand over every setting except position and content (docs/TEXT.md).
  if (target.kind === "text") {
    const source = storeyOf(project).texts?.find((item) => item.id === target.id);
    if (!source) return null;
    const { id: _id, position: _position, content: _content, ...values } = source;
    return { tool: "text", values: structuredClone(values) };
  }
  // Door, slab, opening, roof and dimension hand over everything but their place and outline
  // (docs/ANPASSUNGSLISTE.md, 4).
  if (target.kind === "door") {
    const source = storeyOf(project).doors?.find((item) => item.id === target.id);
    if (!source) return null;
    return {
      tool: "door",
      values: {
        width: String(source.width),
        height: String(source.height),
        zOffset: String(source.zOffset),
        hinge: source.hinge,
        opensTo: source.opensTo,
        layerId: source.layerId,
        insert: source.insert ? structuredClone(source.insert) : null,
      },
    };
  }
  if (target.kind === "slab") {
    const source = storeyOf(project).slabs?.find((item) => item.id === target.id);
    if (!source) return null;
    const { thickness, topOffset, layerId } = source;
    return { tool: "slab", values: { thickness, topOffset, layerId } };
  }
  if (target.kind === "slabOpening") return { tool: "slabOpening", values: {} };
  if (target.kind === "terrain") {
    const source = storeyOf(project).terrains?.find((item) => item.id === target.id);
    return source ? { tool: "terrain", values: terrainSettings(source) } : null;
  }
  if (target.kind === "roof") {
    const source = storeyOf(project).roofs?.find((item) => item.id === target.id);
    if (!source) return null;
    const { pitch, thickness, referenceHeight, eaveCut, topCut, layerId } = source;
    return {
      tool: "roof",
      values: { pitch, thickness, referenceHeight, eaveCut, topCut, layerId },
    };
  }
  if (target.kind === "room") {
    const source = storeyOf(project).rooms?.find((item) => item.id === target.id);
    if (!source) return null;
    return {
      tool: "room",
      values: {
        name: source.name ?? "",
        floorBuildUpEnabled: source.floorBuildUp !== undefined,
        floorBuildUp: source.floorBuildUp ?? 0,
        heightLines: structuredClone(source.heightLines ?? defaultHeightLines()),
        areaUse: source.livingArea?.use ?? "living",
        layerId: source.layerId,
      },
    };
  }
  if (target.kind === "dimension") {
    const source = storeyOf(project).dimensions?.find((item) => item.id === target.id);
    if (!source) return null;
    const { orientation, terminator, units, textSize, layerId } = source;
    return {
      tool: "dimension",
      values: {
        orientation,
        layerId,
        ...(terminator ? { terminator } : {}),
        ...(units ? { units } : {}),
        ...(textSize ? { textSize } : {}),
      },
    };
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
