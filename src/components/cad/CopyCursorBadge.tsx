import { useEffect, useState } from "react";

/**
 * The plus beside the cursor while a move, turn or mirror sets down a copy
 * (docs/TASTENKUERZEL.md, B1). It follows the pointer and never takes a click.
 */
export function CopyCursorBadge({ active }: { active: boolean }) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!active) return;
    const follow = (event: PointerEvent) => setAt({ x: event.clientX, y: event.clientY });
    window.addEventListener("pointermove", follow, { passive: true });
    return () => window.removeEventListener("pointermove", follow);
  }, [active]);
  if (!active || !at) return null;
  return (
    <div
      aria-label="Kopie"
      role="status"
      className="pointer-events-none fixed z-[100] flex size-5 items-center justify-center rounded-full bg-primary text-sm font-bold leading-none text-primary-foreground shadow"
      style={{ left: at.x + 12, top: at.y + 12 }}
    >
      +
    </div>
  );
}
