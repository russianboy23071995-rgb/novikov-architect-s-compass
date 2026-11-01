import { useState } from "react";
import { ELEMENT_KINDS } from "@/domain/elements/registry";
import { roomArea, type Room } from "@/domain/elements/room/model";
import {
  updateRoom,
  workingRoomClearHeights,
  workingRoomHeightLines,
} from "@/application/rooms/actions";
import { heightLineText } from "@/application/rooms/height-lines";
import { isDefaultHeightLineList, roomHeightLines } from "@/domain/elements/room/height-line";
import { HeightLineEditor } from "./HeightLineEditor";
import { FloatingPanel } from "./FloatingPanel";
import { SETTINGS_WINDOW } from "./settings-window-size";
import type { Project } from "@/domain/project/schema";
import { Input } from "@/components/ui/input";
import { PropertyForm } from "./PropertyForm";
import { refusal } from "./refusal";
import type { Selection } from "./bim-view";

const squareMetres = (value: number) =>
  value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Heights from the slabs and roofs of the room's storey (R3/R3b): clear height range, for
 * every height line the area reaching it and its share of the plan area, and the part without
 * any height source, which stays visibly open (N34). */
function RoomHeightSummary({ project, room }: { project: Project; room: Room }) {
  const clear = workingRoomClearHeights(project, room);
  const lines = workingRoomHeightLines(project, room);
  return (
    <div className="text-xs text-muted-foreground" aria-label="Lichte Höhen">
      <p>
        {clear.min === null
          ? "Lichte Höhe offen: keine Decke und kein Dach über dem Raum"
          : `Lichte Höhe ${squareMetres(clear.min)}–${squareMetres(clear.max!)} m über ${room.floorBuildUp === undefined ? "Rohfußboden" : "Fußbodenaufbau"}`}
      </p>
      {clear.min !== null && lines.length > 0 && (
        <p>
          {lines
            .map(
              (r) =>
                `ab ${heightLineText(r.line)}: ${squareMetres(r.areaAbove)} m² (${(r.share * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %)`,
            )
            .join(" · ")}
        </p>
      )}
      {clear.openArea > 1e-6 && (
        <p className="text-amber-700 dark:text-amber-400">
          Ohne Decke/Dach (Höhe offen): {squareMetres(clear.openArea)} m²
        </p>
      )}
    </div>
  );
}

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
  const [linesOpen, setLinesOpen] = useState(false);
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
      <button
        type="button"
        onClick={() => setLinesOpen(true)}
        className="h-8 self-end rounded border px-2 text-xs hover:bg-muted"
      >
        Höhenlinien bearbeiten…
      </button>
      <FloatingPanel
        open={linesOpen}
        title={`Höhenlinien ${room.number}`}
        onClose={() => setLinesOpen(false)}
        width={SETTINGS_WINDOW.width}
        height={SETTINGS_WINDOW.height}
      >
        <div className="overflow-auto p-4">
          <HeightLineEditor
            lines={roomHeightLines(room)}
            onChange={(lines) =>
              apply({ heightLines: isDefaultHeightLineList(lines) ? undefined : lines })
            }
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
      </FloatingPanel>
      <RoomHeightSummary project={project} room={room} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
