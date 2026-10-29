import { useEffect, useState } from "react";
import type { HatchConstruction } from "@/application/hatches/construction";
import type { Layer } from "@/domain/layers/model";
import { FloatingPanel } from "./FloatingPanel";
import { SettingsSections } from "./SettingsSections";
import type { RoomDefaults } from "./useToolDefaults";
import { formatHeightLines, parseHeightLines } from "@/application/rooms/height-lines";

export type RoomConstruction = HatchConstruction | "walls";

function ConstructionSelect({
  value,
  onValue,
}: {
  value: RoomConstruction;
  onValue: (c: RoomConstruction) => void;
}) {
  return (
    <label className="text-xs">
      Erstellung
      <select
        aria-label="Raum-Erstellung"
        value={value}
        onChange={(e) => onValue(e.target.value as RoomConstruction)}
        className="block rounded border bg-background p-1"
      >
        <option value="walls">Klick in Raum zwischen Wänden</option>
        <option value="polygon">Polygon per Klick</option>
        <option value="diagonal">Rechteck: Diagonale</option>
        <option value="side-height">Gedrehtes Rechteck: Seite + dritter Punkt</option>
        <option value="boundary">Geschlossene Kontur übernehmen</option>
      </select>
    </label>
  );
}

/** Height lines as text ("1,00; 2,00"); commits on Enter or leaving the field (R3). */
export function HeightLinesField({
  value,
  onValue,
  label = "Höhenlinien (m)",
}: {
  value: readonly number[];
  onValue: (lines: number[]) => void;
  label?: string;
}) {
  const [raw, setRaw] = useState(formatHeightLines(value));
  const [error, setError] = useState("");
  const shown = formatHeightLines(value);
  // Another editor (bar, window, undo) changed the value: follow it.
  useEffect(() => {
    setRaw(shown);
    setError("");
  }, [shown]);
  const commit = () => {
    const parsed = parseHeightLines(raw);
    if (typeof parsed === "string") return setError(parsed);
    setError("");
    if (formatHeightLines(parsed) !== shown) onValue(parsed);
    else setRaw(shown);
  };
  return (
    <label className="text-xs">
      {label}
      <input
        aria-label="Höhenlinien"
        value={raw}
        placeholder="keine"
        onChange={(e) => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        className="block w-28 rounded border bg-background p-1"
      />
      {error && <span className="block max-w-48 text-destructive">{error}</span>}
    </label>
  );
}

/** Name, optional floor build-up and layer; the bar and the window edit the same draft. */
function RoomDefaultFields({
  value,
  onChange,
  layers,
}: {
  value: RoomDefaults;
  onChange: (value: RoomDefaults) => void;
  layers: readonly Layer[];
}) {
  const [raw, setRaw] = useState(String(value.floorBuildUp));
  // Another editor of the same draft changed the value: follow it.
  useEffect(() => {
    if (Number(raw.replace(",", ".")) !== value.floorBuildUp) setRaw(String(value.floorBuildUp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.floorBuildUp]);
  return (
    <>
      <label className="text-xs">
        Name
        <input
          aria-label="Raumname"
          value={value.name}
          maxLength={120}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="block w-32 rounded border bg-background p-1"
        />
      </label>
      <label className="flex items-center gap-1 self-end pb-1 text-xs">
        <input
          type="checkbox"
          aria-label="Fußbodenaufbau verwenden"
          checked={value.floorBuildUpEnabled}
          onChange={(e) => onChange({ ...value, floorBuildUpEnabled: e.target.checked })}
        />
        Fußbodenaufbau
      </label>
      <label className="text-xs">
        Aufbau (m)
        <input
          aria-label="Fußbodenaufbau"
          inputMode="decimal"
          disabled={!value.floorBuildUpEnabled}
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            const n = Number(e.target.value.replace(",", "."));
            if (e.target.value.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 2)
              onChange({ ...value, floorBuildUp: n });
          }}
          className="block w-20 rounded border bg-background p-1 disabled:opacity-50"
        />
      </label>
      <HeightLinesField
        value={value.heightLines}
        onValue={(heightLines) => onChange({ ...value, heightLines })}
      />
      <label className="text-xs">
        Ebene
        <select
          aria-label="Raum-Ebene"
          value={value.layerId}
          onChange={(e) => onChange({ ...value, layerId: e.target.value })}
          className="block rounded border bg-background p-1"
        >
          {layers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

/** Room tool bar: construction, defaults and the number the next room gets. */
export function RoomToolFields({
  construction,
  onConstruction,
  value,
  onChange,
  layers,
  nextNumber,
}: {
  construction: RoomConstruction;
  onConstruction: (construction: RoomConstruction) => void;
  value: RoomDefaults;
  onChange: (value: RoomDefaults) => void;
  layers: readonly Layer[];
  nextNumber: string;
}) {
  return (
    <section aria-label="Raumwerkzeug" className="flex flex-wrap items-end gap-3">
      <ConstructionSelect value={construction} onValue={onConstruction} />
      <RoomDefaultFields value={value} onChange={onChange} layers={layers} />
      <p role="status" className="text-xs text-muted-foreground">
        Nächste Nummer {nextNumber} ·{" "}
        {construction === "walls"
          ? "in einen von Wänden umschlossenen Bereich klicken"
          : "Umriss zeichnen"}{" "}
        · Esc bricht ab
      </p>
    </section>
  );
}

/** Detailed room tool settings (double click on the tool); same draft as the bar. */
export function RoomSettingsPanel({
  open,
  onOpenChange,
  construction,
  onConstruction,
  value,
  onChange,
  layers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  construction: RoomConstruction;
  onConstruction: (construction: RoomConstruction) => void;
  value: RoomDefaults;
  onChange: (value: RoomDefaults) => void;
  layers: readonly Layer[];
}) {
  return (
    <FloatingPanel
      open={open}
      title="Raum-Einstellungen"
      onClose={() => onOpenChange(false)}
      width={560}
      height={420}
    >
      <SettingsSections
        sections={[
          {
            id: "room",
            label: "Raum",
            content: (
              <>
                <div className="flex flex-wrap gap-3">
                  <RoomDefaultFields value={value} onChange={onChange} layers={layers} />
                </div>
                <p className="text-muted-foreground">
                  Nummern werden fortlaufend vergeben (R-001, R-002 …) und sind im Projekt
                  eindeutig. Der Fußbodenaufbau ist optional: abgewählt zählt die Oberkante
                  Rohfußboden als Boden des Raumes. Höhenlinien (lichte Höhe über dem Boden) werden
                  im Grundriss gezeichnet und gliedern die Fläche in Höhenzonen; leer = keine
                  Linien.
                </p>
              </>
            ),
          },
          {
            id: "creation",
            label: "Erstellung",
            content: (
              <>
                <ConstructionSelect value={construction} onValue={onConstruction} />
                <p className="text-muted-foreground">
                  „Klick in Raum zwischen Wänden“ übernimmt die Fläche bis zu den Wandinnenseiten;
                  Türen und Fenster öffnen die Grenze nicht. Räume ohne Wände (z. B. Küche/Essen)
                  als Polygon zeichnen.
                </p>
              </>
            ),
          },
        ]}
      />
    </FloatingPanel>
  );
}
