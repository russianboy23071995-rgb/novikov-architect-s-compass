import { storeyOf } from "../../storeys/access.ts";
import { resolveStoreyLevels } from "../../storeys/heights.ts";
import { connectedWallContours } from "./connections.ts";
import { wallBody } from "./body.ts";
import { wallHeights } from "./heights.ts";
import type { Project, Wall } from "../../project/schema.ts";
import type { Point2 } from "../../../geometry/primitives/point.ts";

/** Height of the plan cut above the floor of a storey, as in the plan of every element. */
export const GUEST_CUT_HEIGHT = 1;

/** A window of a guest wall that this cut plane passes, as a plan rectangle (M4). */
export type GuestOpening = { id: string; ring: Point2[]; centre: [Point2, Point2] };
export type GuestWall = {
  wall: Wall;
  storeyId: string;
  storeyName: string;
  ring: Point2[];
  openings: GuestOpening[];
};

/** Whether a window of a wall in a storey at `floor` lies wholly above that storey's top. */
export function openingAboveStorey(
  wall: Pick<Wall, "baseOffset">,
  sillHeight: number,
  storeyHeight: number | null | undefined,
) {
  return storeyHeight != null && (wall.baseOffset ?? 0) + sillHeight >= storeyHeight - 1e-9;
}

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
    return walls.map((wall) => {
      const { bottom } = wallHeights(wall, at);
      const body = wallBody(wall);
      const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
      const along = {
        x: (wall.end.x - wall.start.x) / length,
        y: (wall.end.y - wall.start.y) / length,
      };
      const half = wall.thickness / 2;
      const at2 = (s: number, t: number): Point2 => ({
        x: body.start.x + along.x * s + body.normal.x * t,
        y: body.start.y + along.y * s + body.normal.y * t,
      });
      const openings = storey.windows
        .filter((w) => w.wallId === wall.id && allows(w.id))
        .filter((w) => bottom + w.sillHeight <= cut && bottom + w.sillHeight + w.height > cut)
        .map((w): GuestOpening => {
          const a = w.position * length - w.width / 2,
            b = w.position * length + w.width / 2;
          return {
            id: w.id,
            ring: [at2(a, -half), at2(b, -half), at2(b, half), at2(a, half)],
            centre: [at2(a, 0), at2(b, 0)],
          };
        });
      return {
        wall,
        storeyId: storey.id,
        storeyName: storey.name,
        ring: contours.get(wall.id) ?? body.corners,
        openings,
      };
    });
  });
}
