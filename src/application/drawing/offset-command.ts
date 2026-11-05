import type { Project } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../selection/target.ts";
import { closedContour } from "../direct-edit/contour.ts";
import { previewMovementInput } from "../direct-edit/numeric.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";

/** Strict local text adapter; geometry, cap and validation stay in Direct Edit. */
export function previewOffsetCommand(
  project: Project,
  selection: ElementTarget | null,
  text: string,
) {
  const match = /^offset\s+(?:um\s+)?([+-]?\d+(?:[.,]\d+)?)\s*(mm|cm|m)$/iu.exec(text.trim());
  if (!match) return null;
  const ring = selection && closedContour(project, selection);
  if (!selection || (selection.kind !== "line" && selection.kind !== "hatch") || !ring)
    throw new Error("Bitte eine geschlossene 2D-Polylinie oder Schraffur auswählen.");
  const metres =
    Number(match[1]!.replace(",", ".")) / { m: 1, cm: 100, mm: 1000 }[match[2]!.toLowerCase()]!;
  if (!Number.isFinite(metres)) throw new Error("Endlichen Offset-Abstand eingeben.");
  const result = previewMovementInput(
    {
      base: project,
      target: { ...selection },
      action: "offset",
      index: 0,
      anchor: { ...ring[0]! },
    },
    project,
    selection,
    "",
    String(metres),
    null,
  );
  const format = (n: number) => n.toLocaleString("de-DE", { maximumSignificantDigits: 10 });
  return {
    // An owned input yields an owned, validated result: applying the preview reuses it
    // instead of running the offset again (docs/performance/OFFSET_COMMAND.md).
    result: validateLike(project, result.project),
    summary: `${selection.id} · Offset ${format(result.metres)} m${result.notice ? ` (begrenzt; angefordert ${format(metres)} m)` : ""}`,
  };
}
