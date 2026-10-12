/** Frozen pre-pilot full path (PR171). Tests/diagnostics only; never product imports. */
import { validateProject, type Project, type Point } from "../src/domain/project/schema.ts";
import type { SelectionSet } from "../src/application/selection/state.ts";
export function fullSelectionMove(current: Project, targets: SelectionSet, point: Point): Project {
  const session = { origin: { x: 0, y: 0 } };
  const dx = point.x - session.origin.x,
    dy = point.y - session.origin.y;
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) throw new Error("Ungültige Bewegung.");
  if (dx === 0 && dy === 0) return current;
  const ids = new Set(targets.map((t) => t.id));
  const translate = (p: Point): Point => ({ x: p.x + dx, y: p.y + dy });
  const s = current.storey;
  return validateProject({
    ...current,
    storey: {
      ...s,
      references: s.references.map((r) =>
        ids.has(r.id) ? { ...r, origin: translate(r.origin) } : r,
      ),
      walls: s.walls.map((w) =>
        ids.has(w.id) ? { ...w, start: translate(w.start), end: translate(w.end) } : w,
      ),
      lines: s.lines?.map((l) => (ids.has(l.id) ? { ...l, points: l.points.map(translate) } : l)),
      hatches: s.hatches.map((h) =>
        ids.has(h.id) ? { ...h, points: h.points.map(translate) } : h,
      ),
      wallJoins: s.wallJoins.filter((j) => ids.has(j.first.wallId) === ids.has(j.second.wallId)),
      wallTJunctions: s.wallTJunctions.filter(
        (j) => ids.has(j.hostWallId) === ids.has(j.incoming.wallId),
      ),
    },
  });
}
