import type { SectionDrawing, SectionPoint } from "./section-drawing.ts";

/**
 * Snap in a section or elevation drawing (docs/SCHNITT.md, BS2): corners of cut outlines and open
 * pieces, corners and edge ends of parts seen beyond, and the storey levels. The nearest corner
 * within the radius wins; otherwise a storey level within the radius gives its height at the
 * cursor; otherwise the cursor itself. Drawing coordinates in metres.
 */
export type SectionSnap = { point: SectionPoint; kind: "corner" | "level" | "free" };

export function sectionCorners(drawing: SectionDrawing): SectionPoint[] {
  return [
    ...drawing.cuts.flatMap((c) => [...c.loops.flat(), ...c.open.flat()]),
    ...drawing.views.flatMap((v) => [...v.points, ...v.edges.flat()]),
  ];
}

export function snapSectionPoint(
  corners: readonly SectionPoint[],
  levels: readonly number[],
  cursor: SectionPoint,
  radius: number,
): SectionSnap {
  let best: SectionPoint | null = null;
  let distance = radius;
  for (const p of corners) {
    const d = Math.hypot(p.x - cursor.x, p.y - cursor.y);
    if (d <= distance) {
      best = p;
      distance = d;
    }
  }
  if (best) return { point: { x: best.x, y: best.y }, kind: "corner" };
  const level = levels.reduce<number | null>(
    (near, z) =>
      Math.abs(z - cursor.y) <= radius &&
      (near === null || Math.abs(z - cursor.y) < Math.abs(near - cursor.y))
        ? z
        : near,
    null,
  );
  if (level !== null) return { point: { x: cursor.x, y: level }, kind: "level" };
  return { point: { x: cursor.x, y: cursor.y }, kind: "free" };
}
