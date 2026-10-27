import { windowPreviewSurfaces, type WindowSelectionSurface } from "./window-selection.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { GeometryPreview } from "../../domain/project/geometry-scope.ts";
import { buildPreviewSolid } from "./storey-solid.ts";
import { resolveStoreyLevels } from "../../domain/storeys/heights.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import type { DisplaySurfaces } from "./layer-display.ts";
import { composeSurfacePatch } from "./surface-patch.ts";
/** Replace only prepared dependency closures, at their original storey elevations. */
export function selectionMoveSurfaces(
  base: DisplaySurfaces,
  project: Project,
  patch: GeometryPreview,
  allows: (id: string) => boolean = () => true,
): DisplaySurfaces {
  const patches = patch.storeyPatches ?? [{ storeyId: storeyOf(project).id, ...patch }];
  const levels = resolveStoreyLevels(project.storeys, project.groundStoreyId);
  const removed = new Set(patches.flatMap((p) => [...p.replacedIds]));
  const faces: DisplaySurfaces["faces"] = [];
  const min = [...base.min] as [number, number, number],
    max = [...base.max] as [number, number, number];
  for (const p of patches) {
    const elevation = levels.find((l) => l.storeyId === p.storeyId)?.elevation;
    if (elevation == null) throw new Error("Unaufgelöste Vorschauhöhe.");
    const changed = buildPreviewSolid(p.geometry, elevation).faces;
    faces.push(...changed.filter((face) => allows(face.wallId)));
    // The stable base bounds already contain every unchanged vertex. Preserve
    // the existing conservative bounds, extending only with replacement faces.
    for (const face of changed)
      for (const point of face.vertices)
        for (const i of [0, 1, 2] as const) {
          min[i] = Math.min(min[i], point[i]);
          max[i] = Math.max(max[i], point[i]);
        }
  }
  return composeSurfacePatch(base, removed, faces, min, max);
}

export function selectionMoveWindows(
  base: readonly WindowSelectionSurface[],
  project: Project,
  patch: GeometryPreview,
  allows: (id: string) => boolean,
) {
  const patches = patch.storeyPatches ?? [{ storeyId: storeyOf(project).id, ...patch }];
  const levels = resolveStoreyLevels(project.storeys, project.groundStoreyId);
  const removed = new Set(patches.flatMap((p) => [...p.replacedIds]));
  return [
    ...base.filter((w) => !removed.has(w.id)),
    ...patches.flatMap((p) => {
      const z = levels.find((l) => l.storeyId === p.storeyId)?.elevation;
      if (z == null) throw new Error("Unaufgelöste Vorschauhöhe.");
      return windowPreviewSurfaces(p.geometry, z, allows);
    }),
  ];
}
