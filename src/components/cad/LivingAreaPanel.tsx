import { useMemo } from "react";
import type { Project } from "@/domain/project/schema";
import { livingSchedule, livingScheduleCsv } from "@/application/area-rules/schedule";
import { browserTextDownload } from "@/interop/project-file/browser-download";
import { FloatingPanel } from "./FloatingPanel";

const m2 = (value: number) =>
  value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = (share: number) => `${(share * 100).toLocaleString("de-DE")} %`;

/**
 * Living area list of the whole project (docs/WOHNFLAECHE.md, W4): rooms by storey with their
 * calculation and sums. A click on a room selects it; the list never changes the model.
 */
export function LivingAreaPanel({
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
  const schedule = useMemo(() => (open ? livingSchedule(project) : null), [open, project]);
  return (
    <FloatingPanel
      open={open}
      title="Wohnflächenliste"
      onClose={() => onOpenChange(false)}
      width={760}
      height={520}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground">
            {schedule?.rules.name}, Regelstand {schedule?.rules.version}. Keine geprüfte
            Fachaussage.
          </p>
          <button
            type="button"
            disabled={!schedule?.storeys.length}
            onClick={() =>
              schedule &&
              browserTextDownload(
                livingScheduleCsv(schedule),
                "novikov-wohnflaeche.csv",
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
            <table className="w-full border-collapse" aria-label="Wohnflächenliste">
              <thead className="sticky top-0 bg-background text-left text-muted-foreground">
                <tr>
                  <th className="px-1 font-normal">Nr.</th>
                  <th className="px-1 font-normal">Name</th>
                  <th className="px-1 font-normal">Raumart</th>
                  <th className="px-1 text-right font-normal">Grundfläche</th>
                  <th className="px-1 text-right font-normal">Wohnfläche</th>
                </tr>
              </thead>
              {schedule.storeys.map((storey) => (
                <tbody key={storey.storeyId}>
                  <tr>
                    <th colSpan={5} className="border-b px-1 pt-2 text-left font-semibold">
                      {storey.name}
                    </th>
                  </tr>
                  {storey.rooms.flatMap((room) => [
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
                      <td className="px-1">{room.useLabel}</td>
                      <td className="px-1 text-right">{m2(room.result.grossArea)} m²</td>
                      <td className="px-1 text-right font-semibold">
                        {m2(room.result.livingArea)} m²
                      </td>
                    </tr>,
                    <tr key={`${room.roomId}:steps`} className="text-muted-foreground">
                      <td />
                      <td colSpan={4} className="px-1 pb-1">
                        {room.result.steps.map((step, i) => (
                          <div key={i} className="flex justify-between gap-2">
                            <span>
                              {step.label} ({step.rule})
                            </span>
                            <span>
                              {m2(step.area)} m² × {percent(step.share)} ={" "}
                              {m2(step.area * step.share)} m²
                            </span>
                          </div>
                        ))}
                        {room.result.notes.map((note) => (
                          <p key={note} className="text-amber-700">
                            {note}
                          </p>
                        ))}
                      </td>
                    </tr>,
                  ])}
                  <tr className="font-semibold">
                    <td className="px-1" colSpan={3}>
                      Summe {storey.name}
                    </td>
                    <td className="px-1 text-right">{m2(storey.grossArea)} m²</td>
                    <td className="px-1 text-right">{m2(storey.livingArea)} m²</td>
                  </tr>
                </tbody>
              ))}
              <tfoot>
                <tr className="border-t font-semibold">
                  <td className="px-1 pt-1" colSpan={3}>
                    Wohnfläche Projekt
                  </td>
                  <td className="px-1 pt-1 text-right">{m2(schedule.grossArea)} m²</td>
                  <td className="px-1 pt-1 text-right">{m2(schedule.livingArea)} m²</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </FloatingPanel>
  );
}
