import { ELEMENT_KINDS, elementKinds } from "../../domain/elements/registry.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";
import { eligibleSelection, type SelectionSet } from "../selection/state.ts";
import { sameTargets } from "../selection/move.ts";

type Storey = Project["storeys"][number];

/** One delete operation for key, menu, text and voice (user decision 24.10.2026).
 * Windows and doors of a deleted wall are deleted with it; corner and T connections of a
 * deleted wall are dissolved and neighbours keep their geometry; image assets no reference
 * uses any more are removed. Preview and commit are the same result, one Undo step.
 */
export function previewDeleteSelection(
  project: Project,
  targets: SelectionSet,
  visibility: LayerVisibilityPolicy | undefined,
): { result: Project; summary: string } {
  if (!targets.length || !sameTargets(targets, eligibleSelection(project, visibility, targets)))
    throw new Error("Bitte eine sichtbare, aktuelle Auswahl festlegen.");
  const selected = new Set(targets.map((t) => t.id));
  const owners = project.storeys.filter((s) =>
    elementKinds.some((kind) =>
      (s[ELEMENT_KINDS[kind].list] ?? []).some((e) => selected.has(e.id)),
    ),
  );
  if (owners.length !== 1)
    throw new Error("Löschen wirkt in einem Geschoss. Bitte nur Elemente eines Geschosses wählen.");
  const storey = owners[0]!;
  const walls = new Set(storey.walls.filter((w) => selected.has(w.id)).map((w) => w.id));
  // Hosted openings follow their deleted wall.
  const followers = [...storey.windows, ...(storey.doors ?? [])].filter(
    (o) => walls.has(o.wallId) && !selected.has(o.id),
  );
  const removed = new Set([...selected, ...followers.map((o) => o.id)]);
  const next: Record<string, unknown> = { ...storey };
  for (const kind of elementKinds) {
    const list = storey[ELEMENT_KINDS[kind].list];
    if (list)
      next[ELEMENT_KINDS[kind].list] = (list as readonly { id: string }[]).filter(
        (e) => !removed.has(e.id),
      );
  }
  const joins = storey.wallJoins.filter(
    (j) => !walls.has(j.first.wallId) && !walls.has(j.second.wallId),
  );
  const tees = storey.wallTJunctions.filter(
    (j) => !walls.has(j.hostWallId) && !walls.has(j.incoming.wallId),
  );
  // Walls trimmed at a deleted roof keep their stored height again (L04b), in any storey.
  const roofs = new Set((storey.roofs ?? []).filter((r) => removed.has(r.id)).map((r) => r.id));
  let untrimmed = 0;
  const untrim = (s: Storey): Storey => {
    if (!roofs.size || !s.walls.some((w) => w.roofTrim && roofs.has(w.roofTrim.roofId))) return s;
    return {
      ...s,
      walls: s.walls.map((w) => {
        if (!w.roofTrim || !roofs.has(w.roofTrim.roofId)) return w;
        untrimmed++;
        const { roofTrim: _trim, trimPlane: _plane, ...rest } = w;
        return rest;
      }),
    };
  };
  const storeys = project.storeys.map((s) =>
    untrim(s === storey ? ({ ...next, wallJoins: joins, wallTJunctions: tees } as Storey) : s),
  );
  const used = new Set(storeys.flatMap((s) => s.references.map((r) => r.assetId)));
  const result = validateLike(project, {
    ...project,
    assets: project.assets.filter((a) => used.has(a.id)),
    storeys,
  });
  const connections =
    storey.wallJoins.length - joins.length + storey.wallTJunctions.length - tees.length;
  const parts = [`${selected.size} ${selected.size === 1 ? "Element" : "Elemente"} löschen`];
  if (followers.length)
    parts.push(
      followers.length === 1
        ? "1 Fenster/Tür der Wand wird mitgelöscht"
        : `${followers.length} Fenster/Türen der Wände werden mitgelöscht`,
    );
  if (untrimmed)
    parts.push(
      untrimmed === 1
        ? "1 Wandtrimmung wird aufgehoben"
        : `${untrimmed} Wandtrimmungen werden aufgehoben`,
    );
  if (connections)
    parts.push(`${connections} Wandanschl${connections === 1 ? "uss wird" : "üsse werden"} gelöst`);
  return { result, summary: parts.join("; ") };
}
