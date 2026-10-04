import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project } from "@/lib/bim/model";
import type { ManageLayerRequest } from "@/application/layers/actions";

type Props = {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string;
  onManage: (base: Project, request: ManageLayerRequest) => void;
};

function LayerForms({ project, onManage }: Pick<Props, "project" | "onManage">) {
  const [selectedId, setSelectedId] = useState(project.layers[0]!.id);
  const selected = project.layers.find((layer) => layer.id === selectedId)!;
  const nameCounts = new Map<string, number>();
  for (const layer of project.layers)
    nameCounts.set(layer.name, (nameCounts.get(layer.name) ?? 0) + 1);
  return (
    <div className="space-y-5">
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const name = String(new FormData(event.currentTarget).get("name") ?? "");
          onManage(project, { kind: "create", id: `layer-${crypto.randomUUID()}`, name });
        }}
      >
        <label className="min-w-0 flex-1 text-xs">
          Neue Ebene
          <Input name="name" aria-label="Name der neuen Ebene" placeholder="z. B. Bestand" />
        </label>
        <Button type="submit">Erstellen</Button>
      </form>
      <label className="block text-xs">
        Vorhandene Ebene
        <select
          aria-label="Ebene zum Umbenennen"
          className="mt-1 w-full rounded border border-border bg-background p-2"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {project.layers.map((layer) => (
            <option value={layer.id} key={layer.id}>
              {layer.name}
              {nameCounts.get(layer.name)! > 1 ? ` · ${layer.id}` : ""}
            </option>
          ))}
        </select>
      </label>
      <form
        key={selectedId}
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const name = String(new FormData(event.currentTarget).get("name") ?? "");
          onManage(project, { kind: "rename", id: selectedId, name });
        }}
      >
        <label className="min-w-0 flex-1 text-xs">
          Ebenenname
          <Input name="name" aria-label="Neuer Name der Ebene" defaultValue={selected.name} />
        </label>
        <Button type="submit">Umbenennen</Button>
      </form>
    </div>
  );
}

export function LayerManager({ project, open, onOpenChange, error, onManage }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel-strong max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Ebenen verwalten</DialogTitle>
          <DialogDescription>
            Organisationsebenen erstellen und umbenennen. Änderungen werden sofort übernommen und
            lassen sich nach dem Schließen mit Undo zurücknehmen.
          </DialogDescription>
        </DialogHeader>
        <LayerForms key={JSON.stringify(project)} project={project} onManage={onManage} />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Schließen
        </Button>
      </DialogContent>
    </Dialog>
  );
}
