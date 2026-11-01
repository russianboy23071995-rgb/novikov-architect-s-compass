import { useState } from "react";
import { repeatedSectionMarks, sectionFrame, type Section } from "@/domain/views/sections";
import { Button } from "@/components/ui/button";

/** Element window of a section (docs/SCHNITT.md, SC2): name, mark, viewing side, delete. */
export function SectionProperties({
  section,
  sections,
  onChange,
  onDelete,
  onOpen,
}: {
  section: Section;
  sections: readonly Section[];
  onChange: (changes: Partial<Omit<Section, "id">>) => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const [name, setName] = useState(section.name);
  const [mark, setMark] = useState(section.mark);
  const repeated = repeatedSectionMarks(
    sections.map((s) => (s.id === section.id ? { ...s, mark: mark.trim() } : s)),
  ).has(mark.trim());
  const commit = () => {
    const changes: Partial<Omit<Section, "id">> = {};
    if (name.trim() && name.trim() !== section.name) changes.name = name.trim();
    if (mark.trim() && mark.trim() !== section.mark) changes.mark = mark.trim();
    if (Object.keys(changes).length) onChange(changes);
    else {
      setName(section.name);
      setMark(section.mark);
    }
  };
  const field = "block w-full rounded border bg-background p-1";
  return (
    <section aria-label="Schnitt" className="grid gap-3 p-3 text-xs">
      <label>
        Name
        <input
          value={name}
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => event.key === "Enter" && commit()}
          className={field}
        />
      </label>
      <label>
        Kennung
        <input
          value={mark}
          maxLength={12}
          onChange={(event) => setMark(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => event.key === "Enter" && commit()}
          className={field}
        />
      </label>
      {repeated && (
        <p role="status" className="text-amber-600">
          Kennung {mark.trim()} wird schon von einem anderen Schnitt verwendet.
        </p>
      )}
      <p className="text-muted-foreground">
        Länge {sectionFrame(section).length.toFixed(2)} m · Blick nach{" "}
        {section.look === "left" ? "links" : "rechts"} (von Anfang zu Ende gesehen)
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange({ look: section.look === "left" ? "right" : "left" })}
        >
          Blickrichtung umkehren
        </Button>
        <Button size="sm" variant="outline" onClick={onOpen}>
          Als Tab öffnen
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          Schnitt löschen
        </Button>
      </div>
    </section>
  );
}
