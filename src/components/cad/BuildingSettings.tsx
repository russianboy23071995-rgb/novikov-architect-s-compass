import { BuildingHeightSection } from "./BuildingHeightSection";
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
    draft?.value ??
    (project.storey.height === null
      ? ""
      : project.storey.height.toLocaleString("de-DE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 12,
          useGrouping: false,
        }));
  const parsed = Number(value.replace(",", "."));
  const invalid = value.trim() !== "" && (!Number.isFinite(parsed) || parsed <= 0);
  const stale = draft !== null && draft.base !== project;
  const commit = () => {
    if (!draft || stale || !value.trim() || invalid) return;
    onHeight(draft.base, parsed);
    setDraft(null);
  };
  const input = (label: string) => (
    <span className="flex items-center gap-1 rounded border bg-background px-2 py-1">
      <input
        aria-label={label}
        className="min-w-0 w-full bg-transparent font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-primary"
        inputMode="decimal"
        value={value}
        placeholder="Nicht festgelegt"
        aria-invalid={invalid || stale}
        onChange={(e) => setDraft({ base: draft?.base ?? project, value: e.target.value })}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") setDraft(null);
        }}
      />
      <span className="text-xs text-muted-foreground">m</span>
    </span>
  );
  return (
    <FloatingPanel
      open
      centered
      title="Gebäudestruktur – Einstellungen"
      onClose={onClose}
      width={840}
      height={680}
    >
      <SettingsSections
        sections={[
          {
            id: "general",
            label: "Allgemeine Gebäudestruktur",
            content: (
              <>
                <p>{project.storey.name} · Fester EG-Bezug an der Oberkante Rohdecke.</p>
                <BuildingHeightSection
                  elevationInput={input("Obere Höhenkote (m)")}
                  heightInput={input("Geschosshöhe (m)")}
                />
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
