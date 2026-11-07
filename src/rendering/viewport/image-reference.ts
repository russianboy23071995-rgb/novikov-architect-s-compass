import type { ImageReference, ImageAsset } from "../../domain/elements/reference/model.ts";
import type { Project } from "../../domain/project/schema.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { contains } from "../../geometry/polygons/contains.ts";
export function imageReferenceCorners(r: ImageReference, a: ImageAsset) {
  const c = Math.cos(r.rotation),
    s = Math.sin(r.rotation);
  return [
    [0, 0],
    [a.pixelWidth, 0],
    [a.pixelWidth, -a.pixelHeight],
    [0, -a.pixelHeight],
  ].map(([u, v]) => ({
    x: r.origin.x + r.metresPerPixel * (c * u! - s * v!),
    y: r.origin.y + r.metresPerPixel * (s * u! + c * v!),
  }));
}

/** The topmost locked underlay of the working storey under a plan point (docs/BILDUNTERLAGE.md, B2). */
export function lockedReferenceAt(
  project: Project,
  point: { x: number; y: number },
  visible: (id: string) => boolean,
): string | undefined {
  return storeyOf(project)
    .references.filter((r) => r.locked && visible(r.id))
    .reverse()
    .find((r) => {
      const asset = project.assets.find((a) => a.id === r.assetId);
      return asset && contains(imageReferenceCorners(r, asset), point);
    })?.id;
}
