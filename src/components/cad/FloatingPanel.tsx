import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { clampMenuPosition } from "./demand-menu";
/** Shared non-modal Glass Flow window. Body controls never initiate dragging. */
export function FloatingPanel({
  open,
  title,
  onClose,
  width = 520,
  height = 560,
  centered = false,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  width?: number;
  height?: number;
  centered?: boolean;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [position, setPosition] = useState({ x: 120, y: 140 });
  const [bounds, setBounds] = useState({
    width: 1024,
    height: 768,
    menuWidth: width,
    menuHeight: height,
  });
  useEffect(() => {
    if (!open) {
      drag.current = null;
      return;
    }
    let firstMeasure = true;
    const measure = () => {
      const r = panel.current?.getBoundingClientRect();
      if (firstMeasure && centered)
        setPosition({
          x: (window.innerWidth - (r?.width ?? width)) / 2,
          y: (window.innerHeight - (r?.height ?? height)) / 2,
        });
      firstMeasure = false;
      setBounds({
        width: window.innerWidth,
        height: window.innerHeight,
        menuWidth: r?.width ?? width,
        menuHeight: r?.height ?? height,
      });
    };
    const observer = new ResizeObserver(measure);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      drag.current = null;
    };
  }, [open, width, height, centered]);
  if (!open || typeof document === "undefined") return null;
  const visible = clampMenuPosition(position, bounds);
  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-label={title}
      aria-modal="false"
      className="glass-panel-strong fixed z-50 flex max-h-[calc(100dvh-16px)] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-xl border shadow-2xl"
      style={{ left: visible.x, top: visible.y, width, height }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <header className="flex shrink-0 items-center border-b p-2">
        <button
          type="button"
          aria-label={`${title} verschieben`}
          title="Ziehen oder mit Pfeiltasten verschieben"
          className="flex-1 cursor-move touch-none rounded px-3 py-2 text-left font-semibold"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, left: visible.x, top: visible.y };
          }}
          onPointerMove={(event) => {
            if (drag.current)
              setPosition(
                clampMenuPosition(
                  {
                    x: drag.current.left + event.clientX - drag.current.x,
                    y: drag.current.top + event.clientY - drag.current.y,
                  },
                  bounds,
                ),
              );
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onLostPointerCapture={() => {
            drag.current = null;
          }}
          onKeyDown={(event) => {
            const offset = {
              ArrowLeft: [-10, 0],
              ArrowRight: [10, 0],
              ArrowUp: [0, -10],
              ArrowDown: [0, 10],
            }[event.key];
            if (offset) {
              event.preventDefault();
              event.stopPropagation();
              setPosition(
                clampMenuPosition({ x: visible.x + offset[0]!, y: visible.y + offset[1]! }, bounds),
              );
            }
          }}
        >
          ⠿ {title}
        </button>
        <button
          type="button"
          aria-label={`${title} schließen`}
          className="rounded px-3 py-2 hover:bg-accent"
          onClick={onClose}
        >
          ✕
        </button>
      </header>
      {children}
    </div>,
    document.body,
  );
}
