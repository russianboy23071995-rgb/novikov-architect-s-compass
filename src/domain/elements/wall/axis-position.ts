/** Signed body offset: positive places the body left of the directed drawing axis. */
export function assertAxisInside(thickness: number, offset: number): void {
  if (
    !Number.isFinite(thickness) ||
    thickness <= 0 ||
    !Number.isFinite(offset) ||
    Math.abs(offset) > thickness / 2
  )
    throw new Error("Die Wandachse muss innerhalb der Wand oder auf einer Wandkante liegen.");
}

/** Retain the relative axis position when changing thickness, including either edge. */
export function offsetAtThickness(
  wall: { thickness: number; bodyOffset: number },
  thickness: number,
) {
  assertAxisInside(wall.thickness, wall.bodyOffset);
  const offset = (wall.bodyOffset / wall.thickness) * thickness;
  assertAxisInside(thickness, offset);
  return offset;
}
