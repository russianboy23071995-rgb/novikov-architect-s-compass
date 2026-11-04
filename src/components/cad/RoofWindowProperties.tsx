import { useState } from "react";
import { updateRoofWindow } from "@/application/roof-windows/actions";
import {
  roofWindowSettings,
  roofWindowValues,
  type RoofWindowDefaults,
} from "@/application/roof-windows/defaults";
import { ELEMENT_KINDS } from "@/domain/elements/registry";
import type { RoofWindow } from "@/domain/elements/roof/window";
import type { Project } from "@/domain/project/schema";
import type { Selection } from "./bim-view";
import { RoofWindowFields } from "./RoofWindowFields";

/** Properties of one roof window (docs/DACHFLAECHENFENSTER.md, D2): each finished edit is one
 * undo step; a size that no longer fits the roof is refused with a message. */
export function RoofWindowProperties({
  project,
  window,
  selection,
  onChange,
}: {
  project: Project;
  window: RoofWindow;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const [value, setValue] = useState(() => roofWindowSettings(window));
  const [error, setError] = useState("");
  const commit = (next: RoofWindowDefaults) => {
    const stored = roofWindowValues(roofWindowSettings(window));
    const changes = roofWindowValues(next);
    if (JSON.stringify(stored) === JSON.stringify(changes)) return;
    try {
      onChange(updateRoofWindow(project, window.id, changes), selection);
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Änderung nicht möglich.");
    }
  };
  return (
    <section aria-label="Dachflächenfenstereigenschaften" className="space-y-2">
      <h2 className="text-sm font-semibold">{ELEMENT_KINDS.roofWindow.label}</h2>
      <RoofWindowFields
        label="Dachflächenfenster bearbeiten"
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
