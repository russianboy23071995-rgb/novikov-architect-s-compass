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

type TrimStorey = TrimProject["storeys"][number];
type RoofSource = { roof: RoofGeometryInput; floor: number | null };
/**
 * Resolved storeys with what they were resolved from (docs/performance/ROOF_TRIM.md): the
 * storey object (walls, windows and doors), its floor and every roof its walls are trimmed at
 * with that roof's floor. Kept for the input and the result, so the next validation, which gets
 * the earlier result back, reuses it. Only successful resolutions are kept.
 */
const resolved = new WeakMap<
  object,
  {
    floor: number | null;
    roofs: readonly (readonly [string, RoofSource["roof"], number | null])[];
    result: object;
  }
>();
let reused = 0;
/** Diagnostic count of storeys whose trims were reused unchanged, for tests and measurements. */
export const roofTrimReuseCount = () => reused;

const same = (p: WallTrimPlane | undefined, q: WallTrimPlane) =>
  !!p && p.a === q.a && p.b === q.b && p.c === q.c && p.top === q.top && p.bottom === q.bottom;

/** The roofs of a project with their storey floors. */
function roofSources(project: TrimProject, levels: ReturnType<typeof resolveStoreyLevels>) {
  const roofs = new Map<string, RoofSource>();
  project.storeys.forEach((storey, i) => {
    for (const roof of storey.roofs ?? [])
      roofs.set(roof.id, { roof, floor: levels[i]!.elevation });
  });
  return roofs;
}
const trimInputs = (storey: TrimStorey, floor: number | null, roofs: Map<string, RoofSource>) => ({
  floor,
  roofs: [...new Set(storey.walls.flatMap((w) => (w.roofTrim ? [w.roofTrim.roofId] : [])))].map(
    (id) => [id, roofs.get(id)!.roof, roofs.get(id)!.floor] as const,
  ),
});

/**
 * Marks the storeys of a validated, frozen project as resolved: the next validation gets these
 * objects back and reuses their trims while their floor and roofs stay (owned snapshots call
 * this; their storeys are copies of what `resolveRoofTrims` returned).
 */
export function rememberRoofTrims(project: TrimProject): void {
  if (!project.storeys.some((s) => s.walls.some((w) => w.roofTrim))) return;
  const levels = resolveStoreyLevels(
    project.storeys,
    project.groundStoreyId,
    project.groundDatum ?? 0,
  );
  const roofs = roofSources(project, levels);
  project.storeys.forEach((storey, i) => {
    if (!storey.walls.some((w) => w.roofTrim || w.trimPlane) || resolved.has(storey)) return;
    resolved.set(storey, { ...trimInputs(storey, levels[i]!.elevation, roofs), result: storey });
  });
}

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
  const roofs = roofSources(project, levels);
  return {
    ...project,
    storeys: project.storeys.map((storey, i) => {
      if (!storey.walls.some((w) => w.roofTrim || w.trimPlane)) return storey;
      const floor = levels[i]!.elevation;
      const known = resolved.get(storey);
      if (
        known &&
        known.floor === floor &&
        known.roofs.every(([id, roof, roofFloor]) => {
          const source = roofs.get(id);
          return source?.roof === roof && source.floor === roofFloor;
        })
      ) {
        reused++;
        return known.result as typeof storey;
      }
      // Windows and doors per wall, once per storey (in their order: windows, then doors).
      const openings = new Map<string, Opening[]>();
      const host = (wallId: string, opening: Opening) => {
        const list = openings.get(wallId);
        if (list) list.push(opening);
        else openings.set(wallId, [opening]);
      };
      for (const w of storey.windows)
        host(w.wallId, { o: w, kind: "Fenster", top: w.sillHeight + w.height });
      for (const d of storey.doors ?? []) host(d.wallId, { o: d, kind: "Tür", top: d.height });
      let changed = false;
      const walls = storey.walls.map((wall) => {
        if (!wall.roofTrim) {
          if (!wall.trimPlane) return wall;
          const { trimPlane: _stale, ...rest } = wall;
          changed = true;
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
        checkOpenings(openings.get(wall.id) ?? [], wall, plane);
        if (same(wall.trimPlane, plane)) return wall;
        changed = true;
        return { ...wall, trimPlane: plane };
      });
      // Unchanged storeys keep their identity.
      const result = changed ? { ...storey, walls } : storey;
      const entry = { ...trimInputs(storey, floor, roofs), result };
      resolved.set(storey, entry);
      resolved.set(result, entry);
      return result;
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

type Opening = { o: Hosted; kind: string; top: number };
/** Refuses an opening of the wall that reaches above the trim plane (decision S). */
function checkOpenings(openings: readonly Opening[], wall: TrimWall, plane: WallTrimPlane) {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  for (const { o, kind, top } of openings) {
    const centre = o.position * length;
    if (top > lowestOver(wall, plane, centre - o.width / 2, centre + o.width / 2) + 1e-9)
      throw new Error(
        `${kind} ${o.mark ?? o.id} ragt über die Dachfläche; so kann die Wand ${wall.id} nicht getrimmt werden.`,
      );
  }
}

/** The trim plane in a wall's local frame (origin `origin`, x along (ux, uy), y to its left),
 * as used by the 3D body and the IFC export, so both cut the same shape. */
export function localTrimPlane(
  plane: Pick<WallTrimPlane, "a" | "b" | "c">,
  origin: Point2,
  ux: number,
  uy: number,
) {
  return {
    a: plane.a + plane.b * origin.x + plane.c * origin.y,
    b: plane.b * ux + plane.c * uy,
    c: -plane.b * uy + plane.c * ux,
  };
}
