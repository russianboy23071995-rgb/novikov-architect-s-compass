import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { DoorInsert, WindowInsert } from "../../domain/elements/window/insert.ts";

type Target =
  | { kind: "window"; id: string; insert: WindowInsert | null }
  | { kind: "door"; id: string; insert: DoorInsert | null };

/**
 * Sets, changes or removes the element in a window or door opening (docs/FENSTER_TUEREN.md,
 * FT1); null leaves a plain opening. Whole-project validation: an element that does not fit
 * its opening or wall is refused with the reason.
 */
export function setOpeningInsert(project: Project, target: Target): Project {
  const storey = storeyOf(project);
  const list = target.kind === "window" ? storey.windows : (storey.doors ?? []);
  if (!list.some((o) => o.id === target.id))
    throw new Error(`${target.kind === "window" ? "Fenster" : "Tür"} nicht gefunden.`);
  const filled = <T extends { id: string; insert?: unknown }>(items: readonly T[]) =>
    items.map((o) => {
      if (o.id !== target.id) return o;
      const { insert: _, ...opening } = o;
      return (target.insert ? { ...opening, insert: target.insert } : opening) as T;
    });
  return validateLike(
    project,
    replaceStorey(
      project,
      target.kind === "window"
        ? { ...storey, windows: filled(storey.windows) }
        : { ...storey, doors: filled(storey.doors ?? []) },
    ),
  );
}
