import { useState } from "react";
import { storeyOf } from "@/domain/storeys/access";
import { ELEMENT_KINDS } from "@/domain/elements/registry";
import {
  doorDinHand,
  doorHingeForDinHand,
  type DinHand,
  type Door,
} from "@/domain/elements/door/model";
import { updateDoor } from "@/application/doors/actions";
import { openingOverlapHintFor } from "@/application/openings/overlap-hint";
import type { Project } from "@/domain/project/schema";
import { Input } from "@/components/ui/input";
import { PropertyForm } from "./PropertyForm";
import { OverlapHint } from "./OverlapHint";
import type { Selection } from "./bim-view";

const numbers = [
  ["width", "Breite (m)"],
  ["height", "Höhe (m)"],
  ["zOffset", "Z-Versatz zum Geschoss (m)"],
  ["position", "Position (0–1)"],
] as const;

/** Door fields in the shared properties bar; every change runs the shared door action. */
export function DoorProperties({
  project,
  door,
  selection,
  onChange,
}: {
  project: Project;
  door: Door;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const [error, setError] = useState("");
  const apply = (changes: Partial<Omit<Door, "id">>) => {
    try {
      onChange(updateDoor(project, door.id, changes), selection);
      setError("");
    } catch (failure) {
      setError(
        failure instanceof Error && failure.name !== "ZodError"
          ? failure.message
          : "Nicht übernommen: positive Maße verwenden; die Tür muss vollständig in ihre Wand passen.",
      );
    }
  };
  const wall = storeyOf(project).walls.find((w) => w.id === door.wallId);
  return (
    <section className="flex flex-wrap items-end gap-x-4 gap-y-2" aria-label="Element properties">
      <h2 className="text-sm font-semibold">{ELEMENT_KINDS.door.label}</h2>
      <p className="max-w-48 truncate font-mono text-[10px] text-muted-foreground">{door.id}</p>
      <p className="max-w-48 truncate text-xs text-muted-foreground">Wand: {wall?.id}</p>
      <OverlapHint text={openingOverlapHintFor(project, door.id)} />
      <PropertyForm
        key={`${door.id}:${door.width}:${door.height}:${door.zOffset}:${door.position}`}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const number = (name: string) => {
            const raw = data.get(name);
            return typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
          };
          apply({
            width: number("width"),
            height: number("height"),
            zOffset: number("zOffset"),
            position: number("position"),
          });
        }}
        className="flex flex-wrap items-end gap-2"
      >
        {numbers.map(([name, label]) => (
          <label key={name} className="block text-xs">
            {label}
            <Input
              name={name}
              type="number"
              step="any"
              required
              defaultValue={door[name]}
              className="mt-1 h-8 w-28"
            />
          </label>
        ))}
      </PropertyForm>
      <label className="text-xs">
        Anschlag
        <select
          aria-label="Türanschlag"
          className="block h-8 rounded border bg-background"
          value={door.hinge}
          onChange={(event) => apply({ hinge: event.target.value as Door["hinge"] })}
        >
          <option value="start">Seite Wandanfang</option>
          <option value="end">Seite Wandende</option>
        </select>
      </label>
      <label className="text-xs">
        Aufschlag
        <select
          aria-label="Türaufschlag"
          className="block h-8 rounded border bg-background"
          value={door.opensTo}
          onChange={(event) => apply({ opensTo: event.target.value as Door["opensTo"] })}
        >
          <option value="left">links der Wandrichtung</option>
          <option value="right">rechts der Wandrichtung</option>
        </select>
      </label>
      <label className="text-xs">
        DIN
        <select
          aria-label="Tür DIN links/rechts"
          className="block h-8 rounded border bg-background"
          value={doorDinHand(door)}
          onChange={(event) =>
            apply({ hinge: doorHingeForDinHand(door, event.target.value as DinHand) })
          }
        >
          <option value="links">DIN links</option>
          <option value="rechts">DIN rechts</option>
        </select>
      </label>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
