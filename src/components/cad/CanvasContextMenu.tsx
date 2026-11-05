import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

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
  | "separator"
  /** Group heading (not clickable). */
  | { heading: string }
  /** Opens its entries in a panel to the right on click, e.g. "Darstellungsreihenfolge". */
  | { id: string; label: string; submenu: readonly ContextMenuEntry[] };

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
  onRepeat,
}: {
  position: { x: number; y: number };
  title: string;
  entries: readonly ContextMenuEntry[];
  onClose: () => void;
  /** A second right click right after opening, the pointer still at the menu's corner. */
  onRepeat?: (() => void) | undefined;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const openedAt = useRef(performance.now());
  const [place, setPlace] = useState(position);
  const [openSub, setOpenSub] = useState<string | null>(null);
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
      onContextMenu={(event) => {
        event.preventDefault();
        if (performance.now() - openedAt.current <= 450) onRepeat?.();
      }}
    >
      <p className="truncate px-2 py-1 font-semibold text-muted-foreground">{title}</p>
      {entries.map((entry, i) => {
        if (entry === "separator" || "heading" in entry || !("submenu" in entry))
          return <Row key={i} entry={entry} onClose={onClose} />;
        const open = openSub === entry.id;
        return (
          <div key={entry.id} className="relative">
            <button
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpenSub(open ? null : entry.id)}
              className={`${ROW} ${open ? "bg-muted" : ""}`}
            >
              <span>{entry.label}</span>
              <ChevronRight className="size-3.5 text-muted-foreground" />
            </button>
            {open && (
              <div
                role="menu"
                aria-label={entry.label}
                className={`glass-panel-strong absolute top-0 z-[61] min-w-44 rounded-lg border p-1 shadow-lg ${
                  place.x + 460 > window.innerWidth ? "right-full mr-1" : "left-full ml-1"
                }`}
              >
                {entry.submenu.map((item, k) => (
                  <Row key={k} entry={item} onClose={onClose} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const ROW =
  "flex w-full items-center justify-between gap-4 rounded px-2 py-1 text-left hover:bg-muted focus:bg-muted focus:outline-none disabled:cursor-default disabled:opacity-45 disabled:hover:bg-transparent";

function Row({ entry, onClose }: { entry: ContextMenuEntry; onClose: () => void }) {
  if (entry === "separator") return <div role="separator" className="my-1 border-t" />;
  if ("heading" in entry)
    return <p className="px-2 pt-1 text-[11px] text-muted-foreground">{entry.heading}</p>;
  if ("submenu" in entry) return null;
  return (
    <button
      type="button"
      role="menuitem"
      disabled={!!entry.disabled}
      title={entry.disabled || undefined}
      onClick={() => {
        onClose();
        entry.run();
      }}
      className={`${ROW} ${entry.danger ? "text-destructive" : ""}`}
    >
      <span>{entry.label}</span>
      {entry.shortcut && <span className="text-muted-foreground">{entry.shortcut}</span>}
    </button>
  );
}
