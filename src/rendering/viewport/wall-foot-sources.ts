import { buildSolid } from "../../lib/bim/geometry.ts";
import type { Project } from "../../lib/bim/model.ts";
import type { SnapReference } from "../../constraints/snapping/engine.ts";
import { createPrimitiveSourceIndex } from "../../constraints/snapping/local-source-index.ts";
import { selectionEdges } from "./selection-outline.ts";

const cache = new WeakMap<Project, ReturnType<typeof createPrimitiveSourceIndex>>();

/** Real z=0 material edges, including gaps from openings reaching the floor.
 * Uses the same conforming mesh boundary extraction as selection outlines.
 * Stable geometry identities and local indexing are shared, never per tool.
 */
export function getWallFootSources(project: Project) {
  const cached = cache.get(project);
  if (cached) return cached;
  const solid = buildSolid(project);
  const grouped = new Map<string, typeof solid.faces>();
  for (const face of solid.faces) {
    const faces = grouped.get(face.wallId) ?? [];
    faces.push(face);
    grouped.set(face.wallId, faces);
  }
  const references: SnapReference[] = [];
  for (const [id, faces] of grouped) {
    for (const [a, b] of selectionEdges(faces)) {
      if (a[2] !== 0 || b[2] !== 0) continue;
      const start = { x: a[0], y: a[1] },
        end = { x: b[0], y: b[1] };
      references.push({
        entityId: id,
        feature: `foot-edge:${JSON.stringify([a, b])}`,
        kind: "midpoint",
        point: { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 },
        segment: { start, end },
        directions: [{ x: b[0] - a[0], y: b[1] - a[1] }],
      });
    }
  }
  const index = createPrimitiveSourceIndex({
    references,
    segments: references.map((source) => ({ ...source.segment!, source })),
  });
  cache.set(project, index);
  return index;
}
