import type { Project } from "../project/schema.ts";
import { resolveStoreyLevels } from "./heights.ts";
const elevations = new WeakMap<Project, number>();
/** Local building Z, matching IFC. Absolute groundDatum labels do not shift geometry. */
export function workingStoreyElevation(project: Project): number {
  const cached = elevations.get(project);
  if (cached !== undefined) return cached;
  const id = project.workingStoreyId ?? project.groundStoreyId;
  const level = resolveStoreyLevels(project.storeys, project.groundStoreyId).find(
    (s) => s.storeyId === id,
  );
  if (!level || level.elevation === null)
    throw new Error("Die Arbeitsebenenhöhe ist nicht aufgelöst.");
  elevations.set(project, level.elevation);
  return level.elevation;
}
