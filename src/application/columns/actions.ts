import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { standardLayerId } from "../../domain/layers/model.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { Column } from "../../domain/elements/column/model.ts";

type ColumnCreation = Omit<Column, "layerId" | "rotation" | "baseOffset"> & {
  layerId?: string;
  rotation?: number;
  baseOffset?: number;
};

/** The standard Stütze layer; columns use it unless a layer is chosen (docs/STUETZEN.md). */
export function defaultColumnLayerId(project: Project): string {
  const id = standardLayerId(project.layers, "column");
  if (!id) throw new Error("Die Standardebene Stütze fehlt.");
  return id;
}

/** Shared column creation for tool, text and future AI adapters; full validation, own snapshot.
 * Without a height rule the column is bound to the storey (top = OK raw floor above). */
export function addColumn(project: Project, column: ColumnCreation): Project {
  const bound = column.height === undefined && column.topBinding === undefined;
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      columns: [
        ...(storeyOf(project).columns ?? []),
        {
          ...column,
          rotation: column.rotation ?? 0,
          baseOffset: column.baseOffset ?? 0,
          ...(bound ? { topBinding: { kind: "storey" as const, topOffset: 0 } } : {}),
          layerId: column.layerId ?? defaultColumnLayerId(project),
        },
      ],
    }),
  });
}

/** One checked change of a column. A fixed height releases the storey binding and a binding
 * removes the fixed height, so exactly one height rule remains. */
export function updateColumn(
  project: Project,
  columnId: string,
  changes: Partial<Omit<Column, "id">>,
): Project {
  const columns = storeyOf(project).columns ?? [];
  if (!columns.some((c) => c.id === columnId)) throw new Error(`Unbekannte Stütze: ${columnId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      columns: columns.map((column) => {
        if (column.id !== columnId) return column;
        const next: Column = { ...column, ...changes, id: column.id };
        if (changes.height !== undefined) delete next.topBinding;
        if (changes.topBinding !== undefined) delete next.height;
        return next;
      }),
    }),
  });
}
