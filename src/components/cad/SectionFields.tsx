import type { SectionDefaults } from "@/application/sections/actions";
import { SECTION_MARK_KINDS, SECTION_MARK_KIND_LABELS } from "@/domain/views/sections";
import { SectionSizeField } from "./SectionSizeField";

/** Defaults of the section tool (docs/SCHNITT.md, SC2/SC4): mark sequence, name prefix, size. */
export function SectionFields({
  value,
  onChange,
  next,
  denominator,
  onFourElevations,
}: {
  value: SectionDefaults;
  onChange: (value: SectionDefaults) => void;
  /** Mark and name of the next section. */
  next: { mark: string; name: string };
  /** Output scale 1:denominator. */
  denominator: number;
  /** Elevation tool (A1): north, east, south and west elevation at once. */
  onFourElevations?: () => void;
}) {
  return (
    <section aria-label="Schnitteinstellungen" className="flex flex-wrap items-end gap-3">
      <label className="text-xs">
        Kennung
        <select
          value={value.markKind}
          onChange={(event) =>
            onChange({ ...value, markKind: event.target.value as SectionDefaults["markKind"] })
          }
          className="block rounded border bg-background p-1"
        >
          {SECTION_MARK_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {SECTION_MARK_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs">
        Name
        <input
          value={value.namePrefix}
          maxLength={100}
          onChange={(event) => onChange({ ...value, namePrefix: event.target.value })}
          className="block w-28 rounded border bg-background p-1"
        />
      </label>
      <SectionSizeField
        value={value.symbolSize}
        onChange={(symbolSize) => onChange({ ...value, symbolSize })}
        denominator={denominator}
      />
      <p className="text-xs text-muted-foreground">
        Nächster: {next.name} · Klick Anfang, Klick Ende, Klick Blickrichtung
      </p>
      {onFourElevations && (
        <button
          type="button"
          onClick={onFourElevations}
          className="rounded border bg-background px-2 py-1 text-xs hover:bg-accent"
        >
          Vier Ansichten erzeugen
        </button>
      )}
    </section>
  );
}
