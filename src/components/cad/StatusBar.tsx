import { CircleDot, Grid3X3, Magnet, MoveHorizontal, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StatusBar({
  grid,
  snap,
  ortho,
  selection,
  onGrid,
  onSnap,
  onOrtho,
}: {
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
      active && "bg-primary/12 text-primary",
    );
  return (
    <footer className="glass-panel z-40 flex h-7 shrink-0 items-center gap-1 overflow-hidden rounded-md px-2">
      <div className="hidden min-w-[265px] items-center gap-2 font-mono text-[11px] text-muted-foreground sm:flex">
        <CrosshairDot />
        <span>Model coordinates · metres</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <span className="px-1 text-[11px] text-muted-foreground">m</span>
      <div className="h-3 w-px bg-border" />
      <Button variant="ghost" className={toggleClass(grid)} onClick={onGrid}>
        <Grid3X3 /> Grid
      </Button>
      <Button variant="ghost" className={toggleClass(snap)} onClick={onSnap}>
        <Magnet /> Snap 0.10 m
      </Button>
      <Button variant="ghost" className={toggleClass(ortho)} onClick={onOrtho}>
        <MoveHorizontal /> Ortho
      </Button>
      <div className="ml-auto flex items-center gap-3 whitespace-nowrap text-[11px] text-muted-foreground">
        <span className="hidden items-center gap-1 sm:flex">
          <MousePointer2 className="size-3" />
          {selection} selected
        </span>
        <span className="text-foreground">Level 01</span>
        <CircleDot className="size-3 text-status-ok" />
      </div>
    </footer>
  );
}
function CrosshairDot() {
  return (
    <span className="relative size-3">
      <span className="absolute left-1.5 top-0 h-3 w-px bg-muted-foreground" />
      <span className="absolute left-0 top-1.5 h-px w-3 bg-muted-foreground" />
    </span>
  );
}
