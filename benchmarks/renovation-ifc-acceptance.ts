import type { Project } from "../src/domain/project/schema.ts";
import { createProject } from "../src/application/projects/create.ts";
import { addWall } from "../src/application/walls/actions.ts";
import { setWallRenovation } from "../src/application/walls/renovation.ts";
import { WALL_RENOVATIONS } from "../src/domain/elements/wall/renovation.ts";

/**
 * Archicad acceptance of the renovation status (docs/BAUZUSTAND.md, S2): three parallel walls,
 * 5,00 × 0,24 × 2,80 m, 2,00 m apart, named after their status: Bestand, Neubau, Abbruch.
 */
export function renovationAcceptanceProject(): Project {
  let p = createProject("novikov-bauzustand-abnahme", "eg");
  const ids = { existing: "Bestand", new: "Neubau", demolish: "Abbruch" } as const;
  WALL_RENOVATIONS.forEach((status, i) => {
    p = addWall(p, {
      id: ids[status],
      start: { x: 0, y: i * 2 },
      end: { x: 5, y: i * 2 },
      thickness: 0.24,
      height: 2.8,
    });
    p = setWallRenovation(p, [ids[status]], status);
  });
  return p;
}
