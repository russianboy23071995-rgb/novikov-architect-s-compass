import { assertProjectRasterBudget } from "../../domain/project/raster-budget.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import type { ImageAsset, ImageReference } from "../../domain/elements/reference/model.ts";
import type { Project } from "../../domain/project/schema.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { commitProject, type ProjectHistory } from "../../lib/bim/history.ts";
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
export function commitCreateReference(
  history: ProjectHistory,
  base: Project,
  request: CreateReferenceRequest,
): ProjectHistory {
  return commitProject(history, previewCreateReference(base, history.present, request));
}
