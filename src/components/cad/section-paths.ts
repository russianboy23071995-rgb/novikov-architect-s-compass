import type { SectionPoint } from "@/rendering/viewport/section-drawing";

/**
 * Separate segments of a section drawing as one SVG path, y flipped: one element per view, not
 * one per edge (docs/performance/SECTION_ZOOM.md). Every segment is its own subpath, so caps and
 * dash patterns stay as with separate lines.
 */
export const segmentPath = (segments: readonly (readonly [SectionPoint, SectionPoint])[]) =>
  segments.map(([a, b]) => `M${a.x} ${-a.y}L${b.x} ${-b.y}`).join("");
