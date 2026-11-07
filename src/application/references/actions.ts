import { assertProjectRasterBudget } from "../../domain/project/raster-budget.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import {
  validateReferenceExtent,
  type ImageAsset,
  type ImageReference,
} from "../../domain/elements/reference/model.ts";
import type { Project } from "../../domain/project/schema.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { commitProject, type ProjectHistory } from "../history/project-history.ts";
export type CreateReferenceRequest = {
  projectId: string;
  asset: ImageAsset;
  reference: ImageReference;
};
/** Input assets have been verified by an import adapter; no browser decoding in Domain. */
export function previewCreateReference(
  base: Project,
  current: Project,
  request: CreateReferenceRequest,
): Project {
  if (base !== current || current.id !== request.projectId)
    throw new Error("Das Projekt wurde geändert. Import erneut beginnen.");
  if (request.reference.assetId !== request.asset.id) throw new Error("Asset reference mismatch");
  const next = validateLike(current, {
    ...replaceStorey(current, {
      ...storeyOf(current),
      references: [...storeyOf(current).references, request.reference],
    }),
    assets: [...current.assets, request.asset],
  });
  assertProjectRasterBudget(next);
  serializeProject(next); // Never commit a project that its file reader cannot reopen.
  return next;
}
/** What the element window of an underlay changes (docs/BILDUNTERLAGE.md, B2). */
export type ReferencePatch = Partial<
  Pick<
    ImageReference,
    "opacity" | "grayscale" | "locked" | "origin" | "rotation" | "metresPerPixel"
  >
>;
/** One underlay of the working storey with new display or placement values. */
export function updateImageReference(project: Project, id: string, patch: ReferencePatch): Project {
  const storey = storeyOf(project);
  const current = storey.references.find((r) => r.id === id);
  if (!current) throw new Error("Bildunterlage nicht gefunden.");
  const next: ImageReference = { ...current, ...patch };
  // Defaults stay absent, so files stay small and old readers see the old look.
  if (next.opacity === 1) delete next.opacity;
  if (!next.grayscale) delete next.grayscale;
  if (!next.locked) delete next.locked;
  const asset = project.assets.find((a) => a.id === next.assetId);
  if (!asset) throw new Error("Bilddaten fehlen.");
  validateReferenceExtent(next, asset);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storey,
      references: storey.references.map((r) => (r.id === id ? next : r)),
    }),
  });
}
export function commitCreateReference(
  history: ProjectHistory,
  base: Project,
  request: CreateReferenceRequest,
): ProjectHistory {
  return commitProject(history, previewCreateReference(base, history.present, request));
}
