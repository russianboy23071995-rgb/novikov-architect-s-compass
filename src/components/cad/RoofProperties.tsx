import { useState } from "react";
import { storeyOf } from "@/domain/storeys/access";
import { ELEMENT_KINDS } from "@/domain/elements/registry";
import { roofStoreyElevation, type Roof } from "@/domain/elements/roof/model";
import type { RoofCut } from "@/domain/elements/roof/geometry";
import { updateRoof } from "@/application/roofs/actions";
import type { Project } from "@/domain/project/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyForm } from "./PropertyForm";
import { ROOF_CUT_LABELS } from "./roof-labels";
import type { Selection } from "./bim-view";

const metres = (value: number) =>
  value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 3 });

/** The readable German message of a refused change, also from a schema (Zod) issue list. */
function refusal(error: unknown): string {
  const fallback = "Nicht übernommen: Werte prüfen.";
  if (!(error instanceof Error)) return fallback;
  if (!error.message.startsWith("[")) return error.message;
  try {
    return (JSON.parse(error.message) as { message?: string }[])[0]?.message ?? fallback;
  } catch {
    return fallback;
  }
}

/** Roof fields in the shared properties bar; every change runs updateRoof once (one undo). */
export function RoofProperties({
  project,
  roof,
  selection,
  onChange,
}: {
  project: Project;
  roof: Roof;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const [error, setError] = useState("");
  const apply = (changes: Partial<Omit<Roof, "id">>) => {
    try {
      onChange(updateRoof(project, roof.id, changes), selection);
      setError("");
    } catch (e) {
      setError(refusal(e));
    }
  };
  const elevation = roofStoreyElevation(project, storeyOf(project).id);
  const cutSelect = (name: "eaveCut" | "topCut", label: string) => (
    <label className="block text-xs">
      {label}
      <select
        aria-label={label}
        value={roof[name]}
        onChange={(e) => apply({ [name]: e.target.value as RoofCut })}
        className="mt-1 block h-8 rounded border bg-background px-1"
      >
        {(Object.keys(ROOF_CUT_LABELS) as RoofCut[]).map((cut) => (
          <option key={cut} value={cut}>
            {ROOF_CUT_LABELS[cut]}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <section className="flex flex-wrap items-end gap-x-4 gap-y-2" aria-label="Element properties">
      <h2 className="text-sm font-semibold">{ELEMENT_KINDS.roof.label}</h2>
      <p className="max-w-48 truncate font-mono text-[10px] text-muted-foreground">{roof.id}</p>
      <p className="text-xs text-muted-foreground" aria-label="Dachbezug">
        {elevation === null
          ? "Geschosskote unbekannt"
          : `Unterseite an der Bezugslinie ${metres(elevation + roof.referenceHeight)} m`}
      </p>
      <PropertyForm
        key={`${roof.id}:${roof.pitch}:${roof.thickness}:${roof.referenceHeight}`}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const number = (name: string) => {
            const raw = data.get(name);
            return typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
          };
          apply({
            pitch: number("pitch"),
            thickness: number("thickness"),
            referenceHeight: number("referenceHeight"),
          });
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="block text-xs">
          Neigung (°)
          <Input
            name="pitch"
            type="number"
            step="any"
            required
            defaultValue={roof.pitch}
            className="mt-1 h-8 w-20"
          />
        </label>
        <label className="block text-xs">
          Stärke (m)
          <Input
            name="thickness"
            type="number"
            step="any"
            required
            defaultValue={roof.thickness}
            className="mt-1 h-8 w-20"
          />
        </label>
        <label className="block text-xs">
          Bezugshöhe Unterseite (m)
          <Input
            name="referenceHeight"
            type="number"
            step="any"
            required
            defaultValue={roof.referenceHeight}
            className="mt-1 h-8 w-24"
          />
        </label>
      </PropertyForm>
      {cutSelect("eaveCut", "Abschluss Traufe")}
      {cutSelect("topCut", "Abschluss obere Kante")}
      <label className="block text-xs">
        Ebene
        <select
          aria-label="Ebene des Dachs"
          value={roof.layerId}
          onChange={(e) => apply({ layerId: e.target.value })}
          className="mt-1 block h-8 rounded border bg-background px-1"
        >
          {project.layers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </label>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => apply({ rise: roof.rise === "left" ? "right" : "left" })}
      >
        Steigseite umkehren
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
