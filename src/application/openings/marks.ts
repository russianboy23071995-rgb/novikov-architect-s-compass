import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import { nextOpeningMark, type OpeningKind } from "../../domain/elements/wall/opening-marks.ts";

/** Next position number for a window or door placed on the working storey. */
export function newOpeningMark(project: Project, kind: OpeningKind): string {
  return nextOpeningMark(project, storeyOf(project).id, kind);
}

/** Shared edit of a position number for properties, text and future AI adapters.
 * Free text; duplicates stay allowed (hint only); empty input is rejected.
 */
export function setOpeningMark(
  project: Project,
  target: { kind: OpeningKind; id: string },
  mark: string,
): Project {
  const value = mark.trim();
  if (!value) throw new Error("Die Nummer darf nicht leer sein.");
  if (value.length > 32) throw new Error("Die Nummer ist zu lang (höchstens 32 Zeichen).");
  const storey = storeyOf(project);
  const list = target.kind === "window" ? storey.windows : (storey.doors ?? []);
  if (!list.some((o) => o.id === target.id))
    throw new Error(`${target.kind === "window" ? "Fenster" : "Tür"} nicht gefunden.`);
  const renamed = <T extends { id: string }>(items: readonly T[]) =>
    items.map((o) => (o.id === target.id ? { ...o, mark: value } : o));
  return validateLike(
    project,
    replaceStorey(
      project,
      target.kind === "window"
        ? { ...storey, windows: renamed(storey.windows) }
        : { ...storey, doors: renamed(storey.doors ?? []) },
    ),
  );
}
