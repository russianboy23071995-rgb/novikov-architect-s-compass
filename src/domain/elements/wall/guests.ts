import { storeyOf } from "../../storeys/access.ts";
import { resolveStoreyLevels } from "../../storeys/heights.ts";
import { connectedWallContours } from "./connections.ts";
import { wallBody } from "./body.ts";
import { wallHeights } from "./heights.ts";
import type { Project, Wall } from "../../project/schema.ts";
import type { Point2 } from "../../../geometry/primitives/point.ts";

/** Height of the plan cut above the floor of a storey, as in the plan of every element. */
export const GUEST_CUT_HEIGHT = 1;

export type GuestWall = { wall: Wall; storeyId: string; storeyName: string; ring: Point2[] };

/**
 * Walls of other storeys that pass the cut plane of the working storey (docs/MEHRGESCHOSS.md,
 * M2): a wall over several storeys shows in each of them. The wall stays in its own storey; its
 * ring is the joined plan outline there. `allows` filters by layer visibility.
 */
export function guestWalls(project: Project, allows: (id: string) => boolean = () => true) {
  const own = storeyOf(project);
  let levels: ReturnType<typeof resolveStoreyLevels>;
  try {
    levels = resolveStoreyLevels(project.storeys, project.groundStoreyId);
  } catch {
    return [];
  }
  const index = project.storeys.indexOf(own);
  const floor = levels[index]?.elevation;
  if (floor == null) return [];
  const cut = floor + GUEST_CUT_HEIGHT;
  return project.storeys.flatMap((storey, i): GuestWall[] => {
    const at = levels[i]?.elevation;
    if (i === index || at == null) return [];
    const walls = storey.walls.filter((wall) => {
      if (!allows(wall.id)) return false;
      const { bottom, top } = wallHeights(wall, at);
      return bottom <= cut && top > cut;
    });
    if (!walls.length) return [];
    const contours = connectedWallContours({ ...project, workingStoreyId: storey.id });
    return walls.map((wall) => ({
      wall,
      storeyId: storey.id,
      storeyName: storey.name,
      ring: contours.get(wall.id) ?? wallBody(wall).corners,
    }));
  });
}
