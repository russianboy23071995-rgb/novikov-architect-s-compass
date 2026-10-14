import { prepareTranslation } from "../../domain/project/prepared-translation.ts";
import { validateProject, type Project, type Point } from "../../domain/project/schema.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import type { GeometryPreview } from "../../domain/project/geometry-scope.ts";

/** Compose the proven storey action; never flatten stores or publish partial commits. */
export function prepareSelectionTranslation(source: Project, ids: readonly string[]) {
  const selected = new Set(ids);
  const owners = source.storeys
    .map((s) => ({
      storey: s,
      ids: [...s.walls, ...s.windows, ...(s.lines ?? []), ...s.hatches, ...s.references]
        .filter((e) => selected.has(e.id))
        .map((e) => e.id),
    }))
    .filter((s) => s.ids.length);
  if (
    !ids.length ||
    new Set(ids).size !== ids.length ||
    owners.reduce((n, s) => n + s.ids.length, 0) !== ids.length
  )
    throw new Error("Ungültige Bewegungsauswahl.");
  // Preserve the existing fast path, including its dependency-closure preview.
  if (owners.length === 1 && owners[0]!.storey.id === storeyOf(source).id)
    return prepareTranslation(source, ids);
  const fingerprint = JSON.stringify(validateProject(source));
  const parts = owners.map(({ storey, ids }) => {
    const scope = { ...source, workingStoreyId: storey.id };
    return { id: storey.id, scope, action: prepareTranslation(scope, ids) };
  });
  const activeId = storeyOf(source).id;
  const active = parts.find((p) => p.id === activeId);
  const empty: GeometryPreview = {
    geometry: {
      assets: [],
      storey: {
        walls: [],
        windows: [],
        wallJoins: [],
        wallTJunctions: [],
        lines: [],
        hatches: [],
        references: [],
      },
    },
    replacedIds: [],
  };
  return {
    replacedIds: active?.action.replacedIds ?? [],
    evaluate(delta: Point): GeometryPreview {
      // Every participating storey is evaluated, even though a plan only renders its own patch.
      const patches = parts.map((p) => ({ id: p.id, patch: p.action.evaluate(delta) }));
      return patches.find((p) => p.id === activeId)?.patch ?? empty;
    },
    materialize(current: Project, delta: Point): Project {
      if (current !== source || JSON.stringify(validateProject(current)) !== fingerprint)
        throw new Error("Modell geändert. Bewegung erneut beginnen.");
      // All results stay private until the final validation succeeds.
      const changed = new Map(
        parts.map((p) => [p.id, storeyOf(p.action.materialize(p.scope, delta))]),
      );
      if (delta.x === 0 && delta.y === 0) return current;
      return validateProject({
        ...current,
        storeys: current.storeys.map((s) => changed.get(s.id) ?? s),
      });
    },
  };
}
