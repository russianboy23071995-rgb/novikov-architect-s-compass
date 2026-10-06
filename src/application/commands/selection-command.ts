import { previewCommand } from "../../lib/bim/commands.ts";
import type { Project } from "../../domain/project/schema.ts";
import { eligibleSelection, singleTarget, type SelectionSet } from "../selection/state.ts";
import { beginSelectionMove, previewSelectionMove, sameTargets } from "../selection/move.ts";
import { resolvePolarInput } from "../../constraints/input/polar.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";

export type SelectionCommandPreview = {
  base: Project;
  targets: SelectionSet;
  visibility: LayerVisibilityPolicy;
  text: string;
  summary: string;
  result: Project;
};
/** Bounded local grammar. Translation is an adapter to the mouse action, not model logic. */
export function previewSelectionCommand(
  project: Project,
  targets: SelectionSet,
  visibility: LayerVisibilityPolicy,
  text: string,
): SelectionCommandPreview {
  if (!targets.length || !sameTargets(targets, eligibleSelection(project, visibility, targets)))
    throw new Error("Bitte eine sichtbare, aktuelle Auswahl festlegen.");
  const move =
    /^auswahl\s+um\s+(\d+(?:[.,]\d+)?)\s*(mm|cm|m)\s+bei\s+(\d+(?:[.,]\d+)?)\s*(grad|°)\s+verschieben$/iu.exec(
      text.trim(),
    );
  let result: Project, summary: string;
  if (move) {
    const length =
      Number(move[1]!.replace(",", ".")) / { m: 1, cm: 100, mm: 1000 }[move[2]!.toLowerCase()]!;
    const angle = Number(move[3]!.replace(",", "."));
    if (!Number.isFinite(length) || length <= 0)
      throw new Error("Bewegungslänge muss endlich und größer als null sein.");
    // A pure translation needs a vector, not an inferred element origin.
    const origin = { x: 0, y: 0 };
    const value = resolvePolarInput(origin, null, angle, length);
    const session = beginSelectionMove(project, targets, origin, visibility);
    result = previewSelectionMove(session, project, targets, value.point, visibility);
    const detached =
      project.storey.wallJoins.length +
      project.storey.wallTJunctions.length -
      result.storey.wallJoins.length -
      result.storey.wallTJunctions.length;
    const hosts = new Set(targets.filter((t) => t.kind === "wall").map((t) => t.id));
    const windows = project.storey.windows.filter((w) => hosts.has(w.wallId)).length;
    summary = `${targets.length} Elemente um ${length.toLocaleString("de-DE", { maximumFractionDigits: 10 })} m bei ${value.degrees.toLocaleString("de-DE")}° verschieben (0° = +X, 90° = +Y). ${windows} Fenster ${windows === 1 ? "folgt seiner Wand" : "folgen ihren Wänden"}; ${detached} externe Wandanschlüsse werden gelöst.`;
  } else {
    if (/^auswahl\b/iu.test(text.trim()))
      throw new Error(
        "Befehl: Auswahl um 2 m bei 90 Grad verschieben. Winkel 0 bis 360 Grad; Länge in m, cm oder mm.",
      );
    const target = singleTarget(targets);
    if (!target)
      throw new Error(
        "Dieser Befehl benötigt genau ein Element. Gruppenbefehl: Auswahl um 2 m bei 90 Grad verschieben.",
      );
    const legacy = previewCommand(project, target, text);
    result = legacy.result;
    summary = legacy.summary;
  }
  return {
    base: project,
    targets: targets.map((t) => ({ ...t })),
    visibility,
    text,
    result,
    summary,
  };
}
export function selectionCommandIsCurrent(
  project: Project,
  targets: SelectionSet,
  visibility: LayerVisibilityPolicy,
  preview: SelectionCommandPreview,
): boolean {
  return (
    project === preview.base &&
    visibility === preview.visibility &&
    sameTargets(targets, preview.targets) &&
    sameTargets(targets, eligibleSelection(project, visibility, targets))
  );
}
/** Re-run the validated action; a presentation preview is never trusted as an editable model. */
export function applySelectionCommand(
  project: Project,
  targets: SelectionSet,
  visibility: LayerVisibilityPolicy,
  preview: SelectionCommandPreview,
): Project {
  if (!selectionCommandIsCurrent(project, targets, visibility, preview))
    throw new Error("Modell, Auswahl oder Sichtbarkeit geändert. Bitte Befehl erneut prüfen.");
  return previewSelectionCommand(project, targets, visibility, preview.text).result;
}
