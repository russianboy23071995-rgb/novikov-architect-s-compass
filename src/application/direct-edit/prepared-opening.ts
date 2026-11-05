import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { wallDependencyClosure } from "../../domain/elements/wall/dependency-closure.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { editAtPointer, type EditSession } from "./session.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { GeometryPreview } from "../../domain/project/geometry-scope.ts";
import type { ElementTarget } from "../selection/target.ts";
import { hostedOpening } from "./transforms.ts";

/** Opening-axis preview for windows and doors: the existing full operation on a prepared
 * complete dependency scope. No alternative opening/cap/join rules. Confirmation remains
 * fullEdit on the real project. Every window and door of the scoped walls stays in scope,
 * so neighbouring openings keep cutting their walls during the preview.
 */
export function prepareOpeningAxisPreview(session: EditSession) {
  const { kind, id } = session.target;
  if ((kind !== "window" && kind !== "door") || session.action !== "axis")
    throw Error("Unsupported opening preview");
  const source = session.base,
    base = createProjectSnapshot(source),
    s = storeyOf(base);
  const { opening } = hostedOpening(base, { kind, id });
  const ids = wallDependencyClosure(base, [opening.wallId]);
  const local = createProjectSnapshot({
    ...base,
    assets: [],
    storeys: base.storeys.map((level) => ({
      ...level,
      walls: level.id === s.id ? level.walls.filter((w) => ids.has(w.id)) : [],
      windows: level.id === s.id ? level.windows.filter((w) => ids.has(w.wallId)) : [],
      ...(level.doors
        ? { doors: level.id === s.id ? level.doors.filter((d) => ids.has(d.wallId)) : [] }
        : {}),
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
  const localStorey = storeyOf(local);
  const replacedIds = Object.freeze(
    [...localStorey.walls, ...localStorey.windows, ...(localStorey.doors ?? [])].map((e) => e.id),
  );
  function resolve(current: Project, selection: ElementTarget | null, point: Point) {
    if (current !== source || selection?.kind !== target.kind || selection.id !== target.id)
      throw Error("Bearbeitungskontext geändert.");
    return editAtPointer(localSession, local, point);
  }
  return Object.freeze({
    affectedWalls: ids.size,
    evaluate(current: Project, selection: ElementTarget | null, point: Point): GeometryPreview {
      const next = resolve(current, selection, point);
      const geometry = { storey: storeyOf(next), assets: next.assets };
      return { geometry, replacedIds, storeyPatches: [{ storeyId: s.id, geometry, replacedIds }] };
    },
    materialize(current: Project, selection: ElementTarget | null, point: Point): Project {
      const next = resolve(current, selection, point);
      // The shared opening-axis action changes only this opening's relative position.
      // Keep the complete original project; the dependency scope is only a validation view.
      const { opening: moved } = hostedOpening(next, { kind, id });
      const changed = Object.freeze({ ...moved });
      return replaceStorey(
        base,
        kind === "window"
          ? { ...s, windows: s.windows.map((w) => (w.id === id ? (changed as typeof w) : w)) }
          : { ...s, doors: s.doors!.map((d) => (d.id === id ? (changed as typeof d) : d)) },
      );
    },
  });
}
