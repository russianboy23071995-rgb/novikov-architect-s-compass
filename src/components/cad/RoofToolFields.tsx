import { useEffect, useState } from "react";
import type { HatchConstruction } from "@/application/hatches/construction";
import { MAX_ROOF_PITCH, MIN_ROOF_PITCH } from "@/domain/elements/roof/model";
import type { RoofCut } from "@/domain/elements/roof/geometry";
import type { Layer } from "@/domain/layers/model";
import { FloatingPanel } from "./FloatingPanel";
import { SETTINGS_WINDOW } from "./settings-window-size";
import { SettingsSections } from "./SettingsSections";
import type { RoofDefaults } from "./useToolDefaults";
import { ROOF_CUT_LABELS, type RoofPhase } from "./roof-labels";

const PHASE_TEXT: Record<RoofPhase, string> = {
  line: "1 · Bezugslinie: zwei Punkte setzen",
  side: "2 · Steigseite: auf die Seite klicken, zu der das Dach ansteigt",
  outline: "3 · Umriss zeichnen (äußerer Dachrand)",
};

/** Number field over a shared draft: shows the outside value until the user types. */
function NumberDefault({
  label,
  aria,
  value,
  valid,
  onValue,
}: {
  label: string;
  aria: string;
  value: number;
  valid: (n: number) => boolean;
  onValue: (n: number) => void;
}) {
  const [raw, setRaw] = useState(String(value));
  // Another editor of the same draft changed the value: follow it.
  useEffect(() => {
    if (Number(raw.replace(",", ".")) !== value) setRaw(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <label className="text-xs">
      {label}
      <input
        aria-label={aria}
        inputMode="decimal"
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          const n = Number(e.target.value.replace(",", "."));
          if (e.target.value.trim() !== "" && Number.isFinite(n) && valid(n)) onValue(n);
        }}
        className="block w-20 rounded border bg-background p-1"
      />
    </label>
  );
}

function CutSelect({
  label,
  aria,
  value,
  onValue,
}: {
  label: string;
  aria: string;
  value: RoofCut;
  onValue: (cut: RoofCut) => void;
}) {
  return (
    <label className="text-xs">
      {label}
      <select
        aria-label={aria}
        value={value}
        onChange={(e) => onValue(e.target.value as RoofCut)}
        className="block rounded border bg-background p-1"
      >
        {(Object.keys(ROOF_CUT_LABELS) as RoofCut[]).map((cut) => (
          <option key={cut} value={cut}>
            {ROOF_CUT_LABELS[cut]}
          </option>
        ))}
      </select>
    </label>
  );
}

function ConstructionSelect({
  value,
  onValue,
}: {
  value: HatchConstruction;
  onValue: (c: HatchConstruction) => void;
}) {
  return (
    <label className="text-xs">
      Umriss
      <select
        aria-label="Dach-Umriss"
        value={value}
        onChange={(e) => onValue(e.target.value as HatchConstruction)}
        className="block rounded border bg-background p-1"
      >
        <option value="polygon">Polygon per Klick</option>
        <option value="diagonal">Rechteck: Diagonale</option>
        <option value="side-height">Gedrehtes Rechteck: Seite + dritter Punkt</option>
        <option value="boundary">Geschlossene Kontur übernehmen</option>
      </select>
    </label>
  );
}

/** Fields of the roof tool defaults; the bar and the settings window edit the same draft. */
function RoofDefaultFields({
  value,
  onChange,
  layers,
  part,
}: {
  value: RoofDefaults;
  onChange: (value: RoofDefaults) => void;
  layers: readonly Layer[];
  part: "form" | "cuts" | "layer" | "all";
}) {
  const show = (p: "form" | "cuts" | "layer") => part === "all" || part === p;
  return (
    <>
      {show("form") && (
        <>
          <NumberDefault
            label="Neigung (°)"
            aria="Dachneigung"
            value={value.pitch}
            valid={(n) => n >= MIN_ROOF_PITCH && n <= MAX_ROOF_PITCH}
            onValue={(pitch) => onChange({ ...value, pitch })}
          />
          <NumberDefault
            label="Stärke (m)"
            aria="Dachstärke"
            value={value.thickness}
            valid={(n) => n > 0}
            onValue={(thickness) => onChange({ ...value, thickness })}
          />
          <NumberDefault
            label="Bezugshöhe (m)"
            aria="Bezugshöhe Unterseite"
            value={value.referenceHeight}
            valid={() => true}
            onValue={(referenceHeight) => onChange({ ...value, referenceHeight })}
          />
        </>
      )}
      {show("cuts") && (
        <>
          <CutSelect
            label="Traufe"
            aria="Abschluss Traufe"
            value={value.eaveCut}
            onValue={(eaveCut) => onChange({ ...value, eaveCut })}
          />
          <CutSelect
            label="Obere Kante"
            aria="Abschluss obere Kante"
            value={value.topCut}
            onValue={(topCut) => onChange({ ...value, topCut })}
          />
        </>
      )}
      {show("layer") && (
        <label className="text-xs">
          Ebene
          <select
            aria-label="Dach-Ebene"
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
      )}
    </>
  );
}

/** Roof tool bar: construction, all defaults and the current drawing phase. */
export function RoofToolFields({
  construction,
  onConstruction,
  value,
  onChange,
  layers,
  phase,
}: {
  construction: HatchConstruction;
  onConstruction: (construction: HatchConstruction) => void;
  value: RoofDefaults;
  onChange: (value: RoofDefaults) => void;
  layers: readonly Layer[];
  phase: RoofPhase;
}) {
  return (
    <section aria-label="Dachwerkzeug" className="flex flex-wrap items-end gap-3">
      <ConstructionSelect value={construction} onValue={onConstruction} />
      <RoofDefaultFields value={value} onChange={onChange} layers={layers} part="all" />
      <p role="status" className="text-xs text-muted-foreground">
        {PHASE_TEXT[phase]} · Esc bricht ab
      </p>
    </section>
  );
}

/** Detailed roof tool settings (double click on the tool); same draft as the bar. */
export function RoofSettingsPanel({
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
  construction: HatchConstruction;
  onConstruction: (construction: HatchConstruction) => void;
  value: RoofDefaults;
  onChange: (value: RoofDefaults) => void;
  layers: readonly Layer[];
}) {
  return (
    <FloatingPanel
      open={open}
      title="Dach-Einstellungen"
      onClose={() => onOpenChange(false)}
      width={SETTINGS_WINDOW.width}
      height={SETTINGS_WINDOW.height}
    >
      <SettingsSections
        sections={[
          {
            id: "form",
            label: "Form",
            content: (
              <>
                <div className="flex flex-wrap gap-3">
                  <RoofDefaultFields
                    value={value}
                    onChange={onChange}
                    layers={layers}
                    part="form"
                  />
                </div>
                <p className="text-muted-foreground">
                  Bezugshöhe = Unterseite des Dachs an der Bezugslinie, über dem Geschossboden. Die
                  Stärke wird senkrecht zur Dachfläche gemessen.
                </p>
              </>
            ),
          },
          {
            id: "cuts",
            label: "Abschlüsse",
            content: (
              <>
                <div className="flex flex-wrap gap-3">
                  <RoofDefaultFields
                    value={value}
                    onChange={onChange}
                    layers={layers}
                    part="cuts"
                  />
                </div>
                <p className="text-muted-foreground">
                  Traufe und obere Kante sind die Umrisskanten parallel zur Bezugslinie. Alle
                  anderen Kanten (Ortgang) sind vertikal. Der Umriss ist der äußere Dachrand von
                  oben; bei „rechtwinklig“ und „horizontal“ liegt die innere Kante weiter innen.
                </p>
              </>
            ),
          },
          {
            id: "creation",
            label: "Erstellung",
            content: (
              <>
                <div className="flex flex-wrap gap-3">
                  <ConstructionSelect value={construction} onValue={onConstruction} />
                  <RoofDefaultFields
                    value={value}
                    onChange={onChange}
                    layers={layers}
                    part="layer"
                  />
                </div>
                <p className="text-muted-foreground">
                  Ablauf: Bezugslinie mit zwei Punkten, Klick auf die Seite, zu der das Dach
                  ansteigt, dann den Umriss. „Seite + dritter Punkt“ zeichnet ein gedrehtes
                  Rechteck; die drei Punkte bestimmen keine drei Dachhöhen.
                </p>
              </>
            ),
          },
        ]}
      />
    </FloatingPanel>
  );
}
