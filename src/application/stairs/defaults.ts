import {
  STAIR_DEFAULTS,
  type Stair,
  type StairAxis,
  type StairShape,
} from "../../domain/elements/stair/model.ts";
import type { WallRenovation } from "../../domain/elements/wall/renovation.ts";

/**
 * Every stair setting the tool bar, the settings window and the properties edit (docs/TREPPE.md,
 * user decision 31.10.2026: all stair values steerable in the settings). Riser count and tread
 * are either computed (`auto`) or fixed.
 */
export type StairDefaults = {
  shape: StairShape;
  /** L and U (docs/TREPPE.md, TR3): the third click chooses the side; this is the default. */
  turn: "left" | "right";
  firstRisersMode: "auto" | "fixed";
  firstRisers: number;
  landingMode: "auto" | "fixed";
  landingDepth: number;
  eye: number;
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
    shape: "straight",
    turn: "left",
    firstRisersMode: "auto",
    firstRisers: 8,
    landingMode: "auto",
    landingDepth: STAIR_DEFAULTS.width,
    eye: STAIR_DEFAULTS.eye,
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

/** Stored stair values of the settings (everything except start, direction and id). Shape
 * values of L and U are stored only for those shapes. */
export function stairValues(d: StairDefaults): Omit<Stair, "id" | "start" | "direction"> {
  const turning = d.shape !== "straight";
  return {
    shape: d.shape,
    ...(turning ? { turn: d.turn } : {}),
    ...(turning && d.firstRisersMode === "fixed" ? { firstRisers: Math.round(d.firstRisers) } : {}),
    ...(turning && d.landingMode === "fixed" ? { landingDepth: d.landingDepth } : {}),
    ...(d.shape === "u" ? { eye: d.eye } : {}),
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
    shape: stair.shape,
    turn: stair.turn ?? "left",
    firstRisersMode: stair.firstRisers === undefined ? "auto" : "fixed",
    firstRisers: stair.firstRisers ?? 8,
    landingMode: stair.landingDepth === undefined ? "auto" : "fixed",
    landingDepth: stair.landingDepth ?? stair.width,
    eye: stair.eye ?? STAIR_DEFAULTS.eye,
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
