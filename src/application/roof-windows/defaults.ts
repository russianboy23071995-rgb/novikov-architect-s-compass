import { ROOF_WINDOW_DEFAULTS, type RoofWindow } from "../../domain/elements/roof/window.ts";
import type { WallRenovation } from "../../domain/elements/wall/renovation.ts";

/**
 * Roof window settings as the tool bar, the settings window and the element properties edit
 * them (docs/DACHFLAECHENFENSTER.md, D2).
 */
export type RoofWindowDefaults = {
  width: number;
  length: number;
  frame: number;
  renovation: WallRenovation;
  layerId: string;
};

/** Tool defaults: 78 × 118 cm, frame 6 cm, Neubau like new walls. */
export function roofWindowToolDefaults(layerId: string): RoofWindowDefaults {
  return { ...ROOF_WINDOW_DEFAULTS, renovation: "new", layerId };
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
    renovation: d.renovation,
  };
}

/** Settings view of an existing roof window. */
export function roofWindowSettings(window: RoofWindow): RoofWindowDefaults {
  return {
    width: window.width,
    length: window.length,
    frame: window.frame,
    renovation: window.renovation ?? "existing",
    layerId: window.layerId,
  };
}
