import type { Project } from "../../domain/project/schema.ts";
import type { WallRenovation } from "../../domain/elements/wall/renovation.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";

/**
 * Sets the renovation status (Bestand/Neubau/Abbruch, docs/BAUZUSTAND.md) of the given walls on
 * any storey. One checked change, one undo step; geometry stays untouched.
 */
export function setWallRenovation(
  project: Project,
  wallIds: readonly string[],
  renovation: WallRenovation,
): Project {
  if (!wallIds.length) throw new Error("Bitte mindestens eine Wand auswählen.");
  const ids = new Set(wallIds);
  let found = 0;
  const storeys = project.storeys.map((storey) =>
    storey.walls.some((w) => ids.has(w.id))
      ? {
          ...storey,
          walls: storey.walls.map((w) => {
            if (!ids.has(w.id)) return w;
            found++;
            return { ...w, renovation };
          }),
        }
      : storey,
  );
  if (found !== ids.size) throw new Error("Unbekannte Wand in der Auswahl.");
  return validateLike(project, { ...project, storeys });
}
