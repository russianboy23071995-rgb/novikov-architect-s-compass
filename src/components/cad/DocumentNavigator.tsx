import { useState } from "react";
import { ChevronDown, ChevronRight, File, Folder, Plus } from "lucide-react";
import type { Project } from "@/domain/project/schema";
import type { DocumentFraming } from "@/domain/views/documents";
import {
  changeDrawingDocument,
  newDocumentScale,
  type DocumentAction,
} from "@/application/views/documents";
import { parseOutputScale } from "@/application/views/scale-input";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { FloatingPanel } from "./FloatingPanel";

export type DocumentNavigation = {
  activeDocumentId: string | null;
  getPlanCapture: () => DocumentFraming | null;
  onOpenDocument: (id: string | null) => void;
  onDocumentAction: (base: Project, action: DocumentAction) => void;
};

export function DocumentNavigator({
  project,
  activeDocumentId,
  getPlanCapture,
  onOpenDocument,
  onDocumentAction,
}: DocumentNavigation & { project: Project }) {
  const [draft, setDraft] = useState<{
    id?: string;
    base: Project;
    framing: DocumentFraming | null;
    name: string;
    scale: string;
    kind: "document" | "folder";
    folderId: string;
  } | null>(null);
  const [closed, setClosed] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; folder: boolean; name: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  const run = (base: Project, action: DocumentAction) => {
    changeDrawingDocument(base, project, action);
    onDocumentAction(base, action);
  };
  const beginCreate = (kind: "document" | "folder", folderId = "") => {
    setError("");
    setDraft({
      base: project,
      framing: getPlanCapture(),
      name: kind === "folder" ? "Neuer Ordner" : "Grundriss",
      scale: `1:${newDocumentScale(project)}`,
      kind,
      folderId,
    });
  };
  const createMenu = (folderId = "") => (
    <>
      <ContextMenuItem onSelect={() => beginCreate("document", folderId)}>
        Neues Abbild
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => beginCreate("folder")}>Neuer Ordner</ContextMenuItem>
    </>
  );
  const row = (id: string, name: string, folder: boolean, depth: number, scale?: number) => {
    const open = !closed.includes(id);
    const apply = (action: DocumentAction) => {
      try {
        run(project, action);
        setError("");
        if (action.kind === "assign-folder" && action.folderId)
          setClosed((ids) => ids.filter((id) => id !== action.folderId));
        if (action.kind === "delete") setSelected(null);
      } catch (cause) {
        setError((cause as Error).message);
      }
    };
    const beginRename = () => {
      setError("");
      setRenaming({ id, folder, name });
    };
    return (
      <ContextMenu key={id}>
        <ContextMenuTrigger asChild>
          <div
            role="treeitem"
            aria-label={name}
            aria-selected={selected === id || activeDocumentId === id}
            aria-expanded={folder ? open : undefined}
            aria-level={depth + 1}
            tabIndex={0}
            title={
              folder
                ? "Ordner öffnen · F2 oder Rechtsklick: umbenennen"
                : `1:${scale} · Doppelklick: öffnen · F2: umbenennen`
            }
            className={`flex h-7 items-center gap-1.5 rounded-sm pr-2 text-[13px] hover:bg-accent ${selected === id || activeDocumentId === id ? "bg-primary/12 text-primary" : "text-muted-foreground"}`}
            style={{ paddingLeft: 6 + depth * 13 }}
            onClick={() => {
              setSelected(id);
              if (folder) setClosed(open ? [...closed, id] : closed.filter((v) => v !== id));
            }}
            onDoubleClick={() => {
              if (!folder) onOpenDocument(id);
            }}
            onKeyDown={(e) => {
              if (e.key === "F2") {
                e.preventDefault();
                beginRename();
              }
              if (e.key === "Enter") {
                e.preventDefault();
                if (!folder) onOpenDocument(id);
                else setClosed(open ? [...closed, id] : closed.filter((v) => v !== id));
              }
            }}
          >
            {folder ? (
              open ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )
            ) : (
              <span className="w-3" />
            )}
            {folder ? (
              <Folder className="size-3.5 shrink-0" />
            ) : (
              <File className="size-3.5 shrink-0" />
            )}
            {renaming?.id === id ? (
              <input
                autoFocus
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
                onBlur={() => {
                  try {
                    run(project, {
                      kind: folder ? "rename-folder" : "rename",
                      id,
                      name: renaming.name,
                    });
                    setRenaming(null);
                  } catch (cause) {
                    setError((cause as Error).message);
                  }
                }}
              />
            ) : (
              <span className="truncate">{name}</span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {createMenu(folder ? id : project.drawingDocuments?.find((d) => d.id === id)?.folderId)}
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={beginRename}>Umbenennen</ContextMenuItem>
          {folder && (
            <ContextMenuItem
              disabled={!!project.drawingDocuments?.some((d) => d.folderId === id)}
              onSelect={() => apply({ kind: "delete-folder", id })}
            >
              Ordner löschen
            </ContextMenuItem>
          )}
          {!folder && (
            <>
              <ContextMenuItem
                onSelect={() => {
                  const document = project.drawingDocuments!.find((d) => d.id === id)!;
                  setError("");
                  setDraft({
                    id,
                    base: project,
                    kind: "document",
                    name: document.name,
                    scale: `1:${document.denominator}`,
                    folderId: document.folderId ?? "",
                    framing: document.framing ?? null,
                  });
                }}
              >
                Abbildeinstellungen
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>In Ordner verschieben</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuItem
                    onSelect={() => apply({ kind: "assign-folder", id, folderId: null })}
                  >
                    Ohne Ordner
                  </ContextMenuItem>
                  {(project.documentFolders ?? []).map((f) => (
                    <ContextMenuItem
                      key={f.id}
                      onSelect={() => apply({ kind: "assign-folder", id, folderId: f.id })}
                    >
                      {f.name}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => apply({ kind: "delete", id })}>
                Abbild löschen
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  };
  return (
    <div className="p-2 text-xs">
      <Button
        size="sm"
        variant="outline"
        aria-label="Abbild oder Ordner hinzufügen"
        onClick={() =>
          beginCreate(
            "document",
            project.documentFolders?.some((f) => f.id === selected) ? selected! : "",
          )
        }
      >
        <Plus className="size-4" /> Hinzufügen
      </Button>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div role="tree" aria-label="Abbilder" className="mt-2 min-h-40">
            {(project.documentFolders ?? []).map((folder) => (
              <div key={folder.id}>
                {row(folder.id, folder.name, true, 0)}
                {!closed.includes(folder.id) && (
                  <div role="group">
                    {(project.drawingDocuments ?? [])
                      .filter((d) => d.folderId === folder.id)
                      .map((d) => row(d.id, d.name, false, 1, d.denominator))}
                  </div>
                )}
              </div>
            ))}
            {(project.drawingDocuments ?? [])
              .filter((d) => !d.folderId)
              .map((d) => row(d.id, d.name, false, 0, d.denominator))}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>{createMenu()}</ContextMenuContent>
      </ContextMenu>
      {!draft && error && <p role="alert">{error}</p>}
      <FloatingPanel
        centered
        open={!!draft}
        title={draft?.id ? "Abbildeinstellungen" : "Hinzufügen"}
        width={400}
        height={370}
        onClose={() => setDraft(null)}
      >
        {draft && (
          <form
            className="space-y-3 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const action: DocumentAction = draft.id
                  ? {
                      kind: "settings",
                      id: draft.id,
                      name: draft.name,
                      denominator: parseOutputScale(draft.scale),
                      folderId: draft.folderId || null,
                    }
                  : draft.kind === "folder"
                    ? { kind: "create-folder", id: crypto.randomUUID(), name: draft.name }
                    : {
                        kind: "create",
                        id: crypto.randomUUID(),
                        modelViewId: crypto.randomUUID(),
                        name: draft.name,
                        denominator: parseOutputScale(draft.scale),
                        ...(draft.framing ? { framing: draft.framing } : {}),
                        ...(draft.folderId ? { folderId: draft.folderId } : {}),
                      };
                if (!draft.id && draft.kind === "document" && !draft.framing)
                  throw new Error("Bitte zuerst den Arbeitsgrundriss öffnen und ausrichten.");
                run(draft.base, action);
                setSelected(action.id);
                if (draft.folderId) setClosed((ids) => ids.filter((id) => id !== draft.folderId));
                setDraft(null);
                setError("");
              } catch (cause) {
                setError((cause as Error).message);
              }
            }}
          >
            <div className="flex gap-3">
              <label className="min-w-0 flex-1">
                Name
                <input
                  aria-label="Name"
                  maxLength={120}
                  className="w-full rounded border bg-popover p-1"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              {draft.kind === "document" && (
                <label>
                  Maßstab
                  <input
                    aria-label="Abbildmaßstab"
                    className="w-24 rounded border bg-popover p-1"
                    value={draft.scale}
                    onChange={(e) => setDraft({ ...draft, scale: e.target.value })}
                  />
                </label>
              )}
            </div>
            {!draft.id && (
              <label className="block">
                Typ
                <select
                  aria-label="Hinzufügen Typ"
                  className="ml-2 rounded border bg-popover p-1"
                  value={draft.kind}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      kind: e.target.value as "document" | "folder",
                      name: e.target.value === "folder" ? "Neuer Ordner" : "Grundriss",
                    })
                  }
                >
                  <option value="document">Abbild</option>
                  <option value="folder">Ordner</option>
                </select>
              </label>
            )}
            {draft.kind === "document" && (
              <>
                <label className="block">
                  Ordner
                  <select
                    aria-label="Abbildordner"
                    className="ml-2 rounded border bg-popover p-1"
                    value={draft.folderId}
                    onChange={(e) => setDraft({ ...draft, folderId: e.target.value })}
                  >
                    <option value="">Ohne Ordner</option>
                    {(project.documentFolders ?? []).map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  Übernommener Zoom:{" "}
                  {draft.framing
                    ? `${Number(draft.framing.pixelsPerMetre.toFixed(1))} %`
                    : "Arbeitsgrundriss öffnen"}
                </p>
                <p>
                  Gespeichert werden Startposition und Zoom. Das gesamte Modell bleibt erreichbar;
                  zugeschnitten wird später im Layoutbuch.
                </p>
              </>
            )}
            {error && (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="sm">
              {draft.id
                ? "Speichern"
                : draft.kind === "folder"
                  ? "Ordner anlegen"
                  : "Abbild erstellen"}
            </Button>
          </form>
        )}
      </FloatingPanel>
    </div>
  );
}
