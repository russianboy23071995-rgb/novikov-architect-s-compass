/**
 * Height mark (Höhenkote) of section and elevation drawings after DIN 1356-1
 * (docs/SCHNITT.md, BS1): an equilateral triangle standing on its tip on the
 * reference line, filled for shell heights (Rohbau), open for finished heights (Fertig), and the
 * height in metres with sign beside it. Drawing coordinates: x along the line, z upwards, metres.
 */
export type HeightMarkKind = "shell" | "finish";

export type HeightMarkGeometry = {
  /** Triangle, tip first, on the reference line at x. */
  triangle: { x: number; z: number }[];
  /** Short reference line through the tip. */
  line: { from: number; to: number };
  /** Start of the height text above the line; it reads away from the drawing on the left. */
  text: { x: number; z: number; anchor: "start" | "end" };
};

/** ±0,00 at zero; otherwise sign and two decimals with a comma (+2,80, −0,16). */
export function formatHeight(z: number): string {
  if (Math.abs(z) < 0.005) return "±0,00";
  return `${z > 0 ? "+" : "−"}${Math.abs(z).toFixed(2).replace(".", ",")}`;
}

/**
 * Geometry of a mark at x for height z. side "left": the text runs to the left of the triangle
 * (outside a drawing border on its left); "right": to the right. size = triangle width.
 */
export function heightMarkGeometry(
  x: number,
  z: number,
  side: "left" | "right",
  size: number,
): HeightMarkGeometry {
  const h = (size * Math.sqrt(3)) / 2;
  const sign = side === "left" ? -1 : 1;
  return {
    triangle: [
      { x, z },
      { x: x - size / 2, z: z + h },
      { x: x + size / 2, z: z + h },
    ],
    line: { from: Math.min(x, x + sign * size * 4), to: Math.max(x, x + sign * size * 4) },
    text: { x: x + sign * size * 0.75, z: z + h * 0.25, anchor: side === "left" ? "end" : "start" },
  };
}
