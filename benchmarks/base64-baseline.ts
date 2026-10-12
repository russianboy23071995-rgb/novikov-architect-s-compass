/** Previous production contract, retained only as differential-test/measurement oracle. */
export function previousCanonicalBase64(value: string): boolean {
  if (value.length < 4 || value.length % 4 !== 0) return false;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  const end = value.length - padding;
  for (let i = 0; i < end; i++) if (!alphabet.includes(value[i]!)) return false;
  return padding === 0 || (alphabet.indexOf(value[end - 1]!) & (padding === 2 ? 15 : 3)) === 0;
}
