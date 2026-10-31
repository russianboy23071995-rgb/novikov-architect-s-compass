import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { standardLayerId } from "../../domain/layers/model.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import { STAIR_DEFAULTS, type Stair } from "../../domain/elements/stair/model.ts";

type StairCreation = Pick<Stair, "id" | "start"> & Partial<Omit<Stair, "id" | "start" | "shape">>;

/** The standard Treppe layer; stairs use it unless a layer is chosen (docs/TREPPE.md). */
export function defaultStairLayerId(project: Project): string {
  const id = standardLayerId(project.layers, "stair");
  if (!id) throw new Error("Die Standardebene Treppe fehlt.");
  return id;
}

/** Shared stair creation for tool and future AI adapters; defaults for every unset value.
 * Without a height rule the stair climbs to the storey above. */
export function addStair(project: Project, stair: StairCreation): Project {
  const bound = stair.height === undefined && stair.topBinding === undefined;
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      stairs: [
        ...(storeyOf(project).stairs ?? []),
        {
          ...STAIR_DEFAULTS,
          ...stair,
          ...(bound ? { topBinding: { kind: "storey" as const, topOffset: 0 } } : {}),
          layerId: stair.layerId ?? defaultStairLayerId(project),
        },
      ],
    }),
  });
}

/** One checked change. A fixed height releases the storey binding and vice versa; an explicit
 * `riserCount: undefined` or `tread: undefined` returns that value to the calculation. */
export function updateStair(
  project: Project,
  stairId: string,
  changes: Partial<Omit<Stair, "id">>,
): Project {
  const stairs = storeyOf(project).stairs ?? [];
  if (!stairs.some((s) => s.id === stairId)) throw new Error(`Unbekannte Treppe: ${stairId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      stairs: stairs.map((stair) => {
        if (stair.id !== stairId) return stair;
        const next: Stair = { ...stair, ...changes, id: stair.id };
        if (changes.height !== undefined) delete next.topBinding;
        if (changes.topBinding !== undefined) delete next.height;
        for (const key of ["riserCount", "tread"] as const)
          if (key in changes && changes[key] === undefined) delete next[key];
        return next;
      }),
    }),
  });
}
