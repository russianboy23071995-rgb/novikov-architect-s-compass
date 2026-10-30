import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type ContextMenuEntry =
  | {
      id: string;
      label: string;
      shortcut?: string;
      /** Disabled entries stay visible with their reason as tooltip. */
      disabled?: string | false;
      danger?: boolean;
      run: () => void;
    }
  | "separator";

/**
 * Right-click menu of the canvas, 2D and 3D (docs/KONTEXTMENUE.md): opens at the pointer, stays
 * inside the window, closes on Escape, a click outside or after a command. Commands come from
 * the workspace so 2D, 3D and the menu bar share one behaviour.
 */
export function CanvasContextMenu({
  position,
  title,
  entries,
  onClose,
}: {
  position: { x: number; y: number };
  title: string;
  entries: readonly ContextMenuEntry[];
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState(position);
  useLayoutEffect(() => {
    const rect = panel.current?.getBoundingClientRect();
    const width = rect?.width ?? 220,
      height = rect?.height ?? 240;
    setPlace({
      x: Math.max(4, Math.min(position.x, window.innerWidth - width - 4)),
      y: Math.max(4, Math.min(position.y, window.innerHeight - height - 4)),
    });
  }, [position]);
  useEffect(() => {
    const down = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || !panel.current?.contains(target)) onClose();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("keydown", key, true);
    };
  }, [onClose]);
  useEffect(() => {
    panel.current?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
  }, []);
  return (
    <div
      ref={panel}
      role="menu"
      aria-label="Kontextmenü"
      className="glass-panel-strong fixed z-[60] min-w-52 rounded-lg border p-1 text-xs shadow-lg"
      style={{ left: place.x, top: place.y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <p className="truncate px-2 py-1 font-semibold text-muted-foreground">{title}</p>
      {entries.map((entry, i) =>
        entry === "separator" ? (
          <div key={`sep-${i}`} role="separator" className="my-1 border-t" />
        ) : (
          <button
            key={entry.id}
            type="button"
            role="menuitem"
            disabled={!!entry.disabled}
            title={entry.disabled || undefined}
            onClick={() => {
              onClose();
              entry.run();
            }}
            className={`flex w-full items-center justify-between gap-4 rounded px-2 py-1 text-left hover:bg-muted focus:bg-muted focus:outline-none disabled:cursor-default disabled:opacity-45 disabled:hover:bg-transparent ${entry.danger ? "text-destructive" : ""}`}
          >
            <span>{entry.label}</span>
            {entry.shortcut && <span className="text-muted-foreground">{entry.shortcut}</span>}
          </button>
        ),
      )}
    </div>
  );
}
