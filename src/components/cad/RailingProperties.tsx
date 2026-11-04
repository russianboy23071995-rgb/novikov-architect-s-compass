import { useState } from "react";
import { updateRailing } from "@/application/railings/actions";
import {
  railingSettings,
  railingValues,
  type RailingDefaults,
} from "@/application/railings/defaults";
import { ELEMENT_KINDS } from "@/domain/elements/registry";
import { railingLength, type Railing } from "@/domain/elements/railing/model";
import type { Project } from "@/domain/project/schema";
import type { Selection } from "./bim-view";
import { RailingFields } from "./RailingFields";

/** Properties of one railing (docs/GELAENDER.md, G2): each finished edit is one undo step. */
export function RailingProperties({
  project,
  railing,
  selection,
  onChange,
}: {
  project: Project;
  railing: Railing;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const [value, setValue] = useState(() => railingSettings(railing));
  const [error, setError] = useState("");
  const commit = (next: RailingDefaults) => {
    const stored = railingValues(railingSettings(railing));
    const changes = railingValues(next);
    if (JSON.stringify(stored) === JSON.stringify(changes)) return;
    try {
      onChange(updateRailing(project, railing.id, changes), selection);
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Änderung nicht möglich.");
    }
  };
  return (
    <section aria-label="Geländereigenschaften" className="space-y-2">
      <h2 className="text-sm font-semibold">
        {ELEMENT_KINDS.railing.label}{" "}
        <span className="font-normal text-muted-foreground">
          · Länge {railingLength(railing).toFixed(2).replace(".", ",")} m
        </span>
      </h2>
      <RailingFields
        label="Geländer bearbeiten"
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
