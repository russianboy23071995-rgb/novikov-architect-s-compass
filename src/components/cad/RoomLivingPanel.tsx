import { useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { Room, RoomLivingArea } from "@/domain/elements/room/model";
import { WOFLV_RULES } from "@/application/area-rules/woflv";
import { workingRoomLiving } from "@/application/rooms/actions";
import { FloatingPanel } from "./FloatingPanel";
import { SETTINGS_WINDOW } from "./settings-window-size";

const m2 = (value: number) =>
  value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const share = (value: number) => `${(value * 100).toLocaleString("de-DE")} %`;

/** Calculation of one room and its entered corrections (docs/WOHNFLAECHE.md, W3). */
export function RoomLivingPanel({
  project,
  room,
  onChange,
  onClose,
}: {
  project: Project;
  room: Room;
  onChange: (changes: Partial<RoomLivingArea>) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [area, setArea] = useState("");
  const [error, setError] = useState("");
  const corrections = room.livingArea?.corrections ?? [];
  const result = workingRoomLiving(project, room);
  const add = () => {
    const value = Number(area.replace(",", "."));
    if (!note.trim()) return setError("Eine Korrektur braucht eine Begründung.");
    if (area.trim() === "" || !Number.isFinite(value) || value === 0)
      return setError("Fläche in m² eingeben, Abzüge mit Minus.");
    onChange({ corrections: [...corrections, { note: note.trim(), area: value }] });
    setNote("");
    setArea("");
    setError("");
  };
  return (
    <FloatingPanel
      open
      title={`Wohnfläche ${room.number}`}
      onClose={onClose}
      width={SETTINGS_WINDOW.width}
      height={SETTINGS_WINDOW.height}
    >
      <div className="space-y-3 overflow-auto p-4 text-xs">
        <table className="w-full" aria-label="Rechenweg">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="font-normal">Teilfläche</th>
              <th className="font-normal">Regel</th>
              <th className="text-right font-normal">m²</th>
              <th className="text-right font-normal">Anteil</th>
              <th className="text-right font-normal">Wohnfläche m²</th>
            </tr>
          </thead>
          <tbody>
            {result.steps.map((step, i) => (
              <tr key={i}>
                <td>{step.label}</td>
                <td>{step.rule}</td>
                <td className="text-right">{m2(step.area)}</td>
                <td className="text-right">{share(step.share)}</td>
                <td className="text-right">{m2(step.area * step.share)}</td>
              </tr>
            ))}
            <tr className="border-t font-semibold">
              <td colSpan={4}>Wohnfläche</td>
              <td className="text-right">{m2(result.livingArea)}</td>
            </tr>
          </tbody>
        </table>
        {result.notes.map((text) => (
          <p key={text} className="text-amber-700">
            {text}
          </p>
        ))}
        <section aria-label="Korrekturen" className="space-y-2">
          <h3 className="font-semibold">Korrekturen</h3>
          <p className="text-muted-foreground">
            Für das, was das Modell nicht kennt: Schornstein, Vormauerung oder Bekleidung über 1,50
            m Höhe und 0,1 m² als Abzug mit Minus, eine bis zum Boden reichende Nische über 0,13 m
            Tiefe als Zuschlag.
          </p>
          {corrections.map((correction, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1">{correction.note}</span>
              <span>{m2(correction.area)} m²</span>
              <button
                type="button"
                aria-label={`Korrektur ${correction.note} entfernen`}
                className="rounded border px-1.5 hover:bg-muted"
                onClick={() => onChange({ corrections: corrections.filter((_, j) => j !== i) })}
              >
                Entfernen
              </button>
            </div>
          ))}
          <div className="flex items-end gap-2">
            <label className="block flex-1">
              Begründung
              <input
                aria-label="Begründung der Korrektur"
                value={note}
                maxLength={120}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 block w-full rounded border bg-background p-1"
              />
            </label>
            <label className="block">
              Fläche (m²)
              <input
                aria-label="Fläche der Korrektur"
                inputMode="decimal"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="mt-1 block w-24 rounded border bg-background p-1"
              />
            </label>
            <button type="button" className="rounded border px-2 py-1 hover:bg-muted" onClick={add}>
              Hinzufügen
            </button>
          </div>
          {error && <p className="text-destructive">{error}</p>}
        </section>
        <p className="text-muted-foreground">
          Berechnet nach {WOFLV_RULES.name}, Regelstand {WOFLV_RULES.version}. Keine geprüfte
          Fachaussage.
        </p>
      </div>
    </FloatingPanel>
  );
}
