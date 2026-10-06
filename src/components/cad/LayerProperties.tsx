import type { Project } from "@/lib/bim/model";
import type { Selection } from "./bim-view";
import { selectedLayerElement } from "@/application/layers/selection";

export function LayerProperties({
  project,
  selection,
  disabled,
  onAssign,
}: {
  project: Project;
  selection: Selection;
  disabled: boolean;
  onAssign: (base: Project, target: NonNullable<Selection>, layerId: string) => void;
}) {
  const element = selectedLayerElement(project, selection);
  if (!selection || !element) return null;
  return (
    <label className="mb-2 flex items-center gap-2 text-xs">
      Ebene
      <select
        aria-label="Ebene des ausgewählten Elements"
        className="h-8 max-w-56 rounded border border-border bg-background px-2"
        value={element.layerId}
        disabled={disabled}
        onChange={(event) => onAssign(project, selection, event.target.value)}
      >
        {project.layers.map((layer) => (
          <option key={layer.id} value={layer.id}>
            {layer.name}
          </option>
        ))}
      </select>
    </label>
  );
}
