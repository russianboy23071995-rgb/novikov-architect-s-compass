import type { Project } from "../../domain/project/schema.ts";
import type { SelectionSet } from "../selection/state.ts";
export type MovementAxis = Readonly<{
  id: string;
  label: string;
  direction: readonly [number, number, number];
}>;
/** Spatial contract shared by axis controls and future non-horizontal adapters. */
export const WORLD_MOVEMENT_AXES: readonly MovementAxis[] = [
  { id: "x", label: "X", direction: [1, 0, 0] },
  { id: "y", label: "Y", direction: [0, 1, 0] },
  { id: "z", label: "Z", direction: [0, 0, 1] },
];
export function horizontalAxisDegrees(axis: MovementAxis): number {
  const [x, y, z] = axis.direction;
  if (![x, y, z].every(Number.isFinite) || Math.hypot(x, y, z) === 0)
    throw new Error("Ungültige Bewegungsachse.");
  if (z !== 0) throw new Error("Z-Bewegung benötigt eine freigegebene Höhenaktion.");
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
export function selectionMovementAxes(project: Project, targets: SelectionSet): MovementAxis[] {
  const selected = new Set(targets.filter((t) => t.kind === "wall").map((t) => t.id));
  const axes: MovementAxis[] = [...WORLD_MOVEMENT_AXES];
  for (const s of project.storeys)
    for (const w of s.walls)
      if (selected.has(w.id)) {
        const x = w.end.x - w.start.x,
          y = w.end.y - w.start.y,
          length = Math.hypot(x, y);
        if (length > 0)
          axes.push({
            id: w.id,
            label: `Wandachse ${axes.length - 2}`,
            direction: [x / length, y / length, 0],
          });
      }
  return axes;
}
