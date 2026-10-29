import { useState } from "react";
import { ELEMENT_KINDS } from "@/domain/elements/registry";
import { roomArea, type Room } from "@/domain/elements/room/model";
import { updateRoom } from "@/application/rooms/actions";
import type { Project } from "@/domain/project/schema";
import { Input } from "@/components/ui/input";
import { PropertyForm } from "./PropertyForm";
import { refusal } from "./RoofProperties";
import type { Selection } from "./bim-view";

/** Floor build-up a room gets when the user switches it on in the properties. */
const DEFAULT_FLOOR_BUILD_UP = 0.12;

/** Room fields in the shared properties bar; every change runs updateRoom once (one undo). */
export function RoomProperties({
  project,
  room,
  selection,
  onChange,
}: {
  project: Project;
  room: Room;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const [error, setError] = useState("");
  const apply = (changes: Partial<Omit<Room, "id" | "points">>) => {
    try {
      onChange(updateRoom(project, room.id, changes), selection);
      setError("");
    } catch (e) {
      setError(refusal(e));
    }
  };
  const withBuildUp = room.floorBuildUp !== undefined;
  return (
    <section className="flex flex-wrap items-end gap-x-4 gap-y-2" aria-label="Element properties">
      <h2 className="text-sm font-semibold">{ELEMENT_KINDS.room.label}</h2>
      <p className="max-w-48 truncate font-mono text-[10px] text-muted-foreground">{room.id}</p>
      <p className="text-xs text-muted-foreground" aria-label="Raumfläche">
        Grundfläche{" "}
        {roomArea(room).toLocaleString("de-DE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        m²
      </p>
      <PropertyForm
        key={`${room.id}:${room.name}:${room.number}:${room.floorBuildUp}`}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const text = (name: string) => String(data.get(name) ?? "");
          const raw = data.get("floorBuildUp");
          apply({
            name: text("name"),
            number: text("number").trim(),
            ...(withBuildUp && typeof raw === "string" && raw.trim() !== ""
              ? { floorBuildUp: Number(raw) }
              : {}),
          });
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="block text-xs">
          Name
          <Input name="name" maxLength={120} defaultValue={room.name} className="mt-1 h-8 w-36" />
        </label>
        <label className="block text-xs">
          Nummer
          <Input
            name="number"
            required
            maxLength={40}
            defaultValue={room.number}
            className="mt-1 h-8 w-24"
          />
        </label>
        {withBuildUp && (
          <label className="block text-xs">
            Fußbodenaufbau (m)
            <Input
              name="floorBuildUp"
              type="number"
              step="any"
              min={0}
              max={2}
              required
              defaultValue={room.floorBuildUp}
              className="mt-1 h-8 w-20"
            />
          </label>
        )}
      </PropertyForm>
      <label className="flex items-center gap-1 pb-2 text-xs">
        <input
          type="checkbox"
          aria-label="Fußbodenaufbau verwenden"
          checked={withBuildUp}
          onChange={(e) =>
            apply({ floorBuildUp: e.target.checked ? DEFAULT_FLOOR_BUILD_UP : undefined })
          }
        />
        Fußbodenaufbau
      </label>
      <label className="block text-xs">
        Ebene
        <select
          aria-label="Ebene des Raums"
          value={room.layerId}
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
      {error && <p className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
