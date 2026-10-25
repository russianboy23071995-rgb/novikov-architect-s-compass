// Derived data per model snapshot (indexes, geometry). Weak keys keep discarded snapshots
// collectable; snapshots that the undo history keeps alive release their entries explicitly,
// so the history holds model data only (docs/performance/HISTORY_MEMORY.md).
const registry: WeakMap<object, unknown>[] = [];

/** A weak cache whose entries the undo history may drop for snapshots it keeps. */
export function createDerivedCache<K extends object, V>(): WeakMap<K, V> {
  const cache = new WeakMap<K, V>();
  registry.push(cache as WeakMap<object, unknown>);
  return cache;
}

let released = 0;
/** Diagnostic count of dropped entries, for tests and measurements. */
export const releasedDerivedCount = () => released;

/** Drop every derived entry of a snapshot; the next request rebuilds it from the model. */
export function releaseDerivedData(snapshot: object): void {
  for (const cache of registry) if (cache.delete(snapshot)) released++;
}
