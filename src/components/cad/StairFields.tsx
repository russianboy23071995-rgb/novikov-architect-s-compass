import { useState } from "react";
import type { StairDefaults } from "@/application/stairs/defaults";
import { stairValues } from "@/application/stairs/defaults";
import {
  STAIR_AXES,
  STAIR_AXIS_LABELS,
  STAIR_RULE_LABELS,
  STAIR_RULE_SETS,
  stairGeometry,
} from "@/domain/elements/stair/model";
import type { Layer } from "@/domain/layers/model";

type NumberField =
  | "width"
  | "riserTarget"
  | "riserCount"
  | "tread"
  | "waist"
  | "baseOffset"
  | "height"
  | "topOffset";
/** Lengths are typed in centimetres where builders think in centimetres. */
const FIELDS: Record<NumberField, { label: string; cm: boolean; positive: boolean }> = {
  width: { label: "Laufbreite (m)", cm: false, positive: true },
  riserTarget: { label: "Ziel-Steigung (cm)", cm: true, positive: true },
  riserCount: { label: "Steigungen", cm: false, positive: true },
  tread: { label: "Auftritt (cm)", cm: true, positive: true },
  waist: { label: "Laufplatte (cm)", cm: true, positive: true },
  baseOffset: { label: "Fuß über OK RFB (m)", cm: false, positive: false },
  height: { label: "Höhe (m)", cm: false, positive: true },
  topOffset: { label: "Versatz Oberkante (m)", cm: false, positive: false },
};

/**
 * All stair settings (docs/TREPPE.md, TR2): drawing axis, width, riser target, riser count and
 * tread computed or fixed, stair slab, rule set, foot and height rule, layer – plus the live
 * result of the calculation and the DIN 18065 check. The same set in the bar, the settings
 * window and the properties; with onCommit a change applies when a field is left.
 */
export function StairFields({
  value,
  onChange,
  onCommit,
  layers,
  storeyHeight,
}: {
  value: StairDefaults;
  onChange: (value: StairDefaults) => void;
  onCommit?: (value: StairDefaults) => void;
  layers: readonly Layer[];
  storeyHeight: number | null;
}) {
  const [draft, setDraft] = useState<Partial<Record<NumberField, string>>>({});
  const choose = (next: StairDefaults) => {
    onChange(next);
    onCommit?.(next);
  };
  const shown = (field: NumberField) => {
    const v = value[field];
    return String(FIELDS[field].cm ? Math.round(v * 1000) / 10 : v);
  };
  const number = (field: NumberField) => (
    <label key={field} className="text-xs">
      {FIELDS[field].label}
      <input
        aria-label={`Treppe ${FIELDS[field].label}`}
        inputMode="decimal"
        value={draft[field] ?? shown(field)}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft((d) => ({ ...d, [field]: raw }));
          const parsed = Number(raw.replace(",", "."));
          if (raw.trim() === "" || !Number.isFinite(parsed)) return;
          if (FIELDS[field].positive && parsed <= 0) return;
          onChange({ ...value, [field]: FIELDS[field].cm ? parsed / 100 : parsed });
        }}
        onBlur={() => {
          setDraft((d) => ({ ...d, [field]: undefined }));
          onCommit?.(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit?.(value);
        }}
        className="block w-16 rounded border bg-background p-1"
      />
    </label>
  );
  const select = <K extends "axis" | "ruleSet" | "riserCountMode" | "treadMode" | "heightMode">(
    field: K,
    label: string,
    options: readonly (readonly [StairDefaults[K], string])[],
  ) => (
    <label className="text-xs">
      {label}
      <select
        aria-label={`Treppe ${label}`}
        value={value[field]}
        onChange={(e) => choose({ ...value, [field]: e.target.value as StairDefaults[K] })}
        className="block rounded border bg-background p-1"
      >
        {options.map(([option, text]) => (
          <option key={option} value={option}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
  const g = stairGeometry(stairValues(value), storeyHeight);
  const cm = (m: number) => (m * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 });
  return (
    <section aria-label="Treppeneinstellungen" className="flex flex-wrap items-end gap-3">
      {select(
        "axis",
        "Zeichenachse",
        STAIR_AXES.map((a) => [a, STAIR_AXIS_LABELS[a]] as const),
      )}
      {number("width")}
      {number("riserTarget")}
      {select("riserCountMode", "Anzahl", [
        ["auto", "Berechnet"],
        ["fixed", "Fest"],
      ])}
      {value.riserCountMode === "fixed" && number("riserCount")}
      {select("treadMode", "Auftritt", [
        ["auto", "Aus 2h + a = 63"],
        ["fixed", "Fest"],
      ])}
      {value.treadMode === "fixed" && number("tread")}
      {number("waist")}
      {select("heightMode", "Höhe", [
        ["storey", "Bis Geschoss darüber"],
        ["fixed", "Feste Höhe"],
      ])}
      {value.heightMode === "fixed" ? number("height") : number("topOffset")}
      {number("baseOffset")}
      {select(
        "ruleSet",
        "Regelwerk",
        STAIR_RULE_SETS.map((r) => [r, STAIR_RULE_LABELS[r]] as const),
      )}
      <label className="text-xs">
        Ebene
        <select
          aria-label="Treppenebene"
          value={value.layerId}
          onChange={(e) => choose({ ...value, layerId: e.target.value })}
          className="block rounded border bg-background p-1"
        >
          {layers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </label>
      <p
        aria-label="Treppenberechnung"
        className={`basis-full text-xs ${g?.issues.length ? "text-destructive" : "text-muted-foreground"}`}
      >
        {g
          ? `${g.riserCount} Steigungen à ${cm(g.riser)} cm · ${g.treadCount} Auftritte à ${cm(g.tread)} cm · Lauflänge ${g.run.toLocaleString("de-DE", { maximumFractionDigits: 2 })} m · 2h + a = ${cm(g.stepRule)} cm · ${g.issues.length ? g.issues.join(" · ") : "DIN 18065 eingehalten"}`
          : "Höhe unbekannt: Geschosshöhe festlegen oder feste Höhe wählen."}
      </p>
    </section>
  );
}
