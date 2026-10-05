import type { VisibilityAction } from "@/application/layers/visibility-actions";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/bim/model";
import { layerDeletionBlock } from "@/application/layers/actions";
import type { ManageLayerRequest } from "@/application/layers/actions";
import { clampMenuPosition } from "./demand-menu";

type Props = {
  project: Project;
  onVisibility: (base: Project, action: VisibilityAction) => void;
  canUndoVisibility: boolean;
  canRedoVisibility: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string;
  onManage: (base: Project, request: ManageLayerRequest) => void;
};
function LayerRow({
  project,
  id,
  selected,
  autoFocus,
  onSelect,
  onManage,
}: {
  project: Project;
  id: string;
  selected: boolean;
  autoFocus: boolean;
  onSelect: () => void;
  onManage: Props["onManage"];
}) {
  const layer = project.layers.find((l) => l.id === id)!;
  const base = useRef(project);
  const cancelled = useRef(false);
  return (
    <input
      aria-label={"Ebenenname " + layer.name}
      defaultValue={layer.name}
      autoFocus={autoFocus}
      className={
        "block w-full rounded border px-2 py-1 text-xs " +
        (selected
          ? "border-primary bg-accent"
          : "border-transparent bg-transparent hover:bg-accent/50")
      }
      onFocus={(event) => {
        base.current = project;
        cancelled.current = false;
        onSelect();
        if (autoFocus) event.currentTarget.select();
      }}
      onBlur={(event) => {
        if (!cancelled.current && event.currentTarget.value !== layer.name)
          onManage(base.current, { kind: "rename", id, name: event.currentTarget.value });
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          event.stopPropagation();
          cancelled.current = true;
          event.currentTarget.value = layer.name;
          event.currentTarget.blur();
        }
      }}
    />
  );
}
export function LayerManager({
  project,
  open,
  onOpenChange,
  error,
  onManage,
  onVisibility,
  canUndoVisibility,
  canRedoVisibility,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [position, setPosition] = useState({ x: 120, y: 140 });
  const [bounds, setBounds] = useState({
    width: 1024,
    height: 768,
    menuWidth: 520,
    menuHeight: 560,
  });
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const r = panel.current?.getBoundingClientRect();
      setBounds({
        width: window.innerWidth,
        height: window.innerHeight,
        menuWidth: r?.width ?? 520,
        menuHeight: r?.height ?? 560,
      });
    };
    const observer = new ResizeObserver(measure);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [open]);
  if (!open) return null;
  const visible = clampMenuPosition(position, bounds);
  const reason =
    selectedId && project.layers.some((layer) => layer.id === selectedId)
      ? layerDeletionBlock(project, selectedId)
      : "Zum Löschen eine Ebene auswählen.";
  return (
    <div
      ref={panel}
      role="dialog"
      aria-label="Ebenen"
      aria-modal="false"
      className="glass-panel-strong fixed z-50 flex h-[560px] max-h-[calc(100dvh-16px)] w-[520px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-xl border shadow-2xl"
      style={{ left: visible.x, top: visible.y }}
    >
      <header className="flex shrink-0 items-center border-b p-2">
        <button
          type="button"
          aria-label="Ebenenfenster verschieben"
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
          ⠿ Ebenen
        </button>
        <button
          type="button"
          aria-label="Ebenen schließen"
          className="rounded px-3 py-2 hover:bg-accent"
          onClick={() => onOpenChange(false)}
        >
          ✕
        </button>
      </header>
      <p className="shrink-0 px-4 py-3 text-xs text-muted-foreground">
        Häkchen: im BIM-Projekt sichtbar. Namen anklicken zum Bearbeiten · Enter oder Feld verlassen
        übernimmt · Escape verwirft die Eingabe
      </p>
      <div aria-label="Vorhandene Ebenen" className="min-h-0 flex-1 overflow-y-auto px-4 py-1">
        {project.layers.map((layer) => (
          <div key={layer.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              aria-label={"Ebene sichtbar: " + layer.name}
              checked={!project.bimVisibility.hiddenLayerIds.includes(layer.id)}
              onChange={(event) =>
                onVisibility(project, {
                  kind: "set",
                  layerId: layer.id,
                  visible: event.currentTarget.checked,
                })
              }
            />
            <LayerRow
              key={layer.id + ":" + layer.name}
              project={project}
              id={layer.id}
              selected={selectedId === layer.id}
              autoFocus={focusId === layer.id}
              onSelect={() => setSelectedId(layer.id)}
              onManage={onManage}
            />
          </div>
        ))}
      </div>
      <footer className="shrink-0 space-y-2 border-t p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canUndoVisibility}
            onClick={() => onVisibility(project, { kind: "undo" })}
          >
            Sichtbarkeit rückgängig
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canRedoVisibility}
            onClick={() => onVisibility(project, { kind: "redo" })}
          >
            Sichtbarkeit wiederholen
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="min-h-4 text-xs text-muted-foreground">
          {reason ?? "Diese leere, eigene Ebene kann gelöscht werden."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              let name = "Neue Ebene",
                i = 2;
              const names = new Set(
                project.layers.map((l) => l.name.normalize("NFC").toLowerCase()),
              );
              while (names.has(name.toLowerCase())) name = "Neue Ebene " + i++;
              const id = "layer-" + crypto.randomUUID();
              setSelectedId(id);
              setFocusId(id);
              onManage(project, { kind: "create", id, name });
            }}
          >
            Ebene Hinzufügen
          </Button>
          <Button
            variant="outline"
            disabled={Boolean(reason)}
            onClick={() => {
              if (selectedId) onManage(project, { kind: "delete", id: selectedId });
            }}
          >
            Ebene löschen
          </Button>
          <Button variant="outline" className="ml-auto" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </div>
      </footer>
    </div>
  );
}
