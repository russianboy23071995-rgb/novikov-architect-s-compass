import type { WallGeometry } from "../../project/geometry-scope.ts";
import { tConnectionContours } from "./t-relations.ts";
import type { Project, Wall } from "../../project/schema.ts";
import { deriveWallCorner } from "./corner.ts";
import { wallBody } from "./body.ts";
import { wallContourSolid } from "./contour-solid.ts";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";
import { measureHalfPlane } from "../../../geometry/projections/half-plane.ts";

export type WallEnd = { wallId: string; endpoint: 0 | 1 };
export type WallJoin = { first: WallEnd; second: WallEnd };
const key = (end: WallEnd) => JSON.stringify([end.wallId, end.endpoint]);
const point = (wall: Wall, endpoint: 0 | 1) => (endpoint === 0 ? wall.start : wall.end);
const same = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  a.x === b.x && a.y === b.y;

/** Model endpoints must coincide exactly; the screen snap radius never creates a join. */
export function reconcileWallJoins(
  project: Project,
  changedId: string,
  previous?: Wall,
  excludedPartners: readonly string[] = [],
): Project {
  const changed = project.storey.walls.find((w) => w.id === changedId)!;
  const walls = new Map(project.storey.walls.map((w) => [w.id, w]));
  const joins = project.storey.wallJoins.filter((join) => {
    const a = walls.get(join.first.wallId),
      b = walls.get(join.second.wallId);
    return a && b && same(point(a, join.first.endpoint), point(b, join.second.endpoint));
  });
  for (const endpoint of [0, 1] as const) {
    const first = { wallId: changedId, endpoint };
    const p = point(changed, endpoint);
    if (previous && same(p, point(previous, endpoint))) continue;
    const candidates = project.storey.walls
      .filter((w) => w.id !== changedId && !excludedPartners.includes(w.id))
      .flatMap((w) =>
        ([0, 1] as const)
          // A stored T endpoint belongs to its host, not to an automatic corner.
          .filter(
            (e) =>
              same(p, point(w, e)) &&
              !project.storey.wallTJunctions.some(
                (t) => t.incoming.wallId === w.id && t.incoming.endpoint === e,
              ),
          )
          .map((e) => ({ wallId: w.id, endpoint: e })),
      );
    if (candidates.length > 1)
      throw new Error(
        "Mehrere Wandachsen am selben Punkt: Mehrfachanschluss noch nicht unterstützt.",
      );
    if (!candidates.length) continue;
    const second = candidates[0]!;
    if (joins.some((j) => [key(j.first), key(j.second)].includes(key(first)))) continue;
    if (joins.some((j) => [key(j.first), key(j.second)].includes(key(second))))
      throw new Error("Dieses Achsende ist bereits verbunden.");
    const ends = [first, second].sort((a, b) => key(a).localeCompare(key(b)));
    joins.push({ first: ends[0]!, second: ends[1]! });
  }
  return { ...project, storey: { ...project.storey, wallJoins: joins } };
}

/** Authoritative disposable contours from persisted endpoint relationships. No schema recursion. */
export function connectedWallContours(project: WallGeometry) {
  const walls = new Map(project.storey.walls.map((w) => [w.id, w]));
  const counts = new Map<string, number>();
  for (const wall of walls.values())
    for (const p of [wall.start, wall.end]) {
      const k = JSON.stringify([p.x, p.y]);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  const contours = new Map<string, ReturnType<typeof wallBody>["corners"]>();
  const occupied = new Set<string>();
  for (const join of project.storey.wallJoins) {
    const a = walls.get(join.first.wallId),
      b = walls.get(join.second.wallId);
    if (!a || !b || a.id === b.id) throw new Error("Ungültige Wandverbindung.");
    const node = point(a, join.first.endpoint);
    if (!same(point(a, join.first.endpoint), point(b, join.second.endpoint)))
      throw new Error("Verbundene Achsenden müssen übereinstimmen.");
    if (counts.get(JSON.stringify([node.x, node.y])) !== 2)
      throw new Error("Mehrfachanschluss noch nicht unterstützt.");
    for (const end of [join.first, join.second]) {
      if (occupied.has(key(end))) throw new Error("Ein Achsende darf nur einmal verbunden sein.");
      occupied.add(key(end));
    }
    const result = deriveWallCorner(
      { wall: a, endpoint: join.first.endpoint },
      { wall: b, endpoint: join.second.endpoint },
    );
    for (const contour of result.walls) {
      const ring = contours.get(contour.wallId) ?? wallBody(walls.get(contour.wallId)!).corners;
      if (contour.endpoint === 0) {
        ring[0] = contour.points[0]!;
        ring[3] = contour.points[3]!;
      } else {
        ring[1] = contour.points[3]!;
        ring[2] = contour.points[0]!;
      }
      contours.set(contour.wallId, ring);
    }
  }
  for (const [id, ring] of contours) {
    const check = validateSimplePolygon(ring);
    if (!check.valid || check.signedArea <= 0)
      throw new Error("Wand zwischen Anschlüssen zu kurz.");
    const wall = walls.get(id)!;
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    for (const opening of project.storey.windows.filter((w) => w.wallId === id)) {
      const at = (d: number) => ({
        x: wall.start.x + ((wall.end.x - wall.start.x) * d) / length,
        y: wall.start.y + ((wall.end.y - wall.start.y) * d) / length,
      });
      const centre = opening.position * length;
      const footprint = wallBody({
        ...wall,
        start: at(centre - opening.width / 2),
        end: at(centre + opening.width / 2),
      }).corners;
      for (let i = 0; i < 4; i++) {
        const relation = measureHalfPlane(footprint, ring[i]!, ring[(i + 1) % 4]!).relation;
        if (
          relation === "outside" ||
          (((i === 1 && occupied.has(key({ wallId: id, endpoint: 1 }))) ||
            (i === 3 && occupied.has(key({ wallId: id, endpoint: 0 })))) &&
            relation === "touching")
        )
          throw new Error("Fenster darf einen Wandabschluss weder berühren noch überschreiten.");
      }
    }
  }
  for (const [id, ring] of tConnectionContours(project, contours)) contours.set(id, ring);
  return contours;
}

const solidCache = new WeakMap<WallGeometry, ReturnType<typeof wallContourSolid>[]>();
export function connectedWallSolids(project: WallGeometry) {
  const cached = solidCache.get(project);
  if (cached) return cached;
  const contours = connectedWallContours(project);
  const result = project.storey.walls
    .filter((w) => contours.has(w.id))
    .map((w) =>
      wallContourSolid(
        w,
        contours.get(w.id)!,
        project.storey.windows,
        project.storey.wallTJunctions.some(
          (t) => t.hostWallId === w.id || t.incoming.wallId === w.id,
        ),
      ),
    );
  solidCache.set(project, result);
  return result;
}
