import type { Project } from "../../domain/project/schema.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import {
  LAYOUT_COLLECTION_ID,
  projectLayoutFolders,
  projectLayouts,
  projectMasterLayouts,
  type Layout,
  type LayoutFolder,
  type MasterLayout,
  sheetSize,
  type Sheet,
} from "../../domain/views/layouts.ts";

/**
 * Layout actions (docs/LAYOUTS.md, LA1). Shared validated operations for the navigator and
 * future text/voice adapters; IDs are caller supplied. Every action is one undo step. The
 * first change writes the default library (collection folder, standard master) into the
 * project, so untouched projects keep their file unchanged.
 */
export type LayoutAction =
  | { kind: "create-folder"; id: string; name: string; parentId: string }
  | { kind: "rename-folder"; id: string; name: string }
  | { kind: "move-folder"; id: string; parentId: string }
  | { kind: "delete-folder"; id: string }
  | ({
      kind: "create-layout";
      id: string;
      name: string;
      folderId: string;
      /** Follows this master; null keeps the own sheet. */
      masterId: string | null;
      sheet?: Sheet;
    } & LayoutTextFields)
  | ({
      kind: "layout-settings";
      id: string;
      name: string;
      folderId: string;
      masterId: string | null;
      sheet?: Sheet;
    } & LayoutTextFields)
  | { kind: "rename-layout"; id: string; name: string }
  | { kind: "move-layout"; id: string; folderId: string }
  | { kind: "delete-layout"; id: string }
  | {
      kind: "create-master";
      id: string;
      name: string;
      sheet: Sheet;
      /** Title block on the master (PK4); null or absent: none. */
      titleBlockId?: string | null;
    }
  | {
      kind: "master-settings";
      id: string;
      name: string;
      sheet: Sheet;
      titleBlockId?: string | null;
    }
  | { kind: "delete-master"; id: string };

/** Fields read by automatic texts (AT1). Absent keeps the value, null or "" removes it. */
export type LayoutTextFields = {
  planNumber?: string | null;
  index?: string | null;
  documentId?: string | null;
};
function textFields(old: Partial<Layout>, action: LayoutTextFields) {
  const value = (next: string | null | undefined, before: string | undefined) => {
    const v = next === undefined ? before : (next ?? "").trim();
    return v ? v : undefined;
  };
  const planNumber = value(action.planNumber, old.planNumber),
    index = value(action.index, old.index),
    documentId = value(action.documentId, old.documentId);
  return {
    ...(planNumber ? { planNumber } : {}),
    ...(index ? { index } : {}),
    ...(documentId ? { documentId } : {}),
  };
}

type Library = {
  layoutFolders: LayoutFolder[];
  layouts: Layout[];
  masterLayouts: MasterLayout[];
};

const COLLECTION_FIXED =
  "Der Ordner „Layoutsammlung“ bleibt erhalten und kann nicht umbenannt, verschoben oder gelöscht werden.";

function folderOf(library: Library, id: string) {
  const folder = library.layoutFolders.find((f) => f.id === id);
  if (!folder) throw new Error("Der Layoutordner existiert nicht mehr.");
  return folder;
}
function layoutOf(library: Library, id: string) {
  const layout = library.layouts.find((l) => l.id === id);
  if (!layout) throw new Error("Das Layout existiert nicht mehr.");
  return layout;
}
function masterOf(library: Library, id: string) {
  const master = library.masterLayouts.find((m) => m.id === id);
  if (!master) throw new Error("Das Masterlayout existiert nicht mehr.");
  return master;
}
/** A folder below the collection keeps its parent, the collection none. */
const placed = (folder: LayoutFolder, parentId: string): LayoutFolder => {
  const { parentId: _old, ...rest } = folder;
  return parentId === LAYOUT_COLLECTION_ID ? rest : { ...rest, parentId };
};
const parentOf = (folder: LayoutFolder) => folder.parentId ?? LAYOUT_COLLECTION_ID;
/** Either follows a master or keeps the own sheet; the other one is dropped. */
function layoutBody(
  library: Library,
  masterId: string | null,
  sheet: Sheet | undefined,
): Pick<Layout, "masterId" | "sheet"> {
  if (masterId !== null) {
    masterOf(library, masterId);
    return { masterId };
  }
  if (!sheet) throw new Error("Ohne Masterlayout braucht das Layout eigene Blatteinstellungen.");
  return { sheet };
}

export function changeLayouts(base: Project, current: Project, action: LayoutAction): Project {
  if (base !== current) throw new Error("Das Projekt wurde geändert. Layoutaktion erneut starten.");
  const library: Library = {
    layoutFolders: [...projectLayoutFolders(current)],
    layouts: [...projectLayouts(current)],
    masterLayouts: [...projectMasterLayouts(current)],
  };
  const next = applyLayoutAction(library, action);
  // A deleted layout or master layout takes its drawing along (LZ1).
  const owners = new Set([...next.layouts, ...next.masterLayouts].map((o) => o.id));
  const drawings = (current.layoutDrawings ?? []).filter((d) => owners.has(d.layoutId));
  const { layoutDrawings: _all, ...without } = current;
  return validateLike(current, {
    ...without,
    ...next,
    ...(drawings.length ? { layoutDrawings: drawings } : {}),
  });
}

function applyLayoutAction(library: Library, action: LayoutAction): Library {
  const { layoutFolders: folders, layouts, masterLayouts: masters } = library;
  switch (action.kind) {
    case "create-folder":
      folderOf(library, action.parentId);
      return {
        ...library,
        layoutFolders: [...folders, placed({ id: action.id, name: action.name }, action.parentId)],
      };
    case "rename-folder":
    case "move-folder":
    case "delete-folder": {
      if (action.id === LAYOUT_COLLECTION_ID) throw new Error(COLLECTION_FIXED);
      const folder = folderOf(library, action.id);
      if (action.kind === "rename-folder")
        return {
          ...library,
          layoutFolders: folders.map((f) => (f === folder ? { ...f, name: action.name } : f)),
        };
      if (action.kind === "move-folder") {
        folderOf(library, action.parentId);
        // Never into itself or one of its own subfolders.
        for (let p: string | undefined = action.parentId; p !== undefined;) {
          if (p === folder.id) throw new Error("Ein Ordner kann nicht in sich selbst liegen.");
          p = p === LAYOUT_COLLECTION_ID ? undefined : parentOf(folderOf(library, p));
        }
        return {
          ...library,
          layoutFolders: folders.map((f) => (f === folder ? placed(f, action.parentId) : f)),
        };
      }
      if (
        folders.some((f) => f.parentId === folder.id) ||
        layouts.some((l) => l.folderId === folder.id)
      )
        throw new Error("Bitte den Ordner zuerst leeren.");
      return { ...library, layoutFolders: folders.filter((f) => f !== folder) };
    }
    case "create-layout":
      folderOf(library, action.folderId);
      return {
        ...library,
        layouts: [
          ...layouts,
          {
            id: action.id,
            name: action.name,
            folderId: action.folderId,
            ...layoutBody(library, action.masterId, action.sheet),
            ...textFields({}, action),
          },
        ],
      };
    case "layout-settings": {
      const layout = layoutOf(library, action.id);
      folderOf(library, action.folderId);
      return {
        ...library,
        layouts: layouts.map((l) =>
          l === layout
            ? {
                id: l.id,
                name: action.name,
                folderId: action.folderId,
                ...layoutBody(library, action.masterId, action.sheet),
                ...textFields(l, action),
              }
            : l,
        ),
      };
    }
    case "rename-layout":
    case "move-layout": {
      const layout = layoutOf(library, action.id);
      if (action.kind === "move-layout") folderOf(library, action.folderId);
      return {
        ...library,
        layouts: layouts.map((l) =>
          l !== layout
            ? l
            : action.kind === "rename-layout"
              ? { ...l, name: action.name }
              : { ...l, folderId: action.folderId },
        ),
      };
    }
    case "delete-layout": {
      const layout = layoutOf(library, action.id);
      return { ...library, layouts: layouts.filter((l) => l !== layout) };
    }
    case "create-master":
      return {
        ...library,
        masterLayouts: [
          ...masters,
          {
            id: action.id,
            name: action.name,
            sheet: action.sheet,
            ...(action.titleBlockId ? { titleBlockId: action.titleBlockId } : {}),
          },
        ],
      };
    case "master-settings": {
      const master = masterOf(library, action.id);
      return {
        ...library,
        masterLayouts: masters.map((m) =>
          m !== master
            ? m
            : (() => {
                // Absent keeps the title block (e.g. a rename), null removes it.
                const { titleBlockId: old, ...rest } = m;
                const titleBlockId =
                  action.titleBlockId === undefined ? old : (action.titleBlockId ?? undefined);
                return {
                  ...rest,
                  name: action.name,
                  sheet: action.sheet,
                  ...(titleBlockId ? { titleBlockId } : {}),
                };
              })(),
        ),
      };
    }
    case "delete-master": {
      const master = masterOf(library, action.id);
      const users = layouts.filter((l) => l.masterId === master.id).length;
      if (users)
        throw new Error(
          `Das Masterlayout wird von ${users} Layout${users === 1 ? "" : "s"} verwendet.`,
        );
      return { ...library, masterLayouts: masters.filter((m) => m !== master) };
    }
  }
}

export type PaperRect = { x0: number; y0: number; x1: number; y1: number };

/**
 * Paper of a layout at 1:1 in plan metres (docs/LAYOUTS.md, LZ1): the lower left paper corner
 * is the origin, so coordinates read like paper measures.
 */
export function layoutUnderlay(sheet: Sheet): {
  paper: PaperRect;
  frame: PaperRect;
  surface: true;
} {
  const { width, height } = sheetSize(sheet);
  const m = sheet.margins,
    mm = (v: number) => v / 1000;
  return {
    paper: { x0: 0, y0: 0, x1: mm(width), y1: mm(height) },
    frame: { x0: mm(m.left), y0: mm(m.bottom), x1: mm(width - m.right), y1: mm(height - m.top) },
    surface: true,
  };
}
