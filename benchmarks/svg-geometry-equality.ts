/** Diagnostic SVG comparison: preserve commands/order, allow only sub-nanometre roundoff. */
export function sameSvgGeometry(actual: string | null | undefined, expected: string): boolean {
  if (actual == null || /NaN|Infinity/.test(actual + expected)) return false;
  const number = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
  const a = actual.match(number) ?? [],
    b = expected.match(number) ?? [];
  if (actual.replace(number, "#") !== expected.replace(number, "#") || a.length !== b.length)
    return false;
  return a.every(
    (value, i) =>
      Number.isFinite(Number(value)) &&
      Number.isFinite(Number(b[i])) &&
      Math.abs(Number(value) - Number(b[i])) <= 1e-12,
  );
}
