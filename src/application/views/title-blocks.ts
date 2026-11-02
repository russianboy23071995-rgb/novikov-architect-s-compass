import type { Project, TitleBlock } from "../../domain/project/schema.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import { projectMasterLayouts, sheetSize, type Sheet } from "../../domain/views/layouts.ts";

/**
 * Title block actions (Planköpfe, docs/PLANKOPF.md, PK1). Shared validated operations; IDs are
 * caller supplied. Every action is one undo step. The drawing itself is edited with the plan
 * tools through the title block's drawing sheet (PK2).
 */
export type TitleBlockAction =
  | { kind: "create"; id: string; name: string; sheet?: Sheet }
  | { kind: "rename"; id: string; name: string }
  | { kind: "sheet"; id: string; sheet: Sheet }
  | { kind: "delete"; id: string };

/** Empty drawing sheet of a title block: storey shaped, never part of the building. */
export function emptyTitleBlockStorey(id: string, name: string): TitleBlock["storey"] {
  return {
    id,
    name,
    height: null,
    references: [],
    walls: [],
    windows: [],
    hatches: [],
    wallJoins: [],
    wallTJunctions: [],
  };
}

export function titleBlockOf(project: Project, id: string): TitleBlock {
  const block = project.titleBlocks?.find((t) => t.id === id);
  if (!block) throw new Error("Der Plankopf existiert nicht mehr.");
  return block;
}

export function changeTitleBlocks(
  base: Project,
  current: Project,
  action: TitleBlockAction,
): Project {
  if (base !== current)
    throw new Error("Das Projekt wurde geändert. Plankopfaktion erneut starten.");
  const blocks = current.titleBlocks ?? [];
  if (action.kind === "create") {
    if (blocks.some((t) => t.name === action.name))
      throw new Error("Planköpfe brauchen eindeutige Namen.");
    // The underlay starts like the first master layout, normally A3 landscape.
    const sheet = action.sheet ?? projectMasterLayouts(current)[0]!.sheet;
    return validateLike(current, {
      ...current,
      titleBlocks: [
        ...blocks,
        {
          id: action.id,
          name: action.name,
          sheet,
          storey: emptyTitleBlockStorey(action.id, action.name),
        },
      ],
    });
  }
  const block = titleBlockOf(current, action.id);
  if (action.kind === "delete") {
    const rest = blocks.filter((t) => t !== block);
    const { titleBlocks: _all, ...without } = current;
    return validateLike(current, rest.length ? { ...current, titleBlocks: rest } : without);
  }
  if (action.kind === "rename" && blocks.some((t) => t !== block && t.name === action.name))
    throw new Error("Planköpfe brauchen eindeutige Namen.");
  return validateLike(current, {
    ...current,
    titleBlocks: blocks.map((t) =>
      t !== block
        ? t
        : action.kind === "rename"
          ? { ...t, name: action.name, storey: { ...t.storey, name: action.name } }
          : { ...t, sheet: action.sheet },
    ),
  });
}

/** A rectangle in plan metres (y up). */
export type PlanRect = { x0: number; y0: number; x1: number; y1: number };
/**
 * Paper underlay of the Plankopfplaner at 1:1 (docs/PLANKOPF.md, PK3), in metres. The origin
 * is the lower right corner of the margin frame: the title block's own lower right corner.
 */
export function titleBlockUnderlay(sheet: Sheet): { paper: PlanRect; frame: PlanRect } {
  const { width, height } = sheetSize(sheet);
  const m = sheet.margins,
    mm = (v: number) => v / 1000;
  return {
    paper: {
      x0: mm(m.right - width),
      y0: mm(-m.bottom),
      x1: mm(m.right),
      y1: mm(height - m.bottom),
    },
    frame: { x0: mm(m.left + m.right - width), y0: 0, x1: 0, y1: mm(height - m.top - m.bottom) },
  };
}
