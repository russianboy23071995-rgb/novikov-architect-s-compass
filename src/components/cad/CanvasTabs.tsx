import { Plus, X } from "lucide-react";
import {
  CANVAS_VIEWS,
  CANVAS_VIEW_LABELS,
  canvasTabLabel,
  type CanvasView,
} from "@/application/views/canvas-tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Tab bar over the canvas (docs/SCHNITT.md, SC1): open views, close, add a view. */
export function CanvasTabs({
  tabs,
  active,
  storeyName,
  sections,
  onSelect,
  onClose,
}: {
  tabs: readonly CanvasView[];
  active: CanvasView;
  storeyName: string;
  sections: readonly { id: string; name: string }[];
  onSelect: (view: CanvasView) => void;
  onClose: (view: CanvasView) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Canvas-Ansichten"
      className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-md border border-border bg-popover/60 p-0.5 text-[11px] shadow-[inset_0_1px_0_var(--glass-highlight)] backdrop-blur-2xl"
    >
      {tabs.map((view) => {
        const label = canvasTabLabel(view, storeyName, sections);
        return (
          <div
            key={view}
            className={cn(
              "flex h-6 shrink-0 items-center rounded-sm text-muted-foreground",
              view === active && "bg-primary/15 text-primary",
            )}
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === active}
              className="h-6 px-2 hover:text-foreground"
              onClick={() => onSelect(view)}
            >
              {label}
            </button>
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
          {CANVAS_VIEWS.map((view) => (
            <DropdownMenuItem key={view} onSelect={() => onSelect(view)}>
              {CANVAS_VIEW_LABELS[view]}
              {tabs.includes(view) ? " (offen)" : ""}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
