/**
 * Resolution a PNG or JPEG file states for itself (docs/BILDUNTERLAGE.md, B1): the pHYs chunk of
 * a PNG, the JFIF density of a JPEG. Scanners write it; with the plan scale it gives the size of
 * an underlay. Null when the file states none, states only an aspect ratio, or a value outside
 * 10–10000 dpi.
 */
export function imageDpi(bytes: Uint8Array): number | null {
  const uint = (i: number, n: number) => {
    let v = 0;
    for (let k = 0; k < n; k++) v = v * 256 + (bytes[i + k] ?? 0);
    return v;
  };
  const plausible = (x: number, y: number) => {
    if (!(x > 0) || Math.abs(x - y) > 0.01 * x) return null;
    // PNG stores whole pixels per metre: 150 dpi comes back as 150.01, so near whole values win.
    const dpi = Math.abs(x - Math.round(x)) < 0.05 ? Math.round(x) : Math.round(x * 100) / 100;
    return dpi >= 10 && dpi <= 10000 ? dpi : null;
  };
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  if (png) {
    for (let i = 8; i + 12 <= bytes.length;) {
      const length = uint(i, 4);
      const type = String.fromCharCode(...bytes.subarray(i + 4, i + 8));
      if (type === "IDAT" || type === "IEND") break;
      if (type === "pHYs" && length >= 9 && i + 17 <= bytes.length)
        // Unit 1: pixels per metre; unit 0 states an aspect ratio only.
        return bytes[i + 16] === 1
          ? plausible(uint(i + 8, 4) * 0.0254, uint(i + 12, 4) * 0.0254)
          : null;
      i += 12 + length;
    }
    return null;
  }
  if (bytes[0] !== 255 || bytes[1] !== 216) return null;
  for (let i = 2; i + 4 <= bytes.length;) {
    if (bytes[i] !== 255) return null;
    const marker = bytes[i + 1]!;
    if (marker === 218 || marker === 217) return null;
    const length = uint(i + 2, 2);
    const jfif = String.fromCharCode(...bytes.subarray(i + 4, i + 9)) === "JFIF\0";
    if (marker === 224 && jfif && length >= 14) {
      const units = bytes[i + 11],
        x = uint(i + 12, 2),
        y = uint(i + 14, 2);
      // Units 1: dots per inch, 2: dots per centimetre, 0: aspect ratio only.
      return units === 1 ? plausible(x, y) : units === 2 ? plausible(x * 2.54, y * 2.54) : null;
    }
    i += 2 + length;
  }
  return null;
}
