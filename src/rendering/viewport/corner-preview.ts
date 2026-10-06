import type { CornerPreview } from "../../application/walls/corner-preview.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { DisplaySurfaces } from "./layer-display.ts";

/** Replace exactly the explicit pair; no editable model or second miter calculation. */
export function cornerPreviewSurfaces(
  project: Project,
  base: DisplaySurfaces,
  preview: CornerPreview,
): DisplaySurfaces {
  if (preview.base !== project) throw new Error("Veraltete Anschlussvorschau.");
  const ids = new Set(preview.geometry.walls.map((w) => w.wallId));
  const faces = [
    ...base.faces.filter((f) => !ids.has(f.wallId)),
    ...preview.geometry.walls.flatMap((w) => w.faces),
  ];
  const min = [...base.min] as [number, number, number],
    max = [...base.max] as [number, number, number];
  for (const face of faces)
    for (const p of face.vertices)
      for (const i of [0, 1, 2] as const) {
        min[i] = Math.min(min[i], p[i]);
        max[i] = Math.max(max[i], p[i]);
      }
  return { faces, min, max };
}
