import type { ScreenInsets } from "../../rendering/viewport/plan-camera.ts";

/**
 * Floating glass palettes over one continuous drawing surface (user decision 31.10.2026,
 * docs/GLAS_PALETTEN.md): tool properties on top, tool rail on the left, navigator on the right.
 * The insets are the part of the stage the palettes cover; drawing fits and view controls stay
 * inside the rest.
 */
export const PALETTE_GAP = 8;
export const PROPERTIES_HEIGHT = 130;
export const NAVIGATOR_WIDTH = { min: 240, max: 560, initial: 320 } as const;

export function clampNavigatorWidth(width: number): number {
  if (!Number.isFinite(width)) return NAVIGATOR_WIDTH.initial;
  return Math.round(Math.max(NAVIGATOR_WIDTH.min, Math.min(NAVIGATOR_WIDTH.max, width)));
}

export function paletteInsets(layout: {
  rail: boolean;
  railCollapsed: boolean;
  navigator: boolean;
  navigatorWidth: number;
}): ScreenInsets {
  const railWidth = layout.railCollapsed ? 48 : 76;
  return {
    left: layout.rail ? PALETTE_GAP * 2 + railWidth : 0,
    top: PALETTE_GAP * 2 + PROPERTIES_HEIGHT,
    right: layout.navigator ? PALETTE_GAP * 2 + clampNavigatorWidth(layout.navigatorWidth) : 0,
    bottom: 0,
  };
}
