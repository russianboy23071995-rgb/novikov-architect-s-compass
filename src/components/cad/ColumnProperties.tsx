import { useState } from "react";
import { updateColumn } from "@/application/columns/actions";
import { columnSettings, columnValues, type ColumnDefaults } from "@/application/columns/defaults";
import { ELEMENT_KINDS } from "@/domain/elements/registry";
import type { Column } from "@/domain/elements/column/model";
import type { Project } from "@/domain/project/schema";
import type { Selection } from "./bim-view";
import { ColumnFields } from "./ColumnFields";

/** Properties of one column (docs/STUETZEN.md, P2): each finished edit is one undo step. */
export function ColumnProperties({
  project,
  column,
  selection,
  onChange,
}: {
  project: Project;
  column: Column;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const [value, setValue] = useState(() => columnSettings(column));
  const [error, setError] = useState("");
  const commit = (next: ColumnDefaults) => {
    const stored = columnValues(columnSettings(column));
    const changes = columnValues(next);
    if (JSON.stringify(stored) === JSON.stringify(changes)) return;
    try {
      onChange(updateColumn(project, column.id, changes), selection);
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Änderung nicht möglich.");
    }
  };
  return (
    <section aria-label="Stützeneigenschaften" className="space-y-2">
      <h2 className="text-sm font-semibold">{ELEMENT_KINDS.column.label}</h2>
      <ColumnFields
        label="Stütze bearbeiten"
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
