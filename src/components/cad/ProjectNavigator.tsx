import { useState } from "react";
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
import { wallLength } from "@/lib/bim/model";
import { BimInspector } from "./BimInspector";
import type { Selection } from "./bim-view";

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
}: {
  node: TreeNode;
  depth: number;
  active: string;
  onSelect: (id: string, label: string) => void;
}) {
  const [open, setOpen] = useState(!["saved-views", "sheets"].includes(node.id));
  const hasChildren = Boolean(node.children?.length);
  const Icon = iconFor(node.id, node.kind === "group");
  return (
    <div>
      <div
        className={cn(
          "group flex h-7 items-center gap-1 rounded-sm pr-1 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          active === node.id && "bg-primary/12 text-primary",
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
          onClick={() => onSelect(node.id, node.label)}
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
          />
        ))}
    </div>
  );
}

type ProjectNavigatorProps = {
  project: Project;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
  active: string;
  onSelect: (id: string, label: string) => void;
  onClose: () => void;
};

export function ProjectNavigator({
  active,
  onSelect,
  onClose,
  project,
  selection,
  onChange,
}: ProjectNavigatorProps) {
  const modelTree: TreeNode[] = [
    {
      id: project.id,
      label: "BIM Project",
      kind: "group",
      children: [
        {
          id: project.storey.id,
          label: "Level 01",
          kind: "group",
          children: project.storey.walls.map((wall, index) => ({
            id: wall.id,
            label: `Wall ${index + 1} · ${wallLength(wall).toFixed(2)} m`,
            kind: "group",
            children: project.storey.windows
              .filter((opening) => opening.wallId === wall.id)
              .map((opening, index) => ({
                id: opening.id,
                label: `Window ${index + 1} · ${opening.width.toFixed(2)} m`,
                kind: "item",
              })),
          })),
        },
      ],
    },
  ];
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
      <ScrollArea className="min-h-0 flex-1 px-1.5 py-2">
        {modelTree.map((node) => (
          <TreeItem key={node.id} node={node} depth={0} active={active} onSelect={onSelect} />
        ))}
        <BimInspector
          key={JSON.stringify([selection, project])}
          project={project}
          selection={selection}
          onChange={onChange}
        />
      </ScrollArea>
      <div className="border-t border-border px-3 py-2 text-[12px] text-muted-foreground">
        <div className="flex justify-between">
          <span>Model elements</span>
          <span className="font-mono text-foreground">
            {project.storey.walls.length + project.storey.windows.length}
          </span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/3 bg-primary/70" />
        </div>
      </div>
    </aside>
  );
}
