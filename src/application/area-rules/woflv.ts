import {
  OUTDOOR_SHARE,
  roomArea,
  type Room,
  type RoomAreaUse,
  type RoomLivingArea,
} from "../../domain/elements/room/model.ts";
import { roomHeightField, type CeilingSource } from "../../domain/elements/room/heights.ts";

/** The rule set a result names (docs/WOHNFLAECHE.md); a change of the rules gets a new version. */
export const WOFLV_RULES = {
  name: "WoFlV vom 25.11.2003 (BGBl. I S. 2346)",
  version: 1,
} as const;

export const AREA_USE_LABELS: Record<RoomAreaUse, string> = {
  living: "Wohnraum",
  unheated: "Unbeheizt, geschlossen (Wintergarten, Schwimmbad)",
  outdoor: "Balkon, Loggia, Dachgarten, Terrasse",
  none: "Keine Wohnfläche (Keller, Garage, Geschäftsraum)",
};

/** The use of a room; a room without data is a living room. */
export const areaUseOf = (value: RoomLivingArea | undefined): RoomAreaUse => value?.use ?? "living";

/** Share of a room with a fixed share (§ 4 Nr. 3 and 4, § 2 Abs. 3); a living room has none. */
export function fixedShare(value: RoomLivingArea | undefined): number | null {
  switch (areaUseOf(value)) {
    case "living":
      return null;
    case "unheated":
      return 0.5;
    case "outdoor":
      return value?.outdoorShare ?? OUTDOOR_SHARE;
    case "none":
      return 0;
  }
}

/** One line of the calculation: an area, the rule behind it and its share. */
export type LivingAreaStep = { label: string; rule: string; area: number; share: number };
export type RoomLivingResult = {
  use: RoomAreaUse;
  grossArea: number;
  steps: LivingAreaStep[];
  /** Exact sum of the steps; rounding is left to whoever shows it. */
  livingArea: number;
  notes: string[];
};

const FULL_HEIGHT = 2;
const HALF_HEIGHT = 1;
const percent = (share: number) => `${(share * 100).toLocaleString("de-DE")} %`;

function fixedStep(use: RoomAreaUse, area: number, share: number): LivingAreaStep {
  if (use === "unheated")
    return { label: "Unbeheizter geschlossener Raum", rule: "§ 4 Nr. 3", area, share };
  if (use === "outdoor")
    return { label: `Balkon, Terrasse zu ${percent(share)}`, rule: "§ 4 Nr. 4", area, share };
  return { label: "Keine Wohnfläche", rule: "§ 2 Abs. 3", area, share };
}

/**
 * The living area of one room with its calculation (docs/WOHNFLAECHE.md). Clear heights run from
 * the finished floor to the underside of the slabs and roofs in `sources`. A part without any of
 * them has no height: it counts in full and the notes say so.
 */
export function roomLivingResult(
  room: Pick<Room, "points" | "floorBuildUp" | "livingArea">,
  sources: readonly CeilingSource[],
): RoomLivingResult {
  const use = areaUseOf(room.livingArea);
  const grossArea = roomArea(room);
  const fixed = fixedShare(room.livingArea);
  const notes: string[] = [];
  let steps: LivingAreaStep[];
  if (fixed !== null) steps = [fixedStep(use, grossArea, fixed)];
  else {
    const field = roomHeightField(room.points, sources, {
      floor: room.floorBuildUp ?? 0,
      upper: "underside",
      levels: [HALF_HEIGHT, FULL_HEIGHT],
    });
    const [low, half, full] = field.zones;
    steps = [
      { label: "Lichte Höhe ab 2 m", rule: "§ 4 Nr. 1", area: full!.area, share: 1 },
      { label: "Lichte Höhe 1 m bis unter 2 m", rule: "§ 4 Nr. 2", area: half!.area, share: 0.5 },
      { label: "Lichte Höhe unter 1 m", rule: "§ 4", area: low!.area, share: 0 },
      { label: "Ohne Decke oder Dach darüber", rule: "§ 4 Nr. 1", area: field.openArea, share: 1 },
    ].filter((step) => step.area > 1e-9);
    if (field.openArea > 1e-9)
      notes.push("Ein Teil hat keine Decke oder kein Dach darüber und zählt deshalb voll.");
  }
  return {
    use,
    grossArea,
    steps,
    livingArea: steps.reduce((sum, step) => sum + step.area * step.share, 0),
    notes,
  };
}
