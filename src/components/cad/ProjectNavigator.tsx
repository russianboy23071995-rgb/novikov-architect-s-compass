import { DocumentNavigator, type DocumentNavigation } from "./DocumentNavigator";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  Box,
  Building2,
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  Layers3,
  Map,
  PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TreeNode } from "./cad-types";
import type { Project } from "@/lib/bim/model";

const iconFor = (id: string, isGroup: boolean) => {
  if (id.includes("level")) return Layers3;
  if (id === "site") return Map;
  if (id.includes("3d") || id === "building") return Box;
  if (id === "building-structure") return Building2;
  return isGroup ? Folder : File;
};

function TreeItem({
  node,
  depth,
  active,
  onSelect,
  onRename,
}: {
  onRename: (id: string) => void;
  node: TreeNode;
  depth: number;
  active: readonly string[];
  onSelect: (id: string, label: string, toggle?: boolean) => void;
}) {
  const [open, setOpen] = useState(!["saved-views", "sheets"].includes(node.id));
  const hasChildren = Boolean(node.children?.length);
  const Icon = iconFor(node.id, node.kind === "group");
  return (
    <div>
      <div
        className={cn(
          "group flex h-7 items-center gap-1 rounded-sm pr-1 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          active.includes(node.id) && "bg-primary/12 text-primary",
        )}
        style={{ paddingLeft: `${6 + depth * 13}px` }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-5 shrink-0 rounded-sm text-muted-foreground"
            onClick={() => setOpen((value) => !value)}
            aria-label={`${open ? "Collapse" : "Expand"} ${node.label}`}
          >
            {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </Button>
        ) : (
          <span className="w-5" />
        )}
        <Button
          variant="ghost"
          className="h-7 min-w-0 flex-1 justify-start gap-1.5 rounded-sm px-0 text-[13px] font-normal hover:bg-transparent"
          aria-pressed={active.includes(node.id)}
          onDoubleClick={() => onRename(node.id)}
          title={depth === 1 ? "Doppelklick zum Umbenennen" : undefined}
          onClick={(event) => onSelect(node.id, node.label, event.ctrlKey || event.metaKey)}
        >
          <Icon className="size-3.5 shrink-0 opacity-70" />
          <span className="truncate">{node.label}</span>
        </Button>
      </div>
      {open &&
        node.children?.map((child) => (
          <TreeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            active={active}
            onSelect={onSelect}
            onRename={onRename}
          />
        ))}
    </div>
  );
}

type ProjectNavigatorProps = DocumentNavigation & {
  project: Project;
  onRenameStorey: (base: Project, name: string) => void;

  active: readonly string[];
  onSelect: (id: string, label: string, toggle?: boolean) => void;
  onClose: () => void;
};

function NavigatorContent({
  active,
  onSelect,
  onClose,
  project,
  onRenameStorey,
  ...documents
}: ProjectNavigatorProps) {
  const [rename, setRename] = useState<{ base: Project; name: string } | null>(null);
  const [tab, setTab] = useState<"model" | "documents">("model");
  // The navigator represents project/storey structure, never individual geometry.
  // Its row count is independent of the number of elements in the storey.
  const modelTree = useMemo(
    () =>
      [
        {
          id: project.id,
          label: "BIM Project",
          kind: "group",
          children: [{ id: project.storey.id, label: project.storey.name, kind: "group" }],
        },
      ] satisfies TreeNode[],
    [project.id, project.storey.id, project.storey.name],
  );
  return (
    <aside
      className="glass-panel-strong flex h-full min-w-0 flex-col overflow-hidden rounded-lg"
      aria-label="Project navigator"
    >
      <header className="flex h-10 items-center justify-between border-b border-border px-3">
        <div>
          <p className="font-display text-[12px] font-semibold uppercase text-primary">Navigator</p>
          <p className="text-xs font-medium text-foreground">Project browser</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground"
          onClick={onClose}
          aria-label="Close project navigator"
        >
          <PanelRightClose className="size-4" />
        </Button>
      </header>
      <div role="tablist" aria-label="Navigatorbereiche" className="flex border-b border-border">
        <Button
          role="tab"
          aria-selected={tab === "model"}
          variant="ghost"
          size="sm"
          onClick={() => {
            setTab("model");
            documents.onOpenDocument(null);
          }}
        >
          Gebäudestruktur
        </Button>
        <Button
          role="tab"
          aria-selected={tab === "documents"}
          variant="ghost"
          size="sm"
          onClick={() => setTab("documents")}
        >
          Abbilder
        </Button>
      </div>
      {tab === "documents" ? (
        <ScrollArea className="min-h-0 flex-1">
          <DocumentNavigator key={project.id} project={project} {...documents} />
        </ScrollArea>
      ) : (
        <ScrollArea className="min-h-0 flex-1 px-1.5 py-2">
          {modelTree.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              depth={0}
              active={active}
              onSelect={onSelect}
              onRename={(id) => {
                if (id === project.storey.id)
                  setRename({ base: project, name: project.storey.name });
              }}
            />
          ))}
          {rename && (
            <form
              className="mt-2 space-y-2 px-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!rename.name.trim()) return;
                onRenameStorey(rename.base, rename.name);
                setRename(null);
              }}
            >
              <label className="text-xs">
                Geschossname
                <input
                  aria-label="Geschossname"
                  autoFocus
                  required
                  maxLength={120}
                  className="mt-1 w-full rounded border bg-background px-2 py-1 text-xs"
                  value={rename.name}
                  onChange={(event) => setRename({ ...rename, name: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setRename(null);
                  }}
                />
              </label>
              <Button size="sm" type="submit" disabled={!rename.name.trim()}>
                Umbenennen
              </Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => setRename(null)}>
                Abbrechen
              </Button>
            </form>
          )}
        </ScrollArea>
      )}
      <div className="border-t border-border px-3 py-2 text-[12px] text-muted-foreground">
        <div className="flex justify-between">
          <span>Model elements</span>
          <span className="font-mono text-foreground">
            {project.storey.walls.length +
              project.storey.windows.length +
              project.storey.hatches.length +
              project.storey.references.length +
              (project.storey.lines?.length ?? 0)}
          </span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/3 bg-primary/70" />
        </div>
      </div>
    </aside>
  );
}

const StableNavigator = memo(NavigatorContent);
/** Pointer-driven parent renders never rebuild the unchanged project tree. */
export function ProjectNavigator(props: ProjectNavigatorProps) {
  const latest = useRef(props);
  latest.current = props;
  const active = useRef(props.active);
  if (
    active.current.length !== props.active.length ||
    active.current.some((id, i) => id !== props.active[i])
  )
    active.current = props.active;
  const onClose = useCallback(() => latest.current.onClose(), []);
  const onSelect = useCallback<ProjectNavigatorProps["onSelect"]>(
    (...args) => latest.current.onSelect(...args),
    [],
  );
  const onRenameStorey = useCallback<ProjectNavigatorProps["onRenameStorey"]>(
    (...args) => latest.current.onRenameStorey(...args),
    [],
  );
  const onOpenDocument = useCallback<ProjectNavigatorProps["onOpenDocument"]>(
    (id) => latest.current.onOpenDocument(id),
    [],
  );
  const onDocumentAction = useCallback<ProjectNavigatorProps["onDocumentAction"]>(
    (...args) => latest.current.onDocumentAction(...args),
    [],
  );
  return (
    <StableNavigator
      getPlanCapture={props.getPlanCapture}
      activeDocumentId={props.activeDocumentId}
      onOpenDocument={onOpenDocument}
      onDocumentAction={onDocumentAction}
      onDocumentVisibility={props.onDocumentVisibility}
      onRenameStorey={onRenameStorey}
      project={props.project}
      active={active.current}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
}
