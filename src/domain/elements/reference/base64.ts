// Private ASCII lookup: zero/undefined means invalid; otherwise sextet value + 1.
const digits = new Uint8Array(128);
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for (let i = 0; i < alphabet.length; i++) digits[alphabet.charCodeAt(i)] = i + 1;

/** Nonempty canonical storage encoding. Byte/pixel budgets remain with the asset schema. */
export function isCanonicalBase64(value: string): boolean {
  if (value.length < 4 || value.length % 4 !== 0) return false;
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  const end = value.length - padding;
  for (let i = 0; i < end; i++) {
    if (!digits[value.charCodeAt(i)]) return false;
  }
  return (
    padding === 0 || ((digits[value.charCodeAt(end - 1)]! - 1) & (padding === 2 ? 15 : 3)) === 0
  );
}
