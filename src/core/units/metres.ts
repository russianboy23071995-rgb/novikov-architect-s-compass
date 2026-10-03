export function parseMetres(text: string): number {
  const normalized = text.trim().replace(",", ".");
  return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized) && Number.isFinite(Number(normalized))
    ? Number(normalized)
    : NaN;
}
