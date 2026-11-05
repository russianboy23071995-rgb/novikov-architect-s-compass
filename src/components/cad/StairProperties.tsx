import { useState } from "react";
import { updateStair } from "@/application/stairs/actions";
import { stairSettings, stairValues, type StairDefaults } from "@/application/stairs/defaults";
import { ELEMENT_KINDS } from "@/domain/elements/registry";
import type { Stair } from "@/domain/elements/stair/model";
import type { Project } from "@/domain/project/schema";
import { storeyOf } from "@/domain/storeys/access";
import type { Selection } from "./bim-view";
import { StairFields } from "./StairFields";

/** Properties of one stair (docs/TREPPE.md, TR2): all values, each finished edit one undo step. */
export function StairProperties({
  project,
  stair,
  selection,
  onChange,
}: {
  project: Project;
  stair: Stair;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const [value, setValue] = useState(() => stairSettings(stair));
  const [error, setError] = useState("");
  const commit = (next: StairDefaults) => {
    const stored = stairValues(stairSettings(stair));
    const changes = stairValues(next);
    if (JSON.stringify(stored) === JSON.stringify(changes)) return;
    try {
      // Auto values are absent in `changes`: an explicit undefined hands them back to the rule.
      onChange(
        updateStair(project, stair.id, {
          riserCount: undefined,
          tread: undefined,
          turn: undefined,
          firstRisers: undefined,
          landingDepth: undefined,
          eye: undefined,
          ...changes,
        }),
        selection,
      );
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Änderung nicht möglich.");
    }
  };
  return (
    <section aria-label="Treppeneigenschaften" className="space-y-2">
      <h2 className="text-sm font-semibold">{ELEMENT_KINDS.stair.label}</h2>
      <StairFields
        value={value}
        onChange={setValue}
        onCommit={commit}
        layers={project.layers}
        storeyHeight={storeyOf(project).height ?? null}
      />
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
