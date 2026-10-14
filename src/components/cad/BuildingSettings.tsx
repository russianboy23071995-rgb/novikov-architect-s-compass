import { useState } from "react";
import type { Project } from "@/domain/project/schema";
import { resolveStoreyLevels } from "@/domain/storeys/heights";
import { changeBuilding, type BuildingChange } from "@/application/storeys/actions";
import { BuildingHeightSection } from "./BuildingHeightSection";
import { FloatingPanel } from "./FloatingPanel";
import { SettingsSections } from "./SettingsSections";

type Field = "height" | "elevation" | "name" | "top";
const format = (v: number | null) =>
  v === null
    ? ""
    : v.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 12,
        useGrouping: false,
      });
export function BuildingSettings({
  project,
  onClose,
  onAction,
}: {
  project: Project;
  onClose: () => void;
  onAction: (base: Project, change: BuildingChange) => void;
}) {
  const [draft, setDraft] = useState<{
    base: Project;
    storeyId: string;
    field: Field;
    value: string;
  } | null>(null);
  const [adding, setAdding] = useState<{
    base: Project;
    storeyId: string;
    side: "above" | "below";
    height: string;
  } | null>(null);
  const [error, setError] = useState("");
  const levels = resolveStoreyLevels(project.storeys, project.groundStoreyId, project.groundDatum);
  const submit = (base: Project, change: BuildingChange) => {
    try {
      changeBuilding(base, project, change);
      onAction(base, change);
      setError("");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
  };
  const commit = () => {
    if (!draft) return;
    const number = Number(draft.value.replace(",", "."));
    if (!draft.value.trim() || (draft.field !== "name" && !Number.isFinite(number))) {
      setError("Bitte einen gültigen Wert eingeben.");
      return;
    }
    const request = { projectId: draft.base.id, storeyId: draft.storeyId };
    let change: BuildingChange;
    if (draft.field === "name")
      change = { kind: "name", request: { ...request, name: draft.value } };
    else if (draft.field === "elevation")
      change = { kind: "elevation", request: { ...request, elevation: number } };
    else {
      const lower = levels.find((l) => l.storeyId === draft.storeyId)!.elevation;
      if (draft.field === "top" && lower === null) {
        setError("Zunächst die darunterliegenden Geschosshöhen festlegen.");
        return;
      }
      change = {
        kind: "height",
        request: { ...request, height: draft.field === "top" ? number - lower! : number },
      };
    }
    if (submit(draft.base, change)) setDraft(null);
  };
  const input = (id: string, field: Field, label: string, value: number | string | null) => (
    <span className="flex items-center gap-1 rounded border bg-background px-2 py-1">
      <input
        aria-label={label}
        className="min-w-0 w-full bg-transparent font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-primary"
        inputMode={field === "name" ? "text" : "decimal"}
        maxLength={field === "name" ? 120 : undefined}
        value={
          draft?.storeyId === id && draft.field === field
            ? draft.value
            : typeof value === "string"
              ? value
              : format(value)
        }
        placeholder="Nicht festgelegt"
        onChange={(e) => {
          setError("");
          setDraft({
            base: draft?.storeyId === id && draft.field === field ? draft.base : project,
            storeyId: id,
            field,
            value: e.target.value,
          });
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setDraft(null);
            setError("");
          }
        }}
      />
      {field !== "name" && <span className="text-xs text-muted-foreground">m</span>}
    </span>
  );
  const insertion = (id: string, side: "above" | "below", name: string) => (
    <button
      type="button"
      className="w-full rounded border px-1 py-1 text-[10px] hover:bg-muted"
      aria-label={`Geschoss ${side === "above" ? "darüber" : "darunter"} hinzufügen: ${name}`}
      onClick={() => {
        setError("");
        setAdding({
          base: project,
          storeyId: id,
          side,
          height: format(project.storeys.find((s) => s.id === id)!.height),
        });
      }}
    >
      {side === "above" ? "↑ Geschoss darüber" : "↓ Geschoss darunter"}
    </button>
  );
  const top = project.storeys.at(-1)!;
  return (
    <FloatingPanel
      open
      centered
      title="Gebäudestruktur – Einstellungen"
      onClose={onClose}
      width={920}
      height={820}
    >
      <SettingsSections
        sections={[
          {
            id: "general",
            label: "Allgemeine Gebäudestruktur",
            content: (
              <>
                <p>
                  Höhenbezug: OK Rohdecke Erdgeschoss. Neue Geschosse erhalten eine eigene Höhe.
                </p>
                {adding && (
                  <form
                    className="space-y-2 rounded border bg-background p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!adding.height.trim()) {
                        setError("Die Höhe des neuen Geschosses fehlt.");
                        return;
                      }
                      if (
                        submit(adding.base, {
                          kind: "insert",
                          request: {
                            projectId: adding.base.id,
                            storeyId: adding.storeyId,
                            side: adding.side,
                            id: crypto.randomUUID(),
                            height: Number(adding.height.replace(",", ".")),
                          },
                        })
                      )
                        setAdding(null);
                    }}
                  >
                    <p>
                      Neues Geschoss {adding.side === "above" ? "oberhalb" : "unterhalb"} von{" "}
                      {adding.base.storeys.find((s) => s.id === adding.storeyId)?.name}
                    </p>
                    <label className="flex items-center gap-2">
                      Geschosshöhe
                      <input
                        autoFocus
                        aria-label="Höhe des neuen Geschosses (m)"
                        inputMode="decimal"
                        className="w-24 rounded border px-2 py-1"
                        value={adding.height}
                        onChange={(e) => setAdding({ ...adding, height: e.target.value })}
                      />{" "}
                      m
                    </label>
                    <button
                      type="submit"
                      className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground"
                    >
                      Hinzufügen
                    </button>{" "}
                    <button
                      type="button"
                      className="rounded border px-3 py-1 text-xs"
                      onClick={() => {
                        setAdding(null);
                        setError("");
                      }}
                    >
                      Abbrechen
                    </button>
                  </form>
                )}
                {error && (
                  <p role="alert" className="text-destructive">
                    {error}
                  </p>
                )}
                <BuildingHeightSection
                  topInput={input(
                    top.id,
                    "top",
                    "Obere Höhenkote (m)",
                    levels.at(-1)!.upperElevation,
                  )}
                  storeys={project.storeys.map((s, i) => ({
                    id: s.id,
                    name: s.name,
                    nameInput: input(s.id, "name", `Geschossname ${s.name}`, s.name),
                    heightInput: input(s.id, "height", `Geschosshöhe ${s.name} (m)`, s.height),
                    elevationInput: input(
                      s.id,
                      "elevation",
                      s.id === project.groundStoreyId
                        ? "EG Bezugshöhe (m)"
                        : `Höhenkote ${s.name} (m)`,
                      levels[i]!.elevation,
                    ),
                    aboveControl: insertion(s.id, "above", s.name),
                    belowControl: insertion(s.id, "below", s.name),
                  }))}
                />
                <p className="text-muted-foreground">
                  Höhenänderungen werden vom EG aus nach oben bzw. unten fortgeschrieben. Die
                  EG-Kote erhält die Geschosshöhen. Rückgängig über das Projekt-Undo.
                </p>
                <p className="text-muted-foreground">
                  Im Navigator wählst du das aktive Geschoss für Grundriss und 3D. Bauteile bleiben
                  ihrem Geschoss zugeordnet.
                </p>
              </>
            ),
          },
        ]}
      />
    </FloatingPanel>
  );
}
