import {
  BoxSelect,
  PaintBucket,
  MousePointer2,
  PenLine,
  Pentagon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CadTool, ToolId } from "./cad-types";

const tools: CadTool[] = [
  { id: "hatch", label: "Schraffur", shortcut: "H", icon: PaintBucket },
  { id: "select", label: "Select", shortcut: "V", icon: MousePointer2 },
  { id: "wall", label: "Wall", shortcut: "W", icon: BoxSelect },
  { id: "slab", label: "Slab", shortcut: "S", icon: Pentagon },
  { id: "line", label: "Line", shortcut: "L", icon: PenLine },
];

type ToolRailProps = {
  activeTool: ToolId;
  collapsed: boolean;
  onSelect: (tool: ToolId) => void;
  onToggle: () => void;
};

export function ToolRail({ activeTool, collapsed, onSelect, onToggle }: ToolRailProps) {
  return (
    <aside
      className={cn(
        "glass-panel-strong z-20 flex h-full shrink-0 flex-col overflow-hidden rounded-lg transition-[width] duration-200",
        collapsed ? "w-12" : "w-[76px]",
      )}
      aria-label="CAD tools"
    >
      <div className="flex flex-1 flex-col items-center gap-1.5 px-1.5 pt-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const active = activeTool === tool.id;
          return (
            <Tooltip key={tool.id} delayDuration={250}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${tool.label} tool`}
                  aria-pressed={active}
                  onClick={() => onSelect(tool.id)}
                  className={cn(
                    "relative h-11 w-11 rounded-md border border-transparent text-muted-foreground transition-all duration-150 hover:border-border hover:bg-accent hover:text-foreground",
                    active &&
                      "border-primary/30 bg-primary/12 text-primary shadow-[inset_0_1px_0_var(--glass-highlight),0_0_18px_color-mix(in_oklab,var(--primary)_12%,transparent)] hover:bg-primary/18 hover:text-primary",
                  )}
                >
                  {active && <span className="absolute -left-1.5 h-5 w-0.5 rounded-r bg-primary" />}
                  <Icon className="size-[18px]" strokeWidth={1.65} />
                  {!collapsed && (
                    <span className="absolute bottom-0.5 text-[10px] font-medium uppercase">
                      {tool.label}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="border border-border bg-popover text-popover-foreground"
              >
                {tool.label} <span className="ml-2 text-muted-foreground">{tool.shortcut}</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <div className="border-t border-border p-1.5">
        <Tooltip delayDuration={250}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-full text-muted-foreground"
              onClick={onToggle}
              aria-label={collapsed ? "Expand tool rail" : "Collapse tool rail"}
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? "Expand tools" : "Collapse tools"}
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
