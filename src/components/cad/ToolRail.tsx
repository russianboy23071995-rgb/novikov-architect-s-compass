import { Fragment } from "react";
import { withStableHandlers } from "./stable-handlers";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CadTool, ToolId } from "./cad-types";
import { RAIL_TOOLS, SELECT_TOOL } from "./rail-tools";
import { Pictogram } from "./Pictogram";
import { TOOL_GROUPS, type ToolLayout } from "./tool-layout";

type ToolRailProps = {
  activeTool: ToolId;
  layout: ToolLayout;
  onSelect: (tool: ToolId) => void;
  /** Double click opens detailed tool settings; a single click still selects the tool. */
  onSettings?: (tool: ToolId) => void;
  /** Opens the window to arrange the tools. */
  onCustomize: () => void;
  /** Only these tools work here (Plankopfplaner, docs/PLANKOPF.md); the others are greyed. */
  allowed?: ReadonlySet<ToolId> | undefined;
};

/** Compact tool rail without labels (user decision 01.11.2026): name and key in the tooltip. */
/** Memoised with stable callbacks (docs/TABS.md). */
export const ToolRail = withStableHandlers(function ToolRail({
  activeTool,
  layout,
  onSelect,
  onSettings,
  onCustomize,
  allowed,
}: ToolRailProps) {
  const button = (tool: CadTool) => {
    const active = activeTool === tool.id;
    const blocked = !!allowed && !allowed.has(tool.id);
    // Planned tools stay greyed until they exist (WL3); not disabled, so the tooltip says so.
    const planned = !!tool.planned;
    return (
      <Tooltip key={tool.id} delayDuration={250}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${tool.label} tool`}
            aria-pressed={active}
            disabled={blocked}
            aria-disabled={planned || undefined}
            onClick={() => !planned && onSelect(tool.id)}
            onDoubleClick={() => !planned && onSettings?.(tool.id)}
            className={cn(
              "relative h-9 w-9 shrink-0 rounded-md border border-transparent text-muted-foreground transition-all duration-150 hover:border-border hover:bg-accent hover:text-foreground",
              planned &&
                "cursor-not-allowed opacity-40 hover:border-transparent hover:bg-transparent",
              active &&
                "border-primary/30 bg-primary/12 text-primary shadow-[inset_0_1px_0_var(--glass-highlight),0_0_18px_color-mix(in_oklab,var(--primary)_12%,transparent)] hover:bg-primary/18 hover:text-primary",
            )}
          >
            {active && <span className="absolute -left-1 h-5 w-0.5 rounded-r bg-primary" />}
            {tool.pictogram ? (
              <Pictogram
                group="werkzeuge"
                name={tool.pictogram}
                active={active}
                className="size-5"
              />
            ) : (
              <tool.icon className="size-[18px]" strokeWidth={1.65} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="border border-border bg-popover text-popover-foreground"
        >
          {tool.label} <span className="ml-2 text-muted-foreground">{tool.shortcut}</span>
          {tool.planned && <span className="ml-2 text-muted-foreground">kommt später</span>}
          {tool.id !== "select" && !tool.planned && (
            <span className="ml-2 text-muted-foreground">Doppelklick: Einstellungen</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  };
  return (
    <aside
      className="glass-panel-strong z-20 flex h-full w-12 shrink-0 flex-col overflow-hidden rounded-lg"
      aria-label="CAD tools"
    >
      <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-1.5 pb-2 pt-2">
        {button(SELECT_TOOL)}
        {TOOL_GROUPS.map((group) => (
          <Fragment key={group.id}>
            <div
              role="separator"
              aria-label={group.label}
              title={group.label}
              className="mt-1 w-full border-t border-border pt-0.5 text-center text-[8px] font-semibold tracking-wide text-muted-foreground/80"
            >
              {group.short}
            </div>
            {layout[group.id].map((id) => {
              const tool = RAIL_TOOLS[id];
              return tool ? button(tool) : null;
            })}
          </Fragment>
        ))}
      </div>
      <div className="border-t border-border p-1.5">
        <Tooltip delayDuration={250}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-full text-muted-foreground"
              onClick={onCustomize}
              aria-label="Werkzeugleiste anpassen"
            >
              <Settings2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Werkzeugleiste anpassen</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
});
