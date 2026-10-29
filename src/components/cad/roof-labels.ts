import type { RoofCut } from "@/domain/elements/roof/geometry";

/** Drawing phase of the roof tool (docs/ROOF_ELEMENT.md, D3). */
export type RoofPhase = "line" | "side" | "outline";

export const ROOF_CUT_LABELS: Record<RoofCut, string> = {
  vertical: "vertikal",
  perpendicular: "rechtwinklig zur Dachfläche",
  horizontal: "horizontal",
};
