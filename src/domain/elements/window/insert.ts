import { z } from "zod";

/**
 * Elements set into an opening (docs/FENSTER_TUEREN.md, FT1, user decision 01.11.2026): the
 * opening stays the cut in the wall; a window or door element fills it. An opening without an
 * element is valid (e.g. a plain opening through the wall). Only the values are stored; frame,
 * glass and leaf bodies are derived (FT2).
 */
const metres = z.number().finite();

/** Where the window frame sits in the wall thickness; `offset` is measured from that face. */
export const WINDOW_LOCATIONS = ["inside", "centre", "outside"] as const;
export type WindowLocation = (typeof WINDOW_LOCATIONS)[number];
export const WINDOW_LOCATION_LABELS: Record<WindowLocation, string> = {
  inside: "Innen",
  centre: "Mitte",
  outside: "Außen",
};
/**
 * Divisions of the window (docs/FENSTER_TUEREN.md, FL1): fixed light; one sash; two sashes
 * side by side with a mullion; one sash below a fixed top light (transom).
 */
export const WINDOW_DIVISIONS = ["fixed", "single", "double", "transom"] as const;
export type WindowDivision = (typeof WINDOW_DIVISIONS)[number];
export const WINDOW_DIVISION_LABELS: Record<WindowDivision, string> = {
  fixed: "Festverglasung",
  single: "1-flüglig",
  double: "2-flüglig mit Pfosten",
  transom: "1-flüglig mit Oberlicht",
};
/** How a sash opens: turn (side hinged), turn and tilt, tilt only (bottom hinged). */
export const SASH_OPERATIONS = ["turn", "turn-tilt", "tilt"] as const;
export type SashOperation = (typeof SASH_OPERATIONS)[number];
export const SASH_OPERATION_LABELS: Record<SashOperation, string> = {
  turn: "Dreh",
  "turn-tilt": "Dreh-Kipp",
  tilt: "Kipp",
};
/** Sashes per division, left to right seen from inside. */
export const DIVISION_SASHES: Record<WindowDivision, number> = {
  fixed: 0,
  single: 1,
  double: 2,
  transom: 1,
};

const sashSchema = z
  .object({
    operation: z.enum(SASH_OPERATIONS),
    /** Hinge side seen from inside; a tilt-only sash keeps it but hinges at the bottom. */
    hinge: z.enum(["left", "right"]),
  })
  .strict();
export type Sash = z.infer<typeof sashSchema>;

const sillSchema = z.object({ projection: metres.min(0).max(0.5) }).strict();

export const windowInsertSchema = z
  .object({
    /** Visible frame width, the same on all four sides. */
    frameWidth: metres.min(0.02).max(0.3),
    /** Frame depth across the wall. */
    frameDepth: metres.min(0.02).max(0.5),
    location: z.enum(WINDOW_LOCATIONS),
    offset: metres.min(0).max(0.5),
    /**
     * Wall face that is outside, seen along the wall from its start to its end. Walls do not
     * know their outside yet, so each window carries it; it can be turned in the window.
     */
    exterior: z.enum(["left", "right"]),
    division: z.enum(WINDOW_DIVISIONS),
    /** Sashes left to right seen from inside, as many as the division has (FL1). */
    sashes: z.array(sashSchema).max(2).optional(),
    /** Visible width of the sash frame. Absent: SASH_DEFAULTS. */
    sashWidth: metres.min(0.02).max(0.2).optional(),
    /** Width of mullion (two sashes) or transom (top light). */
    mullionWidth: metres.min(0.02).max(0.3).optional(),
    /** Clear height of the top light above the transom. */
    transomHeight: metres.min(0.1).max(2).optional(),
    /** Window boards; the projection is measured beyond the wall face. Absent: none. */
    sillInside: sillSchema.optional(),
    sillOutside: sillSchema.optional(),
  })
  .strict();
export type WindowInsert = z.infer<typeof windowInsertSchema>;

export const WINDOW_INSERT_DEFAULTS: WindowInsert = {
  frameWidth: 0.07,
  frameDepth: 0.08,
  location: "centre",
  offset: 0,
  exterior: "right",
  division: "fixed",
  sillInside: { projection: 0.02 },
  sillOutside: { projection: 0.04 },
};

/** Values a window with sashes uses when they are not set. */
export const SASH_DEFAULTS = { sashWidth: 0.06, mullionWidth: 0.08, transomHeight: 0.4 } as const;

/** The usual sashes of a division: turn-tilt; two sashes meet with the turn-tilt one on the right. */
export function divisionSashes(division: WindowDivision): Sash[] {
  if (division === "fixed") return [];
  if (division === "double")
    return [
      { operation: "turn", hinge: "left" },
      { operation: "turn-tilt", hinge: "right" },
    ];
  return [{ operation: "turn-tilt", hinge: "left" }];
}

/** A window element switched to another division: matching sashes, other values kept. */
export function withDivision(insert: WindowInsert, division: WindowDivision): WindowInsert {
  const { sashes: _, ...rest } = insert;
  return division === "fixed"
    ? { ...rest, division }
    : { ...rest, division, sashes: divisionSashes(division) };
}

export const doorInsertSchema = z
  .object({
    /** Visible width of the door frame (Zarge). */
    frameWidth: metres.min(0.02).max(0.3),
    /** Frame depth across the wall; absent: the full wall thickness. */
    frameDepth: metres.min(0.02).max(1).optional(),
    leafThickness: metres.min(0.02).max(0.12),
  })
  .strict();
export type DoorInsert = z.infer<typeof doorInsertSchema>;

export const DOOR_INSERT_DEFAULTS: DoorInsert = { frameWidth: 0.06, leafThickness: 0.04 };

const cm = (m: number) => `${(m * 100).toFixed(1).replace(".", ",").replace(",0", "")} cm`;

/** Why a window element does not fit its opening and wall, or null when it fits. */
export function windowInsertProblem(
  insert: WindowInsert,
  opening: { width: number; height: number },
  wallThickness: number,
): string | null {
  if (2 * insert.frameWidth >= Math.min(opening.width, opening.height))
    return `Der Rahmen (${cm(insert.frameWidth)}) lässt in der Öffnung kein Glas übrig.`;
  // Sashes (FL1): as many as the division has, and room for glass inside every sash.
  const count = DIVISION_SASHES[insert.division];
  if ((insert.sashes?.length ?? 0) !== count)
    return `${WINDOW_DIVISION_LABELS[insert.division]} braucht ${count === 1 ? "einen Flügel" : `${count} Flügel`}.`;
  if (count) {
    const sash = insert.sashWidth ?? SASH_DEFAULTS.sashWidth;
    const bar = insert.mullionWidth ?? SASH_DEFAULTS.mullionWidth;
    const top =
      insert.division === "transom"
        ? (insert.transomHeight ?? SASH_DEFAULTS.transomHeight) + bar
        : 0;
    const width = (opening.width - 2 * insert.frameWidth - (count === 2 ? bar : 0)) / count;
    const height = opening.height - 2 * insert.frameWidth - top;
    if (2 * sash >= Math.min(width, height))
      return `Der Flügelrahmen (${cm(sash)}) lässt im Flügel kein Glas übrig.`;
  }
  if (insert.frameDepth > wallThickness + 1e-9)
    return `Die Rahmentiefe (${cm(insert.frameDepth)}) ist größer als die Wanddicke.`;
  if (insert.location !== "centre" && insert.offset + insert.frameDepth > wallThickness + 1e-9)
    return "Rahmentiefe und Abstand passen nicht in die Wanddicke.";
  return null;
}

/** Why a door element does not fit its opening and wall, or null when it fits. */
export function doorInsertProblem(
  insert: DoorInsert,
  opening: { width: number; height: number },
  wallThickness: number,
): string | null {
  if (2 * insert.frameWidth >= opening.width || insert.frameWidth >= opening.height)
    return `Die Zarge (${cm(insert.frameWidth)}) lässt in der Öffnung keinen Durchgang übrig.`;
  const depth = insert.frameDepth ?? wallThickness;
  if (depth > wallThickness + 1e-9)
    return `Die Zargentiefe (${cm(depth)}) ist größer als die Wanddicke.`;
  if (insert.leafThickness > depth + 1e-9) return "Das Türblatt ist dicker als die Zarge.";
  return null;
}

/** Input check for windows and tool defaults: the allowed ranges in words, not a schema dump. */
export function checkedWindowInsert(insert: WindowInsert): WindowInsert {
  const parsed = windowInsertSchema.safeParse(insert);
  if (!parsed.success)
    throw new Error(
      "Außerhalb des zulässigen Bereichs: Rahmenbreite 2–30 cm, Rahmentiefe 2–50 cm, Abstand und Überstand 0–50 cm, Flügelrahmen 2–20 cm, Pfosten/Kämpfer 2–30 cm, Oberlicht 10–200 cm.",
    );
  return parsed.data;
}

export function checkedDoorInsert(insert: DoorInsert): DoorInsert {
  const parsed = doorInsertSchema.safeParse(insert);
  if (!parsed.success)
    throw new Error(
      "Außerhalb des zulässigen Bereichs: Zargenbreite 2–30 cm, Zargentiefe 2–100 cm, Blattdicke 2–12 cm.",
    );
  return parsed.data;
}
