import type { VisibilityAction } from "@/application/layers/visibility-actions";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/bim/model";
import { layerDeletionBlock } from "@/application/layers/actions";
import type { ManageLayerRequest } from "@/application/layers/actions";
import { FloatingPanel } from "./FloatingPanel";

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
  const reason =
    selectedId && project.layers.some((layer) => layer.id === selectedId)
      ? layerDeletionBlock(project, selectedId)
      : "Zum Löschen eine Ebene auswählen.";
  return (
    <FloatingPanel open={open} title="Ebenen" onClose={() => onOpenChange(false)}>
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
    </FloatingPanel>
  );
}
