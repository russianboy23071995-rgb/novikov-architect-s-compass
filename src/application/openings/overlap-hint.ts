import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { GeometryPreview } from "../../domain/project/geometry-scope.ts";
import {
  changedOpeningIds,
  openingOverlapHint,
} from "../../domain/elements/wall/opening-overlaps.ts";

/** Hint for a proposed change: overlaps that involve a new or changed opening of the
 * working storey. Empty when nothing changed or nothing overlaps; never blocks the change.
 */
export function previewOverlapHint(before: Project, after: Project): string {
  if (before === after) return "";
  const next = storeyOf(after);
  return openingOverlapHint(next, changedOpeningIds(storeyOf(before), next));
}

/** Hint for one existing window or door, e.g. for its properties. */
export function openingOverlapHintFor(project: Project, id: string): string {
  return openingOverlapHint(storeyOf(project), new Set([id]));
}

/** Same hint for a prepared geometry patch; its scope holds every opening of the host walls. */
export function patchOverlapHint(before: Project, patch: GeometryPreview): string {
  const geometry = patch.geometry;
  const next = "storeys" in geometry ? storeyOf(geometry) : geometry.storey;
  return openingOverlapHint(next, changedOpeningIds(storeyOf(before), next));
}
