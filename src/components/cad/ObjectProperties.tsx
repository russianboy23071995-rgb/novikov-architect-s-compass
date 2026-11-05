import { useState } from "react";
import { updateObject } from "@/application/objects/actions";
import {
  objectSettings,
  objectValues,
  type ObjectToolDefaults,
} from "@/application/objects/defaults";
import { objectDefinition } from "@/domain/elements/object/catalog";
import type { PlacedObject } from "@/domain/elements/object/model";
import type { Project } from "@/domain/project/schema";
import type { Selection } from "./bim-view";
import { ObjectFields } from "./ObjectFields";

/** Properties of one placed object (docs/OBJEKTBIBLIOTHEK.md, M1): one undo step per edit. */
export function ObjectProperties({
  project,
  object,
  selection,
  onChange,
}: {
  project: Project;
  object: PlacedObject;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const [value, setValue] = useState(() => objectSettings(object));
  const [error, setError] = useState("");
  const commit = (next: ObjectToolDefaults) => {
    const stored = objectSettings(object);
    if (JSON.stringify(stored) === JSON.stringify(next)) return;
    const { mirrored, ...values } = objectValues(next);
    try {
      // `mirrored` is set explicitly: an absent key would keep the old value in the merge.
      const changed = updateObject(project, object.id, {
        ...values,
        mirrored: mirrored ?? false,
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
      />
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
