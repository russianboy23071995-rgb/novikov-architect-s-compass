import { useRef } from "react";
import { clampSplitRatio, SPLIT_RATIO, type CanvasSplit } from "@/application/views/canvas-split";
import { cn } from "@/lib/utils";

/**
 * The line between the two fields of a split (docs/SPLITSCREEN.md): drag to move it, double
 * click to centre it again. Sits in the same area as the fields, so the ratio is the pointer's
 * share of that area.
 */
export function SplitDivider({
  split,
  onRatio,
}: {
  split: CanvasSplit;
  onRatio: (ratio: number) => void;
}) {
  const handle = useRef<HTMLDivElement>(null);
  const row = split.direction === "row";
  const ratioAt = (event: React.PointerEvent) => {
    const area = handle.current?.offsetParent?.getBoundingClientRect();
    if (!area) return null;
    return clampSplitRatio(
      row
        ? (event.clientX - area.left) / Math.max(1, area.width)
        : (event.clientY - area.top) / Math.max(1, area.height),
    );
  };
  const at = `${(split.ratio * 100).toFixed(3)}%`;
  return (
    <div
      ref={handle}
      role="separator"
      aria-label="Trennlinie der geteilten Ansicht"
      aria-orientation={row ? "vertical" : "horizontal"}
      aria-valuemin={SPLIT_RATIO.min * 100}
      aria-valuemax={SPLIT_RATIO.max * 100}
      aria-valuenow={Math.round(split.ratio * 100)}
      tabIndex={0}
      title="Ziehen verschiebt, Doppelklick mittig"
      className={cn(
        "group absolute z-[35] flex items-center justify-center outline-none",
        row
          ? "top-0 h-full w-2 -translate-x-1/2 cursor-col-resize"
          : "left-0 h-2 w-full -translate-y-1/2 cursor-row-resize",
      )}
      style={row ? { left: at } : { top: at }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const ratio = ratioAt(event);
        if (ratio !== null) onRatio(ratio);
      }}
      onDoubleClick={() => onRatio(SPLIT_RATIO.initial)}
      onKeyDown={(event) => {
        const step =
          event.key === (row ? "ArrowLeft" : "ArrowUp")
            ? -0.05
            : event.key === (row ? "ArrowRight" : "ArrowDown")
              ? 0.05
              : 0;
        if (step) {
          event.preventDefault();
          onRatio(clampSplitRatio(split.ratio + step));
        }
      }}
    >
      <div
        className={cn(
          "rounded-full bg-border transition-colors group-hover:bg-primary/60 group-focus-visible:bg-primary",
          row ? "h-full w-px" : "h-px w-full",
        )}
      />
    </div>
  );
}
