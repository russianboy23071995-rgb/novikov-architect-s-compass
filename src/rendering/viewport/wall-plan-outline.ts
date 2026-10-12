import type { WallGeometry } from "../../domain/project/geometry-scope.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import { coordinatesCompatible, pointsCompatible } from "../../geometry/tolerances/model.ts";
import { connectedWallContours } from "../../domain/elements/wall/connections.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";

type Edge = { start: Point2; end: Point2 };
const edges = (ring: readonly Point2[]): Edge[] =>
  ring.map((start, i) => ({ start, end: ring[(i + 1) % ring.length]! }));

/** Disposable plan strokes. Only persisted, visible partners may remove a seam.
 * Individual fill/hit polygons and BIM identities remain intact. */
export function wallPlanOutlines(project: WallGeometry, visibleIds: ReadonlySet<string>) {
  const contours = connectedWallContours(project);
  const rings = new Map(
    project.storey.walls
      .filter((w) => visibleIds.has(w.id))
      .map((w) => [w.id, contours.get(w.id) ?? wallBody(w).corners]),
  );
  const partners = new Map<string, string[]>();
  const pairs = [
    ...project.storey.wallJoins.map((j) => [j.first.wallId, j.second.wallId]),
    ...project.storey.wallTJunctions.map((j) => [j.hostWallId, j.incoming.wallId]),
  ];
  for (const [a, b] of pairs) {
    if (!rings.has(a!) || !rings.has(b!)) continue;
    partners.set(a!, [...(partners.get(a!) ?? []), b!]);
    partners.set(b!, [...(partners.get(b!) ?? []), a!]);
  }
  return new Map(
    [...rings].map(([id, ring]) => {
      const neighbourEdges = (partners.get(id) ?? []).flatMap((p) => edges(rings.get(p)!));
      const outline = edges(ring).flatMap((edge) => {
        const dx = edge.end.x - edge.start.x,
          dy = edge.end.y - edge.start.y;
        const length = Math.hypot(dx, dy),
          ux = dx / length,
          uy = dy / length;
        const along = (p: Point2) => (p.x - edge.start.x) * ux + (p.y - edge.start.y) * uy;
        const onLine = (p: Point2) =>
          pointsCompatible(p, { x: edge.start.x + along(p) * ux, y: edge.start.y + along(p) * uy });
        let intervals = [[0, length]];
        for (const other of neighbourEdges) {
          if (!onLine(other.start) || !onLine(other.end)) continue;
          const from = Math.max(0, Math.min(along(other.start), along(other.end)));
          const to = Math.min(length, Math.max(along(other.start), along(other.end)));
          if (to <= from) continue;
          intervals = intervals.flatMap(([a, b]) =>
            to <= a! || from >= b!
              ? [[a!, b!]]
              : [
                  [a!, Math.max(a!, from)],
                  [Math.min(b!, to), b!],
                ].filter(([x, y]) => !coordinatesCompatible(x!, y!)),
          );
        }
        const at = (d: number) => ({ x: edge.start.x + ux * d, y: edge.start.y + uy * d });
        return intervals.map(([a, b]) => ({ start: at(a!), end: at(b!) }));
      });
      return [id, outline];
    }),
  );
}
