import { useState } from "react";
import type { Project } from "@/domain/project/schema";
import { FloatingPanel } from "./FloatingPanel";
import { SettingsSections } from "./SettingsSections";

export function BuildingSettings({
  project,
  onClose,
  onHeight,
}: {
  project: Project;
  onClose: () => void;
  onHeight: (base: Project, height: number) => void;
}) {
  const [draft, setDraft] = useState<{ base: Project; value: string } | null>(null);
  const value =
    draft?.value ?? (project.storey.height === null ? "" : String(project.storey.height));
  const parsed = Number(value.replace(",", "."));
  const invalid = value.trim() !== "" && (!Number.isFinite(parsed) || parsed <= 0);
  const stale = draft !== null && draft.base !== project;
  const commit = () => {
    if (!draft || stale || !value.trim() || invalid) return;
    onHeight(draft.base, parsed);
    setDraft(null);
  };
  return (
    <FloatingPanel
      open
      centered
      title="Gebäudestruktur – Einstellungen"
      onClose={onClose}
      width={760}
      height={620}
    >
      <SettingsSections
        sections={[
          {
            id: "general",
            label: "Allgemein",
            content: (
              <>
                <p>Fester Bezug: OK Rohfußboden Erdgeschoss = 0,00 m.</p>
                <p>
                  Geschosshöhe: Abstand von OK Rohfußboden bis zur nächsten OK Rohfußboden darüber.
                  Feste Wandhöhen bleiben unverändert.
                </p>
                <label className="block space-y-2">
                  {project.storey.name} – Geschosshöhe (m)
                  <input
                    aria-label="Geschosshöhe (m)"
                    className="block w-40 rounded border bg-background px-2 py-1 text-xs"
                    inputMode="decimal"
                    value={value}
                    placeholder="Nicht festgelegt"
                    onChange={(e) =>
                      setDraft({ base: draft?.base ?? project, value: e.target.value })
                    }
                    onBlur={commit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commit();
                      }
                      if (e.key === "Escape") setDraft(null);
                    }}
                  />
                </label>
                {invalid && <p role="alert">Bitte eine endliche Höhe größer als null eingeben.</p>}
                {stale && (
                  <p role="alert">
                    Das Projekt wurde geändert. Escape drücken und die Höhe erneut eingeben.
                  </p>
                )}
                <p className="text-muted-foreground">
                  Gültige Eingaben werden mit Enter oder beim Verlassen des Feldes übernommen.
                  Rückgängig über das Projekt-Undo.
                </p>
              </>
            ),
          },
        ]}
      />
    </FloatingPanel>
  );
}
