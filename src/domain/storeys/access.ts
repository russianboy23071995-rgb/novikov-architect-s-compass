export type StoreySource =
  | { storey: unknown }
  | { storeys: unknown[]; groundStoreyId: string; workingStoreyId?: string | undefined };
type StoreyOf<P> = P extends { storey: unknown }
  ? P["storey"]
  : P extends { storeys: unknown[] }
    ? P["storeys"][number]
    : undefined;
/** A scoped geometry calculation may own one storey; persisted projects only own storeys.
 * The persisted working-view context selects one storey; legacy files default to EG.
 * This never changes the building datum or duplicates storey geometry.
 */
export function storeyOf<P extends StoreySource | undefined>(source: P): StoreyOf<P> {
  if (!source) return undefined as StoreyOf<P>;
  if ("storey" in source) return source.storey as StoreyOf<P>;
  const result = source.storeys.find(
    (s) => (s as { id: string }).id === (source.workingStoreyId ?? source.groundStoreyId),
  );
  if (!result) throw new Error("Das Bezugsgeschoss fehlt.");
  return result as StoreyOf<P>;
}
type Replaced<P, T> = P extends { storey: unknown }
  ? Omit<P, "storey"> & { storey: T }
  : Omit<P, "storeys"> & { storeys: (StoreyOf<P> | T)[] };
export function replaceStorey<P extends StoreySource, T>(source: P, storey: T): Replaced<P, T> {
  if ("storey" in source) return { ...source, storey } as unknown as Replaced<P, T>;
  const id = (storey as { id: string }).id;
  if (!source.storeys.some((s) => (s as { id: string }).id === id))
    throw new Error("Unbekanntes Geschoss.");
  return {
    ...source,
    storeys: source.storeys.map((s) => ((s as { id: string }).id === id ? storey : s)),
  } as unknown as Replaced<P, T>;
}
/** The storey directly above in the sequence (lowest to highest), or undefined for the top one.
 * Read where a storey needs the floor above it, e.g. room ceilings (docs/SLAB_ELEMENT.md). */
export function storeyAbove<S extends { id: string }>(
  source: { storeys: readonly S[] },
  storeyId: string,
): S | undefined {
  const index = source.storeys.findIndex((s) => s.id === storeyId);
  return index < 0 ? undefined : source.storeys[index + 1];
}
