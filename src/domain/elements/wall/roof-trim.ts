import type { Point2 } from "../../../geometry/primitives/point.ts";
import { resolveStoreyLevels, type StoreyHeight } from "../../storeys/heights.ts";
import { roofFrame, type RoofGeometryInput } from "../roof/geometry.ts";
import { wallBody } from "./body.ts";

/**
 * Wall trimmed at a roof (docs/TRIMMEN_L04B.md, L04b; Masterplan §8): the wall stores only
 * `roofTrim.roofId`; the cut is derived from the current roof on every validation and kept on
 * the wall as `trimPlane` – a resolved input like the bound wall height (A08), never stored.
 * Plane in plan coordinates, heights relative to the wall foot: z(x, y) = a + b·x + c·y.
 * `top`/`bottom`: highest/lowest plane height over the wall body corners.
 */
export type WallTrimPlane = { a: number; b: number; c: number; top: number; bottom: number };

/** Smallest wall height left under a trimming roof, in metres. */
export const MIN_TRIMMED_HEIGHT = 0.1;

export function trimHeightAt(plane: Pick<WallTrimPlane, "a" | "b" | "c">, p: Point2): number {
  return plane.a + plane.b * p.x + plane.c * p.y;
}

/** Height that bounds openings and the body: the trim top while trimmed, else the stored one. */
export function effectiveWallHeight(wall: {
  height: number;
  trimPlane?: WallTrimPlane | undefined;
}) {
  return wall.trimPlane ? wall.trimPlane.top : wall.height;
}

type TrimWall = {
  id: string;
  start: Point2;
  end: Point2;
  thickness: number;
  bodyOffset: number;
  baseOffset?: number | undefined;
  height: number;
  roofTrim?: { roofId: string } | undefined;
  trimPlane?: WallTrimPlane | undefined;
};
type Hosted = {
  id: string;
  wallId: string;
  position: number;
  width: number;
  mark?: string | undefined;
};
type TrimProject = {
  groundStoreyId: string;
  groundDatum?: number | undefined;
  storeys: (StoreyHeight & {
    walls: TrimWall[];
    windows: (Hosted & { sillHeight: number; height: number })[];
    doors?: (Hosted & { height: number })[] | undefined;
    roofs?: (RoofGeometryInput & { id: string })[] | undefined;
  })[];
};

/** Underside plane of a roof relative to a wall foot (decision Q: trim at the underside). */
export function roofTrimPlane(
  wall: TrimWall,
  wallFoot: number,
  roof: RoofGeometryInput,
  roofFloor: number,
): WallTrimPlane {
  const f = roofFrame(roof);
  const b = f.tan * f.rise.x,
    c = f.tan * f.rise.y;
  const a = roofFloor + roof.referenceHeight - wallFoot - (b * f.origin.x + c * f.origin.y);
  const heights = wallBody(wall).corners.map((p) => a + b * p.x + c * p.y);
  return { a, b, c, top: Math.max(...heights), bottom: Math.min(...heights) };
}

const same = (p: WallTrimPlane | undefined, q: WallTrimPlane) =>
  !!p && p.a === q.a && p.b === q.b && p.c === q.c && p.top === q.top && p.bottom === q.bottom;

/**
 * Resolves every roof trim of the project into `trimPlane` (also across storeys) and checks
 * it: the roof must exist, the plane must stay at least MIN_TRIMMED_HEIGHT above the wall foot
 * over the whole wall (decision T: the plane holds for the whole wall length), and no window or
 * door may reach above it (decision S: refuse, never cut silently). Walls without a trim lose
 * a stale plane. Unchanged walls keep their identity.
 */
export function resolveRoofTrims<T extends TrimProject>(project: T): T {
  const trimmed = project.storeys.some((s) => s.walls.some((w) => w.roofTrim || w.trimPlane));
  if (!trimmed) return project;
  const levels = resolveStoreyLevels(
    project.storeys,
    project.groundStoreyId,
    project.groundDatum ?? 0,
  );
  const roofs = new Map<string, { roof: RoofGeometryInput; floor: number | null }>();
  project.storeys.forEach((storey, i) => {
    for (const roof of storey.roofs ?? [])
      roofs.set(roof.id, { roof, floor: levels[i]!.elevation });
  });
  return {
    ...project,
    storeys: project.storeys.map((storey, i) => {
      if (!storey.walls.some((w) => w.roofTrim || w.trimPlane)) return storey;
      const floor = levels[i]!.elevation;
      const walls = storey.walls.map((wall) => {
        if (!wall.roofTrim) {
          if (!wall.trimPlane) return wall;
          const { trimPlane: _stale, ...rest } = wall;
          return rest as typeof wall;
        }
        const source = roofs.get(wall.roofTrim.roofId);
        if (!source)
          throw new Error(
            `Das Dach ${wall.roofTrim.roofId} für die Trimmung der Wand ${wall.id} fehlt.`,
          );
        if (floor === null || source.floor === null)
          throw new Error("Für das Trimmen zuerst die Geschosshöhen festlegen.");
        const plane = roofTrimPlane(
          wall,
          floor + (wall.baseOffset ?? 0),
          source.roof,
          source.floor,
        );
        if (plane.bottom < MIN_TRIMMED_HEIGHT)
          throw new Error(
            `Die Dachfläche liegt (teilweise) unter dem Fuß der Wand ${wall.id}; so kann sie nicht getrimmt werden.`,
          );
        checkOpenings(storey, wall, plane);
        return same(wall.trimPlane, plane) ? wall : { ...wall, trimPlane: plane };
      });
      return { ...storey, walls };
    }),
  };
}

/** Lowest trim height over an opening's span on both wall faces. */
function lowestOver(wall: TrimWall, plane: WallTrimPlane, left: number, right: number) {
  const body = wallBody(wall);
  const length = Math.hypot(body.end.x - body.start.x, body.end.y - body.start.y);
  const ux = (body.end.x - body.start.x) / length,
    uy = (body.end.y - body.start.y) / length;
  let lowest = Infinity;
  for (const x of [left, right])
    for (const side of [-1, 1]) {
      const p = {
        x: body.start.x + ux * x + (body.normal.x * side * wall.thickness) / 2,
        y: body.start.y + uy * x + (body.normal.y * side * wall.thickness) / 2,
      };
      lowest = Math.min(lowest, trimHeightAt(plane, p));
    }
  return lowest;
}

function checkOpenings(
  storey: TrimProject["storeys"][number],
  wall: TrimWall,
  plane: WallTrimPlane,
) {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  const openings = [
    ...storey.windows
      .filter((w) => w.wallId === wall.id)
      .map((w) => ({ o: w, kind: "Fenster", top: w.sillHeight + w.height })),
    ...(storey.doors ?? [])
      .filter((d) => d.wallId === wall.id)
      .map((d) => ({ o: d, kind: "Tür", top: d.height })),
  ];
  for (const { o, kind, top } of openings) {
    const centre = o.position * length;
    if (top > lowestOver(wall, plane, centre - o.width / 2, centre + o.width / 2) + 1e-9)
      throw new Error(
        `${kind} ${o.mark ?? o.id} ragt über die Dachfläche; so kann die Wand ${wall.id} nicht getrimmt werden.`,
      );
  }
}
