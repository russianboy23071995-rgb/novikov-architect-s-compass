import { useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, File, FileStack, Folder, PanelBottom } from "lucide-react";
import type { Project } from "@/domain/project/schema";
import {
  LAYOUT_COLLECTION_ID,
  layoutFolderTree,
  projectLayoutFolders,
  projectLayouts,
  projectMasterLayouts,
  type LayoutFolder,
} from "@/domain/views/layouts";
import { changeLayouts, type LayoutAction } from "@/application/views/layouts";
import { changeTitleBlocks, type TitleBlockAction } from "@/application/views/title-blocks";
import { LayoutSettingsWindow, type LayoutDraftTarget } from "./LayoutSettingsWindow";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export type LayoutNavigation = {
  onLayoutAction: (base: Project, action: LayoutAction) => void;
  /** Double click on a layout or master layout (opens it as a canvas tab, LA4). */
  onOpenLayout?: (id: string) => void;
  activeLayoutId?: string | null;
  /** Title blocks (docs/PLANKOPF.md, PK3): create, rename, delete; double click opens. */
  onTitleBlockAction?: (base: Project, action: TitleBlockAction) => void;
  onOpenTitleBlock?: (id: string) => void;
  activeTitleBlockId?: string | null;
  /** Opens the sheet and exports it as PDF (docs/PDF_EXPORT.md). */
  onExportPdf?: (kind: "layout" | "block", id: string) => void;
};

type Kind = "folder" | "layout" | "master" | "block";
type Renaming = { id: string; kind: Kind; name: string };

/** „Name“, „Name 2“, … – the first name not yet in use. */
const freeName = (base: string, used: readonly string[]) => {
  for (let i = 1; ; i++) {
    const name = i === 1 ? base : `${base} ${i}`;
    if (!used.includes(name)) return name;
  }
};

/**
 * Navigator tab „Layouts“ (docs/LAYOUTS.md, LA2): the master layouts above the fixed folder
 * „Layoutsammlung“ with its nested folders and layouts. Right click creates, renames, moves
 * and deletes; layouts and folders can be dragged into folders; F2 renames. Every change goes
 * through `changeLayouts` and is one undo step.
 */
export function LayoutNavigator({
  project,
  onLayoutAction,
  onOpenLayout,
  activeLayoutId = null,
  onTitleBlockAction,
  onOpenTitleBlock,
  activeTitleBlockId = null,
  onExportPdf,
}: LayoutNavigation & { project: Project }) {
  const folders = projectLayoutFolders(project),
    layouts = projectLayouts(project),
    masters = projectMasterLayouts(project);
  const [closed, setClosed] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<Renaming | null>(null);
  const pendingRename = useRef<Renaming | null>(null);
  const [error, setError] = useState("");
  const dragged = useRef<{ base: Project; id: string; kind: "folder" | "layout" } | null>(null);
  const [dropFolder, setDropFolder] = useState<string | null>(null);
  const [windowTarget, setWindowTarget] = useState<LayoutDraftTarget | null>(null);
  const newLayout = (folderId: string) =>
    setWindowTarget({
      kind: "layout",
      folderId,
      name: freeName(
        "Layout",
        layouts.map((l) => l.name),
      ),
    });
  const newMaster = () =>
    setWindowTarget({
      kind: "master",
      name: freeName(
        "Masterlayout",
        masters.map((m) => m.name),
      ),
    });

  const apply = (action: LayoutAction, base = project) => {
    try {
      changeLayouts(base, project, action);
      onLayoutAction(base, action);
      setError("");
      return true;
    } catch (cause) {
      setError((cause as Error).message);
      return false;
    }
  };
  const createFolder = (folderId = LAYOUT_COLLECTION_ID) => {
    const id = crypto.randomUUID(),
      name = "Neuer Ordner",
      kind: Kind = "folder";
    const action: LayoutAction = { kind: "create-folder", id, name, parentId: folderId };
    if (!apply(action)) return;
    setSelected(id);
    setClosed((ids) => ids.filter((v) => v !== folderId));
    // The menu returns focus when it closes; the rename field takes it then.
    pendingRename.current = { id, kind, name };
  };
  const blocks = project.titleBlocks ?? [];
  const blockAction = (action: TitleBlockAction) => {
    try {
      changeTitleBlocks(project, project, action);
      onTitleBlockAction?.(project, action);
      setError("");
      return true;
    } catch (cause) {
      setError((cause as Error).message);
      return false;
    }
  };
  const newBlock = () => {
    const id = crypto.randomUUID(),
      name = freeName(
        "Plankopf",
        blocks.map((b) => b.name),
      );
    if (!blockAction({ kind: "create", id, name })) return;
    setSelected(id);
    pendingRename.current = { id, kind: "block", name };
    onOpenTitleBlock?.(id);
  };
  const rename = (target: Renaming) => {
    if (target.kind === "block") {
      if (blockAction({ kind: "rename", id: target.id, name: target.name })) setRenaming(null);
      return;
    }
    const action: LayoutAction =
      target.kind === "folder"
        ? { kind: "rename-folder", id: target.id, name: target.name }
        : target.kind === "layout"
          ? { kind: "rename-layout", id: target.id, name: target.name }
          : {
              kind: "master-settings",
              id: target.id,
              name: target.name,
              sheet: masters.find((m) => m.id === target.id)!.sheet,
            };
    if (apply(action)) setRenaming(null);
  };
  const toggle = (id: string) =>
    setClosed((ids) => (ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id]));
  const menuClosed = (event: Event) => {
    if (!pendingRename.current) return;
    event.preventDefault();
    setRenaming(pendingRename.current);
    pendingRename.current = null;
  };
  const dropInto = (folderId: string) => {
    const source = dragged.current;
    dragged.current = null;
    setDropFolder(null);
    if (!source || source.id === folderId) return;
    const action: LayoutAction =
      source.kind === "layout"
        ? { kind: "move-layout", id: source.id, folderId }
        : { kind: "move-folder", id: source.id, parentId: folderId };
    // Keep the drag's project identity: never move a replaced element.
    if (apply(action, source.base)) setClosed((ids) => ids.filter((v) => v !== folderId));
  };
  /** Folders in tree order with their depth, for the „move to“ menus. */
  const flatFolders = layoutFolderTree(project);
  const childrenOf = (id: string) =>
    folders.filter((f) =>
      id === LAYOUT_COLLECTION_ID
        ? f.id !== LAYOUT_COLLECTION_ID && f.parentId === undefined
        : f.parentId === id,
    );
  const collection = flatFolders[0]!.folder;

  const row = (
    id: string,
    name: string,
    kind: Kind,
    depth: number,
    menu: ReactNode,
    extra: { open?: boolean; folderId?: string } = {},
  ) => {
    const fixed = id === LAYOUT_COLLECTION_ID;
    const draggable = kind === "layout" || (kind === "folder" && !fixed);
    const beginRename = () => {
      if (fixed) return;
      setError("");
      setRenaming({ id, kind, name });
    };
    const Icon =
      kind === "folder"
        ? Folder
        : kind === "master"
          ? FileStack
          : kind === "block"
            ? PanelBottom
            : File;
    const open = () => (kind === "block" ? onOpenTitleBlock?.(id) : onOpenLayout?.(id));
    return (
      <ContextMenu key={id}>
        <ContextMenuTrigger asChild>
          <div
            role="treeitem"
            aria-label={name}
            aria-level={depth + 1}
            aria-selected={selected === id || activeLayoutId === id || activeTitleBlockId === id}
            aria-expanded={kind === "folder" ? extra.open : undefined}
            tabIndex={0}
            // Only this row's menu opens, not the one of the surrounding area as well.
            onContextMenu={(e) => e.stopPropagation()}
            draggable={draggable && renaming?.id !== id}
            onDragStart={(e) => {
              if (!draggable || renaming?.id === id) return e.preventDefault();
              dragged.current = { base: project, id, kind: kind as "folder" | "layout" };
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("application/x-novikov-layout", id);
            }}
            onDragEnd={() => {
              dragged.current = null;
              setDropFolder(null);
            }}
            onDragOver={(e) => {
              if (kind !== "folder" || !dragged.current) return;
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "move";
              setDropFolder(id);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                setDropFolder((t) => (t === id ? null : t));
            }}
            onDrop={(e) => {
              if (kind !== "folder" || !dragged.current) return;
              e.preventDefault();
              e.stopPropagation();
              dropInto(id);
            }}
            title={
              kind === "folder"
                ? fixed
                  ? "Standardordner aller Layouts · Rechtsklick: Neues Layout oder Ordner"
                  : "Ordner · F2 oder Rechtsklick: umbenennen · Layouts hierher ziehen"
                : "Doppelklick: öffnen · F2: umbenennen"
            }
            className={`${dropFolder === id ? "bg-primary/15 ring-1 ring-primary " : ""}flex h-7 select-none items-center gap-1.5 rounded-sm pr-2 text-[13px] hover:bg-accent ${
              selected === id || activeLayoutId === id
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground"
            }`}
            style={{ paddingLeft: 6 + depth * 13 }}
            onClick={() => {
              setSelected(id);
              if (kind === "folder") toggle(id);
            }}
            onDoubleClick={() => {
              if (kind !== "folder") open();
            }}
            onKeyDown={(e) => {
              if (e.key === "F2") {
                e.preventDefault();
                beginRename();
              }
              if (e.key === "Enter") {
                e.preventDefault();
                if (kind === "folder") toggle(id);
                else open();
              }
            }}
          >
            {kind === "folder" ? (
              extra.open ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )
            ) : (
              <span className="w-3" />
            )}
            <Icon className="size-3.5 shrink-0" />
            {renaming?.id === id ? (
              <input
                autoFocus
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Name ändern"
                value={renaming.name}
                className="min-w-0 flex-1 rounded border bg-popover px-1 text-foreground"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Escape") setRenaming(null);
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                onBlur={() => rename(renaming)}
              />
            ) : (
              <span className="truncate">{name}</span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent onCloseAutoFocus={menuClosed}>
          {kind !== "folder" && onExportPdf && (
            <>
              <ContextMenuItem
                onSelect={() => onExportPdf(kind === "block" ? "block" : "layout", id)}
              >
                Als PDF exportieren
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          {menu}
          {!fixed && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={beginRename}>Umbenennen</ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const createItems = (folderId: string) => (
    <>
      <ContextMenuItem onSelect={() => newLayout(folderId)}>Neues Layout</ContextMenuItem>
      <ContextMenuItem onSelect={() => createFolder(folderId)}>Neuer Ordner</ContextMenuItem>
    </>
  );
  const moveMenu = (id: string, kind: "folder" | "layout") => (
    <ContextMenuSub>
      <ContextMenuSubTrigger>In Ordner verschieben</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        {flatFolders.map(({ folder, depth }) => (
          <ContextMenuItem
            key={folder.id}
            style={{ paddingLeft: 8 + depth * 12 }}
            onSelect={() =>
              apply(
                kind === "layout"
                  ? { kind: "move-layout", id, folderId: folder.id }
                  : { kind: "move-folder", id, parentId: folder.id },
              )
            }
          >
            {folder.name}
          </ContextMenuItem>
        ))}
      </ContextMenuSubContent>
    </ContextMenuSub>
  );
  const folderTree = (folder: LayoutFolder, depth: number): ReactNode => {
    const open = !closed.includes(folder.id);
    const fixed = folder.id === LAYOUT_COLLECTION_ID;
    const empty = !childrenOf(folder.id).length && !layouts.some((l) => l.folderId === folder.id);
    return (
      <div key={folder.id}>
        {row(
          folder.id,
          folder.name,
          "folder",
          depth,
          <>
            {createItems(folder.id)}
            {!fixed && (
              <>
                <ContextMenuSeparator />
                {moveMenu(folder.id, "folder")}
                <ContextMenuItem
                  disabled={!empty}
                  onSelect={() => apply({ kind: "delete-folder", id: folder.id })}
                >
                  Ordner löschen
                </ContextMenuItem>
              </>
            )}
          </>,
          { open },
        )}
        {open && (
          <div role="group">
            {childrenOf(folder.id).map((child) => folderTree(child, depth + 1))}
            {layouts
              .filter((l) => l.folderId === folder.id)
              .map((l) =>
                row(
                  l.id,
                  l.name,
                  "layout",
                  depth + 1,
                  <>
                    <ContextMenuItem
                      onSelect={() =>
                        setWindowTarget({
                          kind: "layout",
                          id: l.id,
                          folderId: l.folderId,
                          name: l.name,
                        })
                      }
                    >
                      Layouteinstellungen …
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    {createItems(folder.id)}
                    <ContextMenuSeparator />
                    {moveMenu(l.id, "layout")}
                    <ContextMenuItem onSelect={() => apply({ kind: "delete-layout", id: l.id })}>
                      Layout löschen
                    </ContextMenuItem>
                  </>,
                ),
              )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-2 text-xs">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <section aria-label="Masterlayouts" className="pb-2">
            <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase text-muted-foreground">
              Masterlayouts
            </p>
            <div role="tree" aria-label="Masterlayouts">
              {masters.map((m) => {
                const users = layouts.filter((l) => l.masterId === m.id).length;
                return row(
                  m.id,
                  m.name,
                  "master",
                  0,
                  <>
                    <ContextMenuItem
                      onSelect={() => setWindowTarget({ kind: "master", id: m.id, name: m.name })}
                    >
                      Masterlayout-Einstellungen …
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={newMaster}>Neues Masterlayout</ContextMenuItem>
                    <ContextMenuItem
                      disabled={users > 0}
                      onSelect={() => apply({ kind: "delete-master", id: m.id })}
                    >
                      Masterlayout löschen
                      {users === 1
                        ? " (1 Layout folgt)"
                        : users > 1
                          ? ` (${users} Layouts folgen)`
                          : ""}
                    </ContextMenuItem>
                  </>,
                );
              })}
            </div>
          </section>
        </ContextMenuTrigger>
        <ContextMenuContent onCloseAutoFocus={menuClosed}>
          <ContextMenuItem onSelect={newMaster}>Neues Masterlayout</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {onTitleBlockAction && (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <section aria-label="Planköpfe" className="border-t border-border pb-2 pt-2">
              <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase text-muted-foreground">
                Planköpfe
              </p>
              <div role="tree" aria-label="Planköpfe">
                {blocks.map((b) =>
                  row(
                    b.id,
                    b.name,
                    "block",
                    0,
                    <>
                      <ContextMenuItem onSelect={() => onOpenTitleBlock?.(b.id)}>
                        Im Plankopfplaner öffnen
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={newBlock}>Neuer Plankopf</ContextMenuItem>
                      <ContextMenuItem onSelect={() => blockAction({ kind: "delete", id: b.id })}>
                        Plankopf löschen
                      </ContextMenuItem>
                    </>,
                  ),
                )}
                {!blocks.length && (
                  <p className="px-1.5 text-muted-foreground">Rechtsklick: Neuer Plankopf</p>
                )}
              </div>
            </section>
          </ContextMenuTrigger>
          <ContextMenuContent onCloseAutoFocus={menuClosed}>
            <ContextMenuItem onSelect={newBlock}>Neuer Plankopf</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div role="tree" aria-label="Layouts" className="min-h-40 border-t border-border pt-2">
            {folderTree(collection, 0)}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent onCloseAutoFocus={menuClosed}>
          {createItems(LAYOUT_COLLECTION_ID)}
        </ContextMenuContent>
      </ContextMenu>
      {windowTarget && (
        <LayoutSettingsWindow
          key={(windowTarget.id ?? "new") + windowTarget.kind}
          project={project}
          target={windowTarget}
          folders={flatFolders}
          onApply={(action) => {
            changeLayouts(project, project, action);
            onLayoutAction(project, action);
            setError("");
            setSelected(action.id);
            if (action.kind === "create-layout" || action.kind === "layout-settings")
              setClosed((ids) => ids.filter((v) => v !== action.folderId));
            // Something new opens right away as its tab.
            if (action.kind === "create-layout" || action.kind === "create-master")
              onOpenLayout?.(action.id);
          }}
          onClose={() => setWindowTarget(null)}
        />
      )}
      {error && (
        <p role="alert" className="px-1.5 pt-2 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
