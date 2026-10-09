import type { Point2 } from "../../../geometry/primitives/point.ts";
export type StyleSegment = { start: Point2; end: Point2 };
export type LineStyleDefinition = {
  id: string;
  name: string;
  dashes: readonly number[];
  color?: string;
  period?: number;
  segments?: readonly StyleSegment[];
};
export type ValidatedLineStyleDefinition = LineStyleDefinition & {
  color: string;
  period: number;
  segments: readonly StyleSegment[];
};
export function validateLineStyle(style: LineStyleDefinition): ValidatedLineStyleDefinition {
  if (
    !style ||
    typeof style.id !== "string" ||
    !style.id.trim() ||
    typeof style.name !== "string" ||
    !style.name.trim() ||
    style.name.trim().length > 80 ||
    !Array.isArray(style.dashes)
  )
    throw new Error("Linienart benötigt ID und Namen (maximal 80 Zeichen).");
  const color = style.color ?? "#334155";
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error("Ungültige Linienfarbe.");
  let period = style.period;
  let segments = style.segments;
  if (!segments) {
    if (
      style.dashes.length < 2 ||
      style.dashes.length > 32 ||
      style.dashes.length % 2 ||
      !style.dashes.every((v) => Number.isFinite(v) && v > 0 && v <= 1000)
    )
      throw new Error("Ungültiges Strich-/Lückenmuster.");
    period = style.dashes.reduce((sum, v) => sum + v, 0);
    let x = 0;
    const derived: StyleSegment[] = [];
    for (let i = 0; i < style.dashes.length; i++) {
      const next = x + style.dashes[i]!;
      if (i % 2 === 0) derived.push({ start: { x, y: 0 }, end: { x: next, y: 0 } });
      x = next;
    }
    segments = derived;
  }
  if (
    !Number.isFinite(period) ||
    period! <= 0 ||
    period! > 32000 ||
    !Array.isArray(segments) ||
    segments.length < 1 ||
    segments.length > 128
  )
    throw new Error(
      "Eine Linienstruktur mit 1–128 Abschnitten und positiver Wiederholungslänge benötigt.",
    );
  for (const line of segments) {
    if (!line?.start || !line?.end) throw new Error("Ungültiger Linienabschnitt.");
    for (const p of [line.start, line.end])
      if (
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        p.x < 0 ||
        p.x > period! ||
        Math.abs(p.y) > 10
      )
        throw new Error("Linienstruktur außerhalb des Zeichenfeldes.");
    if (Math.hypot(line.end.x - line.start.x, line.end.y - line.start.y) < 1e-8)
      throw new Error("Nullabschnitt ist nicht erlaubt.");
  }
  return {
    id: style.id,
    name: style.name.trim(),
    dashes: [...style.dashes],
    color,
    period: period!,
    segments: segments.map((line) => ({ start: { ...line.start }, end: { ...line.end } })),
  };
}
