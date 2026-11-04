import { Plus, X } from "lucide-react";
import {
  CANVAS_TAB_KINDS,
  CANVAS_TAB_KIND_LABELS,
  canvasTabKind,
  canvasTabLabel,
  type CanvasTabKind,
  type CanvasView,
} from "@/application/views/canvas-tabs";
import { SPLIT_DIRECTION_LABELS, type SplitDirection } from "@/application/views/canvas-split";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Tab bar over the canvas (docs/SCHNITT.md, SC1; docs/TABS.md): one tab per kind, close, open a
 * kind from the menu. A right click on a tab opens it beside or below another one
 * (docs/SPLITSCREEN.md). */
export function CanvasTabs({
  tabs,
  active,
  storeyName,
  sections,
  layouts = [],
  onSelect,
  onClose,
  onOpenKind,
  available,
  canSplit = () => false,
  onSplit = () => {},
  split = false,
  onUnsplit = () => {},
}: {
  tabs: readonly CanvasView[];
  active: CanvasView;
  storeyName: string;
  sections: readonly { id: string; name: string }[];
  /** Layouts and master layouts, for the names of layout tabs. */
  layouts?: readonly { id: string; name: string }[];
  onSelect: (view: CanvasView) => void;
  onClose: (view: CanvasView) => void;
  /** Opens the tab of a kind: its last content, else the first view of that kind. */
  onOpenKind: (kind: CanvasTabKind) => void;
  /** Kinds that have something to show (a project without sections has no section tab). */
  available: ReadonlySet<CanvasTabKind>;
  /** Whether the tab can open in a split field (not the layout book, a partner of another kind). */
  canSplit?: (view: CanvasView) => boolean;
  onSplit?: (view: CanvasView, direction: SplitDirection) => void;
  /** A split is shown; the menu offers to end it. */
  split?: boolean;
  onUnsplit?: () => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Canvas-Ansichten"
      className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-md border border-border bg-popover/60 p-0.5 text-[11px] shadow-[inset_0_1px_0_var(--glass-highlight)] backdrop-blur-2xl"
    >
      {tabs.map((view) => {
        const label = canvasTabLabel(view, storeyName, sections, layouts);
        return (
          <div
            key={view}
            className={cn(
              "flex h-6 shrink-0 items-center rounded-sm text-muted-foreground",
              view === active && "bg-primary/15 text-primary",
            )}
          >
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === active}
                  className="h-6 px-2 hover:text-foreground"
                  onClick={() => onSelect(view)}
                >
                  {label}
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent>
                {(["row", "column"] as const).map((direction) => (
                  <ContextMenuItem
                    key={direction}
                    disabled={!canSplit(view)}
                    onSelect={() => onSplit(view, direction)}
                  >
                    {SPLIT_DIRECTION_LABELS[direction]}
                  </ContextMenuItem>
                ))}
                {split && (
                  <>
                    <ContextMenuSeparator />
                    <ContextMenuItem onSelect={onUnsplit}>Aufteilung aufheben</ContextMenuItem>
                  </>
                )}
              </ContextMenuContent>
            </ContextMenu>
            {tabs.length > 1 && (
              <button
                type="button"
                className="mr-0.5 grid size-4 place-items-center rounded-sm hover:bg-accent hover:text-foreground"
                aria-label={`${label} schließen`}
                onClick={() => onClose(view)}
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        );
      })}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 text-muted-foreground"
            aria-label="Ansicht als Tab öffnen"
          >
            <Plus className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {CANVAS_TAB_KINDS.map((kind) => (
            <DropdownMenuItem
              key={kind}
              disabled={!available.has(kind)}
              onSelect={() => onOpenKind(kind)}
            >
              {CANVAS_TAB_KIND_LABELS[kind]}
              {tabs.some((t) => canvasTabKind(t) === kind) ? " (offen)" : ""}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
