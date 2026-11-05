import { useState } from "react";
import { storeyOf } from "@/domain/storeys/access";
import { ELEMENT_KINDS } from "@/domain/elements/registry";
import { slabArea, storeySlabLevels, type Slab } from "@/domain/elements/slab/model";
import { updateSlab } from "@/application/slabs/actions";
import type { Project } from "@/domain/project/schema";
import { Input } from "@/components/ui/input";
import { PropertyForm } from "./PropertyForm";
import type { Selection } from "./bim-view";

const metres = (value: number) =>
  value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 3 });

/** Slab fields in the shared properties bar; every change runs the shared slab action. */
export function SlabProperties({
  project,
  slab,
  selection,
  onChange,
}: {
  project: Project;
  slab: Slab;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const [error, setError] = useState("");
  const levels = storeySlabLevels(project, storeyOf(project).id, slab);
  return (
    <section className="flex flex-wrap items-end gap-x-4 gap-y-2" aria-label="Element properties">
      <h2 className="text-sm font-semibold">{ELEMENT_KINDS.slab.label}</h2>
      <p className="max-w-48 truncate font-mono text-[10px] text-muted-foreground">{slab.id}</p>
      <p className="text-xs text-muted-foreground" aria-label="Deckenhöhen">
        {levels
          ? `OK ${metres(levels.top)} m · UK ${metres(levels.bottom)} m`
          : "Höhe unbekannt: Geschosshöhe festlegen"}
        {` · Fläche ${metres(slabArea(slab))} m²`}
      </p>
      <PropertyForm
        key={`${slab.id}:${slab.thickness}:${slab.topOffset}`}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const number = (name: string) => {
            const raw = data.get(name);
            return typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
          };
          try {
            onChange(
              updateSlab(project, slab.id, {
                thickness: number("thickness"),
                topOffset: number("topOffset"),
              }),
              selection,
            );
            setError("");
          } catch {
            setError("Nicht übernommen: Stärke größer als null, Versatz als Zahl angeben.");
          }
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="block text-xs">
          Stärke (m)
          <Input
            name="thickness"
            type="number"
            step="any"
            required
            defaultValue={slab.thickness}
            className="mt-1 h-8 w-28"
          />
        </label>
        <label className="block text-xs">
          Versatz OK zum Geschoss darüber (m)
          <Input
            name="topOffset"
            type="number"
            step="any"
            required
            defaultValue={slab.topOffset}
            className="mt-1 h-8 w-28"
          />
        </label>
      </PropertyForm>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
