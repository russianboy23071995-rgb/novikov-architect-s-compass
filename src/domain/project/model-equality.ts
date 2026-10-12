import type { Project } from "./schema.ts";

// Only schema-validated plain project data: finite numbers, dense arrays, no toJSON.
// Preserve serialized key order and omission of undefined optional object fields.
function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v, i) => equal(v, b[i]))
    );
  const left = a as Record<string, unknown>,
    right = b as Record<string, unknown>;
  const keys = Object.keys(left).filter((k) => left[k] !== undefined);
  const other = Object.keys(right).filter((k) => right[k] !== undefined);
  return (
    keys.length === other.length && keys.every((k, i) => k === other[i] && equal(left[k], right[k]))
  );
}

/** Exact model comparison after validation; view settings stay outside model history. */
export function sameProjectModel(a: Project, b: Project): boolean {
  const { bimVisibility: _a, workingViews: _av, ...left } = a;
  const { bimVisibility: _b, workingViews: _bv, ...right } = b;
  const model = (p: typeof left) => ({
    ...p,
    ...(p.drawingDocuments
      ? { drawingDocuments: p.drawingDocuments.map(({ hiddenLayerIds: _hidden, ...d }) => d) }
      : {}),
  });
  return equal(model(left), model(right));
}
