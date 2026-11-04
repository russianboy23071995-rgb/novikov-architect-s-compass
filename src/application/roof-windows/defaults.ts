import {
  ROOF_WINDOW_DEFAULTS,
  type RoofWindow,
  type RoofWindowLowerReveal,
  type RoofWindowUpperReveal,
} from "../../domain/elements/roof/window.ts";
import type { WallRenovation } from "../../domain/elements/wall/renovation.ts";

/**
 * Roof window settings as the tool bar, the settings window and the element properties edit
 * them (docs/DACHFLAECHENFENSTER.md, D2).
 */
export type RoofWindowDefaults = {
  width: number;
  length: number;
  frame: number;
  upperReveal: RoofWindowUpperReveal;
  lowerReveal: RoofWindowLowerReveal;
  renovation: WallRenovation;
  layerId: string;
};

/** Tool defaults: 78 × 118 cm, frame 6 cm, reveals square, Neubau like new walls. */
export function roofWindowToolDefaults(layerId: string): RoofWindowDefaults {
  return {
    ...ROOF_WINDOW_DEFAULTS,
    upperReveal: "square",
    lowerReveal: "square",
    renovation: "new",
    layerId,
  };
}

/** The stored values of the settings (all but id, roof and place). */
export function roofWindowValues(
  d: RoofWindowDefaults,
): Omit<RoofWindow, "id" | "roofId" | "along" | "slope"> {
  return {
    layerId: d.layerId,
    width: d.width,
    length: d.length,
    frame: d.frame,
    upperReveal: d.upperReveal,
    lowerReveal: d.lowerReveal,
    renovation: d.renovation,
  };
}

/** Settings view of an existing roof window. */
export function roofWindowSettings(window: RoofWindow): RoofWindowDefaults {
  return {
    width: window.width,
    length: window.length,
    frame: window.frame,
    upperReveal: window.upperReveal ?? "square",
    lowerReveal: window.lowerReveal ?? "square",
    renovation: window.renovation ?? "existing",
    layerId: window.layerId,
  };
}
