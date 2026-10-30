import { useEffect, useState } from "react";
import type { HatchConstruction } from "@/application/hatches/construction";
import type { Layer } from "@/domain/layers/model";
import { FloatingPanel } from "./FloatingPanel";
import { SettingsSections } from "./SettingsSections";
import type { RoomDefaults } from "./useToolDefaults";
import { heightLineLabel } from "@/application/rooms/height-lines";
import { HeightLineEditor } from "./HeightLineEditor";

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
  onOpenSettings,
}: {
  construction: RoomConstruction;
  onConstruction: (construction: RoomConstruction) => void;
  value: RoomDefaults;
  onChange: (value: RoomDefaults) => void;
  layers: readonly Layer[];
  nextNumber: string;
  onOpenSettings: () => void;
}) {
  return (
    <section aria-label="Raumwerkzeug" className="flex flex-wrap items-end gap-3">
      <ConstructionSelect value={construction} onValue={onConstruction} />
      <RoomDefaultFields value={value} onChange={onChange} layers={layers} />
      {/* The bar only shows the height lines; all their settings live in the window (R3b). */}
      <button
        type="button"
        onClick={onOpenSettings}
        title="Höhenlinien in den Raum-Einstellungen bearbeiten"
        className="self-end rounded border px-2 py-1 text-xs hover:bg-muted"
      >
        Höhenlinien:{" "}
        {value.heightLines.length ? value.heightLines.map(heightLineLabel).join(" · ") : "keine"} …
      </button>
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
  section,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: string | undefined;
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
      width={760}
      height={460}
    >
      <SettingsSections
        initial={section}
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
                  Rohfußboden als Boden des Raumes.
                </p>
              </>
            ),
          },
          {
            id: "height-lines",
            label: "Höhenlinien",
            content: (
              <>
                <HeightLineEditor
                  lines={value.heightLines}
                  onChange={(heightLines) => onChange({ ...value, heightLines })}
                />
                <p className="text-muted-foreground">
                  Neue Räume übernehmen diese Linien. Jede Linie hat ihre eigene Höhe, Farbe und
                  Linienart (aus den Linienarten der Einstellungen) sowie Unter- und Oberkante: z.
                  B. 2,30 m von OK Fußboden bis Außenkante Dachhaut für einen Geschossnachweis. Je
                  Linie werden die Fläche ab dieser Höhe und ihr Anteil an der Grundfläche ermittelt
                  (Außenkante Dachhaut gilt bei Decken als deren Oberkante); die rechtliche
                  Bewertung nach Landesbauordnung erfolgt hier nicht.
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
