import { useState } from "react";
import { updateObject } from "@/application/objects/actions";
import {
  objectSettings,
  objectValues,
  type ObjectToolDefaults,
} from "@/application/objects/defaults";
import { objectDefinition } from "@/domain/elements/object/catalog";
import type { PlacedObject } from "@/domain/elements/object/model";
import { projectMaterials } from "@/domain/elements/wall/assembly";
import type { Project } from "@/domain/project/schema";
import type { Selection } from "./bim-view";
import { ObjectFields } from "./ObjectFields";

/** Properties of one placed object (docs/OBJEKTBIBLIOTHEK.md, M1): one undo step per edit. */
export function ObjectProperties({
  project,
  object,
  selection,
  onChange,
  compact = false,
}: {
  project: Project;
  object: PlacedObject;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
  /** The bar shows sizes only; options and finishes live in the element window. */
  compact?: boolean;
}) {
  const [value, setValue] = useState(() => objectSettings(object));
  const [error, setError] = useState("");
  const commit = (next: ObjectToolDefaults) => {
    const stored = objectSettings(object);
    if (JSON.stringify(stored) === JSON.stringify(next)) return;
    const { mirrored, options, finishes, ...values } = objectValues(next);
    try {
      // Optional keys are set explicitly: an absent key would keep the old value in the merge.
      const changed = updateObject(project, object.id, {
        ...values,
        mirrored: mirrored ?? false,
        options,
        finishes,
      });
      onChange(changed, selection);
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Änderung nicht möglich.");
    }
  };
  return (
    <section aria-label="Objekteigenschaften" className="space-y-2">
      <h2 className="text-sm font-semibold">{objectDefinition(object.catalogId).name}</h2>
      <ObjectFields
        label="Objekt bearbeiten"
        value={value}
        onChange={setValue}
        onCommit={commit}
        layers={project.layers}
        materials={projectMaterials(project)}
        compact={compact}
      />
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
