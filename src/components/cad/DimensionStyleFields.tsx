import {
  DIMENSION_STYLE_DEFAULTS,
  DIMENSION_TERMINATORS,
  DIMENSION_TERMINATOR_LABELS,
  DIMENSION_UNITS,
  DIMENSION_UNIT_LABELS,
  type DimensionTerminator,
  type DimensionUnits,
} from "@/domain/elements/dimension/model";

export type DimensionStyle = {
  terminator?: DimensionTerminator | undefined;
  units?: DimensionUnits | undefined;
  textSize?: number | undefined;
};

/** Display of a chain (docs/MASSKETTE.md, Darstellung): terminator, figures, figure height. */
export function DimensionStyleFields({
  value,
  onChange,
}: {
  value: DimensionStyle;
  onChange: (value: DimensionStyle) => void;
}) {
  return (
    <>
      <label className="text-xs">
        Begrenzung
        <select
          aria-label="Maßbegrenzung"
          value={value.terminator ?? DIMENSION_STYLE_DEFAULTS.terminator}
          onChange={(e) =>
            onChange({ ...value, terminator: e.target.value as DimensionTerminator })
          }
          className="block rounded border bg-background p-1"
        >
          {DIMENSION_TERMINATORS.map((t) => (
            <option key={t} value={t}>
              {DIMENSION_TERMINATOR_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs">
        Maßzahl
        <select
          aria-label="Maßzahlformat"
          value={value.units ?? DIMENSION_STYLE_DEFAULTS.units}
          onChange={(e) => onChange({ ...value, units: e.target.value as DimensionUnits })}
          className="block rounded border bg-background p-1"
        >
          {DIMENSION_UNITS.map((u) => (
            <option key={u} value={u}>
              {DIMENSION_UNIT_LABELS[u]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs">
        Schrift
        <select
          aria-label="Maßzahlhöhe"
          value={String(value.textSize ?? DIMENSION_STYLE_DEFAULTS.textSize)}
          onChange={(e) => onChange({ ...value, textSize: Number(e.target.value) })}
          className="block rounded border bg-background p-1"
        >
          {[1.8, 2.5, 3.5, 5].map((s) => (
            <option key={s} value={String(s)}>
              {s.toLocaleString("de-DE")} mm
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
