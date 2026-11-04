import type { Project } from "../../domain/project/schema.ts";
import type { ElementKind } from "../../domain/elements/registry.ts";
import { copySelection, pasteClipboard, type ClipboardContent } from "../clipboard/clipboard.ts";
import type { ElementTarget } from "./target.ts";

/**
 * Kopie bewegen (docs/TASTENKUERZEL.md, B1; later also turn and mirror): `transformed` is the
 * base project with the targets already moved. The result is the unchanged base plus copies of
 * the moved targets with new ids (hosted windows and doors with their wall, joins among the
 * copied walls), one checked change; the copies are the new selection.
 */
export function copyTransformed(
  base: Project,
  transformed: Project,
  targets: readonly ElementTarget[],
  newId: (kind: ElementKind) => string,
): { project: Project; targets: ElementTarget[]; content: ClipboardContent } {
  const content = copySelection(transformed, targets);
  return { ...pasteClipboard(base, content, newId), content };
}
