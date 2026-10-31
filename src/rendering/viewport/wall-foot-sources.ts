import { workingStoreyElevation } from "../../domain/storeys/elevation.ts";
import { buildingFacePart, workingStoreySolid } from "./building-solid.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { SnapReference } from "../../constraints/snapping/engine.ts";
import { createPrimitiveSourceIndex } from "../../constraints/snapping/local-source-index.ts";
import { selectionEdges } from "./selection-outline.ts";
import { createDerivedCache } from "../../domain/project/derived-cache.ts";

const cache = createDerivedCache<Project, ReturnType<typeof createPrimitiveSourceIndex>>();
// Per working-storey part of the building scene (same storey object, elevation and assets):
// undo, redo and edits on other storeys find the sources again (docs/performance/UNDO_STOREY_REUSE.md).
const byPart = new WeakMap<object, ReturnType<typeof createPrimitiveSourceIndex>>();

/** Real material edges at the active storey elevation, including gaps from openings reaching the floor.
 * Uses the same conforming mesh boundary extraction as selection outlines.
 * Stable geometry identities and local indexing are shared, never per tool.
 */
export function getWallFootSources(project: Project) {
  const cached = cache.get(project);
  if (cached) return cached;
  const solid = workingStoreySolid(project);
  const known = buildingFacePart(solid.faces[0] ?? {}) === solid ? byPart.get(solid) : undefined;
  if (known) {
    cache.set(project, known);
    return known;
  }
  const elevation = workingStoreyElevation(project);
  const grouped = new Map<string, typeof solid.faces>();
  for (const face of solid.faces) {
    // Wall feet only: ceiling slab faces are no wall (docs/SLAB_ELEMENT.md, Teil B).
    if (face.slab || face.roof || face.column || face.stair) continue;
    const faces = grouped.get(face.wallId) ?? [];
    faces.push(face);
    grouped.set(face.wallId, faces);
  }
  const references: SnapReference[] = [];
  for (const [id, faces] of grouped) {
    for (const [a, b] of selectionEdges(faces)) {
      if (a[2] !== elevation || b[2] !== elevation) continue;
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
  // Only reusable (owned) parts are keys; their faces map back to them.
  if (buildingFacePart(solid.faces[0] ?? {}) === solid) byPart.set(solid, index);
  return index;
}
