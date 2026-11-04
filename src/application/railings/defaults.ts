import {
  RAILING_DEFAULTS,
  type Railing,
  type RailingInfill,
} from "../../domain/elements/railing/model.ts";
import type { WallRenovation } from "../../domain/elements/wall/renovation.ts";

/**
 * Railing settings as the tool bar, the settings window and the element properties edit them
 * (docs/GELAENDER.md, G2).
 */
export type RailingDefaults = {
  height: number;
  baseOffset: number;
  postSpacing: number;
  infill: RailingInfill;
  renovation: WallRenovation;
  layerId: string;
};

/** Tool defaults: 1,00 m, posts at most 1,20 m apart, bars, Neubau like new walls. */
export function railingToolDefaults(layerId: string): RailingDefaults {
  return { ...RAILING_DEFAULTS, renovation: "new", layerId };
}

/** The stored railing values of the settings (all but id and line). */
export function railingValues(d: RailingDefaults): Omit<Railing, "id" | "points"> {
  return {
    layerId: d.layerId,
    height: d.height,
    baseOffset: d.baseOffset,
    postSpacing: d.postSpacing,
    infill: d.infill,
    renovation: d.renovation,
  };
}

/** Settings view of an existing railing. */
export function railingSettings(railing: Railing): RailingDefaults {
  return {
    height: railing.height,
    baseOffset: railing.baseOffset,
    postSpacing: railing.postSpacing,
    infill: railing.infill,
    renovation: railing.renovation ?? "existing",
    layerId: railing.layerId,
  };
}
