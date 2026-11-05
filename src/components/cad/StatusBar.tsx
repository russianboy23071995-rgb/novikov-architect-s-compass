import type { ReactNode } from "react";
import { GridControls } from "./GridControls";
import type { GridSettings } from "@/application/snapping/grid-settings";
import { CircleDot, Grid3X3, Magnet, MoveHorizontal, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACTIVE_CONTROL } from "./active-control";

export function StatusBar({
  storeyName,
  zoomSlot,
  zoomKind,
  recoveryStatus,
  grid,
  gridSettings,
  onGridSettings,
  snap,
  ortho,
  selection,
  onGrid,
  onSnap,
  onOrtho,
}: {
  storeyName: string;
  recoveryStatus?: ReactNode;
  zoomSlot: (element: HTMLDivElement | null) => void;
  /** Tabs stay mounted, each with its zoom bar: only the shown one appears (docs/TABS.md). */
  zoomKind: "plan" | "solid" | "layout";
  gridSettings: GridSettings;
  onGridSettings: (value: GridSettings) => void;
  grid: boolean;
  snap: boolean;
  ortho: boolean;
  selection: number;
  onGrid: () => void;
  onSnap: () => void;
  onOrtho: () => void;
}) {
  const toggleClass = (active: boolean) =>
    cn(
      "h-6 rounded-sm px-2 text-[11px] font-normal text-muted-foreground hover:text-foreground",
      active && ACTIVE_CONTROL,
    );
  return (
    <footer className="glass-panel z-40 flex h-7 shrink-0 items-center gap-1 overflow-hidden rounded-md px-2">
      {recoveryStatus}
      <div className="h-3 w-px bg-border" />
      <div
        ref={zoomSlot}
        className={cn(
          "shrink-0 [&>*]:hidden",
          zoomKind === "plan" && "[&>[data-zoom-kind=plan]]:flex",
          zoomKind === "solid" && "[&>[data-zoom-kind=solid]]:flex",
          zoomKind === "layout" && "[&>[data-zoom-kind=layout]]:flex",
        )}
      />
      <div className="h-3 w-px bg-border" />
      <Button variant="ghost" className={toggleClass(grid)} onClick={onGrid}>
        <Grid3X3 /> Grid
      </Button>
      <Button
        variant="ghost"
        className={toggleClass(snap)}
        onClick={onSnap}
        title="Rasterengine: an Ecken, Linien, Mitten, Schnittpunkten und Kanten einrasten. Rasterfang zusätzlich über den Schalter daneben."
      >
        <Magnet /> Rasterengine
      </Button>
      <GridControls value={gridSettings} onChange={onGridSettings} />
      <Button variant="ghost" className={toggleClass(ortho)} onClick={onOrtho}>
        <MoveHorizontal /> Ortho
      </Button>
      <div className="ml-auto flex items-center gap-3 whitespace-nowrap text-[11px] text-muted-foreground">
        <span className="hidden items-center gap-1 sm:flex">
          <MousePointer2 className="size-3" />
          {selection} selected
        </span>
        <span className="text-foreground">{storeyName}</span>
        <CircleDot className="size-3 text-status-ok" />
      </div>
    </footer>
  );
}
