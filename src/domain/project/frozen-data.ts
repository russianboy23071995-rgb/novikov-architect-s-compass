// Provenance is private: only data frozen through freezeDeeply counts, never caller freezing.
const frozen = new WeakSet<object>();

/** Deeply freeze plain data this module's caller owns and remember it as immutable.
 * Already frozen subtrees are kept as they are. */
export function freezeDeeply<T extends object>(value: T): T {
  const visit = (node: unknown) => {
    if (node && typeof node === "object" && !Object.isFrozen(node)) {
      for (const child of Object.values(node)) visit(child);
      Object.freeze(node);
    }
  };
  visit(value);
  frozen.add(value);
  return value;
}

/** True only for objects passed to freezeDeeply: safe to share instead of copying. */
export function isFrozenDeeply(value: unknown): boolean {
  return typeof value === "object" && value !== null && frozen.has(value);
}
