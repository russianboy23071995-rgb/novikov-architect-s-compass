import { BuildingHeightSection } from "./BuildingHeightSection";
import { useState } from "react";
import type { Project } from "@/domain/project/schema";
import { resolveStoreyLevels } from "@/domain/storeys/heights";
import { FloatingPanel } from "./FloatingPanel";
import { SettingsSections } from "./SettingsSections";

type Field = "ground" | "upper" | "height";
const format = (value: number | null) =>
  value === null
    ? ""
    : value.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 20,
        useGrouping: false,
      });
export function BuildingSettings({
  project,
  onClose,
  onHeight,
  onDatum,
}: {
  project: Project;
  onClose: () => void;
  onHeight: (base: Project, height: number) => void;
  onDatum: (base: Project, elevation: number) => void;
}) {
  const [draft, setDraft] = useState<{ base: Project; value: string; field: Field } | null>(null);
  const upper = resolveStoreyLevels([project.storey], project.storey.id, project.groundDatum)[0]!
    .upperElevation;
  const parsed = draft ? Number(draft.value.replace(",", ".")) : NaN;
  const height = draft?.field === "upper" ? parsed - project.groundDatum : parsed;
  const invalid =
    !!draft &&
    (!draft.value.trim() ||
      !Number.isFinite(parsed) ||
      (draft.field !== "ground" && (!Number.isFinite(height) || height <= 0)));
  const stale = draft !== null && draft.base !== project;
  const commit = () => {
    if (!draft || stale || invalid) return;
    if (draft.field === "ground") onDatum(draft.base, parsed);
    else onHeight(draft.base, height);
    setDraft(null);
  };
  const input = (field: Field, label: string, value: number | null) => (
    <span className="flex items-center gap-1 rounded border bg-background px-2 py-1">
      <input
        aria-label={label}
        className="min-w-0 w-full bg-transparent font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-primary"
        inputMode="decimal"
        value={draft?.field === field ? draft.value : format(value)}
        placeholder="Nicht festgelegt"
        aria-invalid={draft?.field === field && (invalid || stale)}
        onChange={(e) =>
          setDraft({
            base: draft?.field === field ? draft.base : project,
            field,
            value: e.target.value,
          })
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
                <p>{project.storey.name} · Höhenbezug an der Oberkante Rohdecke des EG.</p>
                <BuildingHeightSection
                  groundInput={input("ground", "EG Bezugshöhe (m)", project.groundDatum)}
                  elevationInput={input("upper", "Obere Höhenkote (m)", upper)}
                  heightInput={input("height", "Geschosshöhe (m)", project.storey.height)}
                />
                {invalid && (
                  <p role="alert">
                    Endliche Höhenkote erforderlich. Die obere Kote muss über der EG-Kote liegen.
                  </p>
                )}
                {stale && (
                  <p role="alert">
                    Das Projekt wurde geändert. Escape drücken und erneut eingeben.
                  </p>
                )}
                <p className="text-muted-foreground">
                  Die EG-Kote legt den Höhenbezug fest. Ihre Änderung erhält die Geschosshöhe und
                  verschiebt die obere Kote.
                </p>
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
