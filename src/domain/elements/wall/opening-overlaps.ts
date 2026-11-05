import { wallLength } from "../../project/schema.ts";
import { coordinatesCompatible } from "../../../geometry/tolerances/model.ts";
import { openingNoun, storeyOpenings, type WallOpening } from "./openings.ts";

type OpeningStorey = Parameters<typeof storeyOpenings>[0];
export type OpeningOverlap = { wallId: string; first: string; second: string };

/** Openings of one wall overlap when they intersect both along the wall and in height.
 * Touching edges and openings stacked above each other (e.g. a transom over a door) do not.
 * Overlaps stay allowed (user decision 24.10.2026); this only feeds hints, never validation.
 */
export function openingOverlaps(storey: OpeningStorey): OpeningOverlap[] {
  const walls = new Map(storey.walls.map((w) => [w.id, w]));
  const byWall = new Map<string, WallOpening[]>();
  for (const opening of storeyOpenings(storey)) {
    const list = byWall.get(opening.wallId);
    if (list) list.push(opening);
    else byWall.set(opening.wallId, [opening]);
  }
  const overlaps: OpeningOverlap[] = [];
  for (const [wallId, openings] of byWall) {
    if (openings.length < 2) continue;
    const length = wallLength(walls.get(wallId)!);
    const spans = openings.map((o) => ({
      id: o.id,
      left: o.position * length - o.width / 2,
      right: o.position * length + o.width / 2,
      bottom: o.sillHeight,
      top: o.sillHeight + o.height,
    }));
    for (let i = 0; i < spans.length; i++)
      for (let j = i + 1; j < spans.length; j++) {
        const a = spans[i]!,
          b = spans[j]!;
        const along = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const vertical = Math.min(a.top, b.top) - Math.max(a.bottom, b.bottom);
        if (
          along > 0 &&
          vertical > 0 &&
          !coordinatesCompatible(along, 0) &&
          !coordinatesCompatible(vertical, 0)
        )
          overlaps.push({ wallId, first: a.id, second: b.id });
      }
  }
  return overlaps;
}

/** Overlaps that involve one of the given openings, as one readable German hint or "". */
export function openingOverlapHint(storey: OpeningStorey, ids: ReadonlySet<string>): string {
  const pairs = openingOverlaps(storey).filter((o) => ids.has(o.first) || ids.has(o.second));
  if (!pairs.length) return "";
  const marks = new Map(
    [...storey.windows, ...(storey.doors ?? [])].map((o) => [o.id, o.mark ?? o.id]),
  );
  const name = (id: string) => `${openingNoun(storey, id)} ${marks.get(id) ?? id}`;
  return `Hinweis: ${pairs.map((o) => `${name(o.first)} überlappt ${name(o.second)}`).join(" · ")}`;
}

/** Openings that are new or changed in `after`; the hint of a preview concerns only these. */
export function changedOpeningIds(before: OpeningStorey, after: OpeningStorey): Set<string> {
  const key = (o: WallOpening) => [o.wallId, o.position, o.width, o.height, o.sillHeight].join();
  const old = new Map(storeyOpenings(before).map((o) => [o.id, key(o)]));
  return new Set(
    storeyOpenings(after)
      .filter((o) => old.get(o.id) !== key(o))
      .map((o) => o.id),
  );
}
