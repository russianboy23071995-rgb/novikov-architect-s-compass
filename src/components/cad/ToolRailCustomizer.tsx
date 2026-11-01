import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ToolId } from "./cad-types";
import { RAIL_TOOLS } from "./rail-tools";
import {
  DEFAULT_TOOL_LAYOUT,
  moveTool,
  stepTool,
  TOOL_GROUPS,
  type ToolGroupId,
  type ToolLayout,
} from "./tool-layout";

const steps = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
} as const;

type Slot = { group: ToolGroupId; index: number };

/**
 * Arranging the tool rail (docs/WERKZEUGLEISTE.md, WL1): the groups as columns; a tool is
 * dragged within its group or into another one (pointer events, so mouse, pen and touch work
 * alike), or moved with the arrow keys. Every change shows in the rail at once and is
 * remembered in this browser.
 */
export function ToolRailCustomizer({
  layout,
  onChange,
}: {
  layout: ToolLayout;
  onChange: (layout: ToolLayout) => void;
}) {
  const drag = useRef<{ tool: ToolId; pointerId: number; x: number; y: number } | null>(null);
  const [dragged, setDragged] = useState<ToolId | null>(null);
  const [over, setOver] = useState<Slot | null>(null);
  /** The slot under the pointer: before or after the tool there, or the end of a group. */
  const slotAt = (x: number, y: number): Slot | null => {
    const element = document.elementFromPoint(x, y);
    const item = element?.closest<HTMLElement>("[data-arrange-tool]");
    const column = element?.closest<HTMLElement>("[data-arrange-group]");
    if (!column) return null;
    const group = column.dataset["arrangeGroup"] as ToolGroupId;
    if (!item) return { group, index: layout[group].length };
    const index = layout[group].indexOf(item.dataset["arrangeTool"] as ToolId);
    const box = item.getBoundingClientRect();
    return { group, index: index + (y > box.top + box.height / 2 ? 1 : 0) };
  };
  const focusTool = (tool: ToolId) =>
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`[data-arrange-tool="${tool}"]`)?.focus(),
    );
  const end = () => {
    drag.current = null;
    setDragged(null);
    setOver(null);
  };
  return (
    <section aria-label="Werkzeugleiste anpassen" className="grid gap-3 p-3 text-xs">
      <p className="text-muted-foreground">
        Symbole ziehen, um sie zu sortieren oder in eine andere Rubrik zu legen. Mit der Tastatur:
        Pfeil hoch/runter innerhalb der Rubrik, links/rechts in die Nachbarrubrik. Die Anordnung
        wird in diesem Browser gespeichert. Das Auswahlwerkzeug bleibt immer oben.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {TOOL_GROUPS.map((group) => (
          <div
            key={group.id}
            role="list"
            aria-label={group.label}
            data-arrange-group={group.id}
            className={cn(
              "flex min-h-40 flex-col gap-1 rounded-md border border-border p-1.5",
              over?.group === group.id && "border-primary/60",
            )}
          >
            <p className="px-1 pb-1 font-medium">{group.label}</p>
            {layout[group.id].map((id, index) => {
              const tool = RAIL_TOOLS[id];
              if (!tool) return null;
              const Icon = tool.icon;
              const marked = dragged && over?.group === group.id;
              return (
                <div
                  key={id}
                  role="listitem"
                  tabIndex={0}
                  data-arrange-tool={id}
                  aria-label={`${tool.label}, ${group.label}, Platz ${index + 1}`}
                  className={cn(
                    "flex cursor-grab touch-none select-none items-center gap-2 rounded border border-transparent bg-background/60 px-2 py-1 outline-none focus-visible:border-primary",
                    dragged === id && "opacity-40",
                    marked && over.index === index && "border-t-primary",
                    marked &&
                      over.index === index + 1 &&
                      index === layout[group.id].length - 1 &&
                      "border-b-primary",
                  )}
                  onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    drag.current = {
                      tool: id,
                      pointerId: event.pointerId,
                      x: event.clientX,
                      y: event.clientY,
                    };
                  }}
                  onPointerMove={(event) => {
                    const d = drag.current;
                    if (!d || d.pointerId !== event.pointerId) return;
                    // A few pixels before it counts as dragging, so a click only focuses.
                    if (!dragged && Math.hypot(event.clientX - d.x, event.clientY - d.y) < 4)
                      return;
                    setDragged(d.tool);
                    setOver(slotAt(event.clientX, event.clientY));
                  }}
                  onPointerUp={(event) => {
                    const d = drag.current;
                    if (!d || d.pointerId !== event.pointerId) return;
                    const slot = dragged ? slotAt(event.clientX, event.clientY) : null;
                    end();
                    if (slot) onChange(moveTool(layout, d.tool, slot.group, slot.index));
                  }}
                  onPointerCancel={end}
                  onKeyDown={(event) => {
                    const step = steps[event.key as keyof typeof steps];
                    if (!step) return;
                    event.preventDefault();
                    onChange(stepTool(layout, id, step));
                    focusTool(id);
                  }}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.65} />
                  {tool.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div>
        <Button size="sm" variant="outline" onClick={() => onChange(DEFAULT_TOOL_LAYOUT)}>
          Zurücksetzen
        </Button>
      </div>
    </section>
  );
}
