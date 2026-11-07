import {
  OUTDOOR_SHARE,
  roomArea,
  type Room,
  type RoomAreaUse,
  type RoomLivingArea,
} from "../../domain/elements/room/model.ts";
import { roomHeightField, type CeilingSource } from "../../domain/elements/room/heights.ts";
import { columnLevels, columnOutline, type Column } from "../../domain/elements/column/model.ts";
import { stairGeometry, stairLayout, type Stair } from "../../domain/elements/stair/model.ts";
import { overlapPieces, ringArea } from "../../geometry/polygons/overlap.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";

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
/** § 3 Abs. 3 Nr. 1: only above this height and this plan area. */
const BLOCKER_HEIGHT = 1.5;
const BLOCKER_AREA = 0.1;
/** § 3 Abs. 3 Nr. 2: stairs with more risers than this. */
const STAIR_RISERS = 3;

/** A part of the model whose plan area does not count (§ 3 Abs. 3). */
export type AreaBlocker = {
  label: string;
  rule: string;
  points: Point2[];
  /** Left out only when its part inside the room is larger than this (§ 3 Abs. 3 Nr. 1). */
  minArea?: number;
};

/**
 * What the model knows to leave out on a storey: columns and stairs. A column without a known
 * height runs up to the storey above and counts. Chimneys and linings are not modelled, the user
 * enters them as corrections.
 */
export function storeyAreaBlockers(storey: {
  height?: number | null | undefined;
  columns?: readonly Column[] | undefined;
  stairs?: readonly Stair[] | undefined;
}): AreaBlocker[] {
  const height = storey.height ?? null;
  const columns = (storey.columns ?? []).flatMap((column): AreaBlocker[] => {
    const levels = columnLevels(column, height);
    const points = columnOutline(column);
    if (levels && levels.top - levels.bottom <= BLOCKER_HEIGHT) return [];
    // The area counts inside the room: a column half in the wall shows only its other half.
    return [{ label: "Stütze", rule: "§ 3 Abs. 3 Nr. 1", points, minArea: BLOCKER_AREA }];
  });
  const stairs = (storey.stairs ?? []).flatMap((stair): AreaBlocker[] => {
    const geometry = stairGeometry(stair, height);
    if (!geometry || geometry.riserCount <= STAIR_RISERS) return [];
    const { footprint } = stairLayout(stair, geometry);
    return [{ label: "Treppe", rule: "§ 3 Abs. 3 Nr. 2", points: footprint }];
  });
  return [...columns, ...stairs];
}
const MIN_STEP = 1e-9;
const OPEN_LABEL = "Ohne Decke oder Dach darüber";
const percent = (share: number) => `${(share * 100).toLocaleString("de-DE")} %`;

function fixedStep(use: RoomAreaUse, area: number, share: number): LivingAreaStep {
  if (use === "unheated")
    return { label: "Unbeheizter geschlossener Raum", rule: "§ 4 Nr. 3", area, share };
  if (use === "outdoor")
    return { label: `Balkon, Terrasse zu ${percent(share)}`, rule: "§ 4 Nr. 4", area, share };
  return { label: "Keine Wohnfläche", rule: "§ 2 Abs. 3", area, share };
}

/** The height shares of a plan area, for a room or a part of it. */
function heightSteps(
  points: readonly Point2[],
  sources: readonly CeilingSource[],
  floor: number,
): LivingAreaStep[] {
  const field = roomHeightField(points, sources, {
    floor,
    upper: "underside",
    levels: [HALF_HEIGHT, FULL_HEIGHT],
  });
  const [low, half, full] = field.zones;
  return [
    { label: "Lichte Höhe ab 2 m", rule: "§ 4 Nr. 1", area: full!.area, share: 1 },
    { label: "Lichte Höhe 1 m bis unter 2 m", rule: "§ 4 Nr. 2", area: half!.area, share: 0.5 },
    { label: "Lichte Höhe unter 1 m", rule: "§ 4", area: low!.area, share: 0 },
    { label: OPEN_LABEL, rule: "§ 4 Nr. 1", area: field.openArea, share: 1 },
  ].filter((step) => step.area > MIN_STEP);
}

/**
 * The living area of one room with its calculation (docs/WOHNFLAECHE.md). Clear heights run from
 * the finished floor to the underside of the slabs and roofs in `sources`. A part without any of
 * them has no height: it counts in full and the notes say so. Blockers come off at the share of
 * the place they stand on; corrections count at the room's fixed share, in a living room in full.
 */
export function roomLivingResult(
  room: Pick<Room, "points" | "floorBuildUp" | "livingArea">,
  sources: readonly CeilingSource[],
  blockers: readonly AreaBlocker[] = [],
): RoomLivingResult {
  const use = areaUseOf(room.livingArea);
  const grossArea = roomArea(room);
  const fixed = fixedShare(room.livingArea);
  const floor = room.floorBuildUp ?? 0;
  const notes: string[] = [];
  const shares = (points: readonly Point2[]) =>
    fixed !== null
      ? [fixedStep(use, ringArea(points), fixed)]
      : heightSteps(points, sources, floor);
  const steps = shares(room.points);
  if (steps.some((step) => step.label === OPEN_LABEL))
    notes.push("Ein Teil hat keine Decke oder kein Dach darüber und zählt deshalb voll.");
  for (const blocker of blockers) {
    const parts = new Map<number, number>();
    const pieces = overlapPieces(room.points, blocker.points);
    const inside = pieces.reduce((sum, piece) => sum + ringArea(piece), 0);
    if (blocker.minArea !== undefined && inside <= blocker.minArea) continue;
    for (const piece of pieces)
      for (const part of shares(piece))
        parts.set(part.share, (parts.get(part.share) ?? 0) + part.area);
    for (const [share, area] of parts)
      steps.push({ label: blocker.label, rule: blocker.rule, area: -area, share });
  }
  for (const correction of room.livingArea?.corrections ?? [])
    steps.push({
      label: correction.note,
      rule: "Eingabe",
      area: correction.area,
      share: fixed ?? 1,
    });
  const sum = steps.reduce((total, step) => total + step.area * step.share, 0);
  if (sum < 0) notes.push("Die Abzüge sind größer als der Raum; die Wohnfläche bleibt bei 0.");
  return { use, grossArea, steps, livingArea: Math.max(0, sum), notes };
}
