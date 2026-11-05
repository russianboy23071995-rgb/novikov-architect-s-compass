import { useMemo } from "react";
import type { Project } from "@/domain/project/schema";
import { roomSchedule, roomScheduleCsv } from "@/application/rooms/schedule";
import { browserTextDownload } from "@/interop/project-file/browser-download";
import { FloatingPanel } from "./FloatingPanel";

const m2 = (value: number) =>
  value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = (share: number) =>
  (share * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " %";

/**
 * Room list of the whole project (docs/ROOM_ELEMENT.md, R4): grouped by storey with sums, one
 * column per height line that occurs. A row click selects the room (switching to its storey);
 * the list itself never changes the model.
 */
export function RoomListPanel({
  open,
  onOpenChange,
  project,
  onSelectRoom,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSelectRoom: (roomId: string) => void;
}) {
  const schedule = useMemo(() => (open ? roomSchedule(project) : null), [open, project]);
  return (
    <FloatingPanel
      open={open}
      title="Raumliste"
      onClose={() => onOpenChange(false)}
      width={900}
      height={460}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground">
            Grundflächen ohne WoFlV-Regeln; Höhen aus Decken und Dächern des eigenen Geschosses.
          </p>
          <button
            type="button"
            disabled={!schedule?.storeys.length}
            onClick={() =>
              schedule &&
              browserTextDownload(
                roomScheduleCsv(schedule),
                "novikov-raumliste.csv",
                "text/csv;charset=utf-8",
              )
            }
            className="shrink-0 rounded border px-2 py-1 hover:bg-muted disabled:opacity-50"
          >
            Als CSV speichern
          </button>
        </div>
        {schedule && schedule.storeys.length === 0 && (
          <p className="text-muted-foreground">Im Projekt gibt es noch keine Räume.</p>
        )}
        {schedule && schedule.storeys.length > 0 && (
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse" aria-label="Raumliste">
              <thead className="sticky top-0 bg-background text-left text-muted-foreground">
                <tr>
                  <th className="px-1 font-normal">Nr.</th>
                  <th className="px-1 font-normal">Name</th>
                  <th className="px-1 text-right font-normal">Grundfläche</th>
                  <th className="px-1 text-right font-normal">Aufbau</th>
                  <th className="px-1 text-right font-normal">lichte Höhe</th>
                  {schedule.columns.map((c) => (
                    <th key={c.key} className="px-1 text-right font-normal">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-1 text-right font-normal">Höhe offen</th>
                </tr>
              </thead>
              {schedule.storeys.map((storey) => (
                <tbody key={storey.storeyId}>
                  <tr>
                    <th
                      colSpan={6 + schedule.columns.length}
                      className="border-b px-1 pt-2 text-left font-semibold"
                    >
                      {storey.name}
                    </th>
                  </tr>
                  {storey.rooms.map((room) => (
                    <tr
                      key={room.roomId}
                      aria-label={`Raum ${room.number}`}
                      tabIndex={0}
                      onClick={() => onSelectRoom(room.roomId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onSelectRoom(room.roomId);
                      }}
                      className="cursor-pointer hover:bg-muted focus:bg-muted focus:outline-none"
                    >
                      <td className="px-1">{room.number}</td>
                      <td className="px-1">{room.name}</td>
                      <td className="px-1 text-right">{m2(room.area)} m²</td>
                      <td className="px-1 text-right">
                        {room.floorBuildUp === undefined ? "–" : `${m2(room.floorBuildUp)} m`}
                      </td>
                      <td className="px-1 text-right">
                        {room.clearMin === null
                          ? "offen"
                          : `${m2(room.clearMin)}–${m2(room.clearMax!)} m`}
                      </td>
                      {schedule.columns.map((c) => {
                        const line = room.lines[c.key];
                        return (
                          <td key={c.key} className="px-1 text-right">
                            {line ? `${m2(line.area)} m² (${percent(line.share)})` : ""}
                          </td>
                        );
                      })}
                      <td className="px-1 text-right">
                        {room.openArea > 1e-6 ? `${m2(room.openArea)} m²` : "–"}
                      </td>
                    </tr>
                  ))}
                  <tr className="text-muted-foreground">
                    <td className="px-1" colSpan={2}>
                      Summe {storey.name}
                    </td>
                    <td className="px-1 text-right">{m2(storey.area)} m²</td>
                    <td />
                    <td />
                    {schedule.columns.map((c) => (
                      <td key={c.key} className="px-1 text-right">
                        {storey.lines[c.key] === undefined ? "" : `${m2(storey.lines[c.key]!)} m²`}
                      </td>
                    ))}
                    <td className="px-1 text-right">{m2(storey.openArea)} m²</td>
                  </tr>
                </tbody>
              ))}
              <tfoot>
                <tr className="border-t font-semibold">
                  <td className="px-1" colSpan={2}>
                    Summe Projekt
                  </td>
                  <td className="px-1 text-right">{m2(schedule.area)} m²</td>
                  <td />
                  <td />
                  {schedule.columns.map((c) => (
                    <td key={c.key} className="px-1 text-right">
                      {schedule.lines[c.key] === undefined
                        ? ""
                        : `${m2(schedule.lines[c.key]!)} m²`}
                    </td>
                  ))}
                  <td className="px-1 text-right">{m2(schedule.openArea)} m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </FloatingPanel>
  );
}
