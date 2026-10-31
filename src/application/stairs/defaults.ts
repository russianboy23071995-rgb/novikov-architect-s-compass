import { STAIR_DEFAULTS, type Stair, type StairAxis } from "../../domain/elements/stair/model.ts";
import type { WallRenovation } from "../../domain/elements/wall/renovation.ts";

/**
 * Every stair setting the tool bar, the settings window and the properties edit (docs/TREPPE.md,
 * user decision 31.10.2026: all stair values steerable in the settings). Riser count and tread
 * are either computed (`auto`) or fixed.
 */
export type StairDefaults = {
  axis: StairAxis;
  width: number;
  riserTarget: number;
  riserCountMode: "auto" | "fixed";
  riserCount: number;
  treadMode: "auto" | "fixed";
  tread: number;
  waist: number;
  ruleSet: Stair["ruleSet"];
  baseOffset: number;
  heightMode: "storey" | "fixed";
  height: number;
  topOffset: number;
  renovation: WallRenovation;
  layerId: string;
};

export function stairToolDefaults(layerId: string): StairDefaults {
  return {
    axis: "center",
    width: STAIR_DEFAULTS.width,
    riserTarget: STAIR_DEFAULTS.riserTarget,
    riserCountMode: "auto",
    riserCount: 16,
    treadMode: "auto",
    tread: 0.28,
    waist: STAIR_DEFAULTS.waist,
    ruleSet: STAIR_DEFAULTS.ruleSet,
    baseOffset: 0,
    heightMode: "storey",
    height: 2.8,
    topOffset: 0,
    renovation: "new",
    layerId,
  };
}

/** Stored stair values of the settings (everything except start, direction and id). */
export function stairValues(d: StairDefaults): Omit<Stair, "id" | "start" | "direction" | "shape"> {
  return {
    layerId: d.layerId,
    axis: d.axis,
    width: d.width,
    riserTarget: d.riserTarget,
    ...(d.riserCountMode === "fixed" ? { riserCount: Math.round(d.riserCount) } : {}),
    ...(d.treadMode === "fixed" ? { tread: d.tread } : {}),
    waist: d.waist,
    ruleSet: d.ruleSet,
    baseOffset: d.baseOffset,
    ...(d.heightMode === "fixed"
      ? { height: d.height }
      : { topBinding: { kind: "storey" as const, topOffset: d.topOffset } }),
    renovation: d.renovation,
  };
}

/** Settings view of an existing stair; unset fixed values keep sensible field contents. */
export function stairSettings(stair: Stair): StairDefaults {
  return {
    axis: stair.axis ?? "center",
    width: stair.width,
    riserTarget: stair.riserTarget,
    riserCountMode: stair.riserCount === undefined ? "auto" : "fixed",
    riserCount: stair.riserCount ?? 16,
    treadMode: stair.tread === undefined ? "auto" : "fixed",
    tread: stair.tread ?? 0.28,
    waist: stair.waist,
    ruleSet: stair.ruleSet,
    baseOffset: stair.baseOffset,
    heightMode: stair.topBinding ? "storey" : "fixed",
    height: stair.height ?? 2.8,
    topOffset: stair.topBinding?.topOffset ?? 0,
    renovation: stair.renovation ?? "existing",
    layerId: stair.layerId,
  };
}
