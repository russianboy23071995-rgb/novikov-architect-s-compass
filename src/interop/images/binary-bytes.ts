/** Convert the Latin-1 binary string returned by atob, without per-byte iterator callbacks. */
export function binaryBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
