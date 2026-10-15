import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { wallDependencyClosure } from "../../domain/elements/wall/dependency-closure.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { editAtPointer, type EditSession } from "../../lib/bim/direct-edit.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { GeometryPreview } from "../../domain/project/geometry-scope.ts";
import type { ElementTarget } from "../selection/target.ts";

/** Window-axis pilot: existing full operation on a prepared complete dependency scope.
 * No alternative window/cap/join rules. Confirmation remains fullEdit on the real project.
 */
export function prepareWindowAxisPreview(session: EditSession) {
  if (session.target.kind !== "window" || session.action !== "axis")
    throw Error("Unsupported window preview");
  const source = session.base,
    base = createProjectSnapshot(source),
    s = storeyOf(base);
  const window = s.windows.find((w) => w.id === session.target.id);
  if (!window) throw Error("Unknown window");
  const ids = wallDependencyClosure(base, [window.wallId]);
  const local = createProjectSnapshot({
    ...base,
    assets: [],
    storeys: base.storeys.map((level) => ({
      ...level,
      walls: level.id === s.id ? level.walls.filter((w) => ids.has(w.id)) : [],
      windows: level.id === s.id ? level.windows.filter((w) => ids.has(w.wallId)) : [],
      wallJoins: level.id === s.id ? level.wallJoins.filter((j) => ids.has(j.first.wallId)) : [],
      wallTJunctions:
        level.id === s.id ? level.wallTJunctions.filter((j) => ids.has(j.hostWallId)) : [],
      lines: [],
      hatches: [],
      references: [],
    })),
  });
  const target = Object.freeze({ ...session.target });
  const localSession: EditSession = Object.freeze({
    ...session,
    base: local,
    target,
    anchor: Object.freeze({ ...session.anchor }),
  });
  const replacedIds = Object.freeze(
    [...storeyOf(local).walls, ...storeyOf(local).windows].map((e) => e.id),
  );
  return Object.freeze({
    affectedWalls: ids.size,
    evaluate(current: Project, selection: ElementTarget | null, point: Point): GeometryPreview {
      if (current !== source || selection?.kind !== target.kind || selection.id !== target.id)
        throw Error("Bearbeitungskontext geändert.");
      const next = editAtPointer(localSession, local, point);
      const geometry = { storey: storeyOf(next), assets: next.assets };
      return { geometry, replacedIds, storeyPatches: [{ storeyId: s.id, geometry, replacedIds }] };
    },
  });
}
