import {
  OUTDOOR_SHARE,
  type RoomAreaUse,
  type RoomLivingArea,
} from "../../domain/elements/room/model.ts";

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
