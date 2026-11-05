/**
 * Renovation status of a wall (user decision 31.10.2026, docs/BAUZUSTAND.md): Bestand, Neubau or
 * Abbruch. A wall without a stored status is Bestand, so files before schema 36 keep their look.
 */
export const WALL_RENOVATIONS = ["existing", "new", "demolish"] as const;
export type WallRenovation = (typeof WALL_RENOVATIONS)[number];

export const WALL_RENOVATION_LABELS: Record<WallRenovation, string> = {
  existing: "Bestand",
  new: "Neubau",
  demolish: "Abbruch",
};

/** Plan colours when the renovation display is on; Bestand keeps the cut fill (S1). */
export const WALL_RENOVATION_COLORS: Record<Exclude<WallRenovation, "existing">, string> = {
  new: "#dc2626",
  demolish: "#facc15",
};

/** IFC Pset_WallCommon.Status values. */
export const IFC_RENOVATION_STATUS: Record<WallRenovation, string> = {
  existing: "EXISTING",
  new: "NEW",
  demolish: "DEMOLISH",
};

export function wallRenovation(wall: { renovation?: WallRenovation | undefined }): WallRenovation {
  return wall.renovation ?? "existing";
}
