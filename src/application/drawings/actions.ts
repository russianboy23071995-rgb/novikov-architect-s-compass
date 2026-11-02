import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import {
  frameMask,
  maskProblem,
  type DrawingMask,
  type PlacedDrawing,
} from "../../domain/elements/drawing/model.ts";

/**
 * Places a drawing document on the open layout (docs/ZEICHNUNG.md, ZW1). Runs on the layout's
 * drawing space (its sheet is the working storey); the caller reads the document from the real
 * project and passes its frame size, so the size on the paper is the document's at its scale.
 */
export function placeDrawing(
  project: Project,
  request: {
    id: string;
    documentId: string;
    position: { x: number; y: number };
    frame: { width: number; height: number };
    denominator: number;
    layerId?: string;
  },
): Project {
  const storey = storeyOf(project);
  const drawing: PlacedDrawing = {
    id: request.id,
    layerId: request.layerId ?? project.defaultLayerIds.line,
    documentId: request.documentId,
    position: { ...request.position },
    mask: frameMask(request.frame, request.denominator),
  };
  return validateLike(
    project,
    replaceStorey(project, { ...storey, drawings: [...(storey.drawings ?? []), drawing] }),
  );
}

/**
 * Changes a placed drawing (ZW3): its mask, kept inside the document frame `limit` and at least
 * 5 × 5 mm, and its layer. Lage and size stay; one undo step for the caller.
 */
export function setDrawing(
  project: Project,
  id: string,
  change: { mask?: DrawingMask; layerId?: string },
  limit: DrawingMask,
): Project {
  const storey = storeyOf(project);
  if (!storey.drawings?.some((d) => d.id === id)) throw new Error("Die Zeichnung fehlt.");
  if (change.mask) {
    const problem = maskProblem(change.mask, limit);
    if (problem) throw new Error(problem);
  }
  return validateLike(
    project,
    replaceStorey(project, {
      ...storey,
      drawings: storey.drawings.map((d) =>
        d.id === id
          ? {
              ...d,
              ...(change.mask ? { mask: { ...change.mask } } : {}),
              ...(change.layerId ? { layerId: change.layerId } : {}),
            }
          : d,
      ),
    }),
  );
}
