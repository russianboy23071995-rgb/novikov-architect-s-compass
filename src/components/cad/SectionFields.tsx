import type { SectionDefaults } from "@/application/sections/actions";
import { SECTION_MARK_KINDS, SECTION_MARK_KIND_LABELS } from "@/domain/views/sections";

/** Defaults of the section tool (docs/SCHNITT.md, SC2): mark sequence and name prefix. */
export function SectionFields({
  value,
  onChange,
  next,
}: {
  value: SectionDefaults;
  onChange: (value: SectionDefaults) => void;
  /** Mark and name of the next section. */
  next: { mark: string; name: string };
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
      <p className="text-xs text-muted-foreground">
        Nächster: {next.name} · Klick Anfang, Klick Ende, Klick Blickrichtung
      </p>
    </section>
  );
}
