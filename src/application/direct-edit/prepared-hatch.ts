import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { editAtPointer, type EditSession } from "../../lib/bim/direct-edit.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../selection/target.ts";
import type { PreparedDirectEditPreview } from "./prepared-preview.ts";

/** Point edits have no neighbour dependencies. Run the existing operation on the
 * single hatch, retaining project metadata/pattern definitions. Never commit this scope.
 */
export function prepareHatchPointPreview(session: EditSession): PreparedDirectEditPreview {
  if (session.target.kind !== "hatch" || session.action !== "point")
    throw Error("Unsupported hatch preview");
  const source = session.base,
    base = createProjectSnapshot(source),
    level = storeyOf(base);
  const hatch = level.hatches.find((h) => h.id === session.target.id);
  if (
    !hatch ||
    session.index === null ||
    !Number.isInteger(session.index) ||
    !hatch.points[session.index]
  )
    throw Error("Invalid hatch grip");
  const local = createProjectSnapshot({
    ...base,
    assets: [],
    storeys: base.storeys.map((s) => ({
      ...s,
      walls: [],
      windows: [],
      wallJoins: [],
      wallTJunctions: [],
      lines: [],
      hatches: s.id === level.id ? [hatch] : [],
      references: [],
    })),
  });
  const target = Object.freeze({ ...session.target });
  const pinned: EditSession = Object.freeze({
    ...session,
    base: local,
    target,
    anchor: Object.freeze({ ...session.anchor }),
  });
  const replacedIds = Object.freeze([hatch.id]);
  function resolve(current: Project, selection: ElementTarget | null, point: Point) {
    if (current !== source || selection?.id !== target.id || selection.kind !== target.kind)
      throw Error("Bearbeitungskontext geaendert.");
    return editAtPointer(pinned, local, point);
  }
  return Object.freeze({
    evaluate(current, selection, point) {
      const next = resolve(current, selection, point);
      const geometry = { storey: storeyOf(next), assets: [] };
      return {
        geometry,
        replacedIds,
        storeyPatches: [{ storeyId: level.id, geometry, replacedIds }],
      };
    },
    materialize(current, selection, point) {
      const changed = storeyOf(resolve(current, selection, point)).hatches[0]!;
      // Legacy 2D consumer still needs a Project-shaped derived view. Reuse every
      // unaffected entity; validation/publication remains exclusively at fullEdit.
      return replaceStorey(base, {
        ...level,
        hatches: level.hatches.map((h) => (h.id === changed.id ? changed : h)),
      });
    },
  } satisfies PreparedDirectEditPreview);
}
