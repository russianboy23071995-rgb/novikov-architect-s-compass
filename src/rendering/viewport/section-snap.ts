import { querySnap } from "../../constraints/snapping/engine.ts";
import type { SectionDrawing, SectionPoint } from "./section-drawing.ts";

/**
 * Snap in a section or elevation drawing (docs/SCHNITT.md, BS2): corners of cut outlines and open
 * pieces, corners and edge ends of parts seen beyond, and the storey levels. The nearest corner
 * within the radius wins; otherwise a storey level within the radius gives its height at the
 * cursor; otherwise the cursor itself. Drawing coordinates in metres. The same engine as the
 * plan decides (docs/ANPASSUNGSLISTE.md, 11): the Rasterengine switch turns snapping off, and
 * `shiftFrom` holds the 45° axis from that point, a corner near the cursor ending level with it.
 */
export type SectionSnap = { point: SectionPoint; kind: "corner" | "level" | "free" };

export type SectionSnapOptions = { enabled?: boolean; shiftFrom?: SectionPoint | null };

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
  { enabled = true, shiftFrom = null }: SectionSnapOptions = {},
): SectionSnap {
  const { point, candidate } = querySnap(cursor, {
    references: corners.map((p, i) => ({ entityId: "section", feature: String(i), point: p })),
    pixelsPerMetre: 1,
    enabled,
    endpointRadiusPx: radius,
    gridSpacing: null,
    orthoOrigin: null,
    angleOrigin: shiftFrom,
  });
  if (candidate && candidate.kind !== "angle")
    return { point: { x: point.x, y: point.y }, kind: "corner" };
  if (shiftFrom) return { point: { x: point.x, y: point.y }, kind: "free" };
  if (!enabled) return { point: { x: cursor.x, y: cursor.y }, kind: "free" };
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
