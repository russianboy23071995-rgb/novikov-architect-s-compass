import type { Project } from "../../domain/project/schema.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";

/**
 * Trims walls at a roof (docs/TRIMMEN_L04B.md, L04b): every wall gets the trim reference, the
 * cut follows from the current roof (also from another storey). One checked change, one undo
 * step; the model check refuses roofs below the wall foot and windows/doors above the roof.
 */
export function trimWallsToRoof(
  project: Project,
  wallIds: readonly string[],
  roofId: string,
): Project {
  if (!wallIds.length) throw new Error("Bitte mindestens eine Wand auswählen.");
  if (!project.storeys.some((s) => (s.roofs ?? []).some((r) => r.id === roofId)))
    throw new Error("Bitte genau ein Dach auswählen.");
  const ids = new Set(wallIds);
  let found = 0;
  const storeys = project.storeys.map((storey) =>
    storey.walls.some((w) => ids.has(w.id))
      ? {
          ...storey,
          walls: storey.walls.map((w) => {
            if (!ids.has(w.id)) return w;
            found++;
            return { ...w, roofTrim: { roofId } };
          }),
        }
      : storey,
  );
  if (found !== ids.size) throw new Error("Unbekannte Wand in der Auswahl.");
  return validateLike(project, { ...project, storeys });
}

/** Removes the trim of the given walls; they keep their stored height again (one undo step). */
export function untrimWalls(project: Project, wallIds: readonly string[]): Project {
  const ids = new Set(wallIds);
  let changed = false;
  const storeys = project.storeys.map((storey) =>
    storey.walls.some((w) => ids.has(w.id) && w.roofTrim)
      ? {
          ...storey,
          walls: storey.walls.map((w) => {
            if (!ids.has(w.id) || !w.roofTrim) return w;
            changed = true;
            const { roofTrim: _trim, trimPlane: _plane, ...rest } = w;
            return rest;
          }),
        }
      : storey,
  );
  if (!changed) throw new Error("Die gewählten Wände sind nicht getrimmt.");
  return validateLike(project, { ...project, storeys });
}
