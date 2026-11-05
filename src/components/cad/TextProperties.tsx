import { useState } from "react";
import { updateText } from "@/application/texts/actions";
import { planDenominator } from "@/domain/views/scale";
import type { PlanText } from "@/domain/elements/text/model";
import type { Project } from "@/domain/project/schema";
import type { Selection } from "./bim-view";
import { TextFields, type TextDefaults } from "./TextFields";

/** Properties of one text (docs/TEXT.md, T1): content and settings, one undo step per edit. */
export function TextProperties({
  project,
  text,
  selection,
  onChange,
}: {
  project: Project;
  text: PlanText;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const { id: _id, position: _position, content, ...stored } = text;
  const [value, setValue] = useState<TextDefaults>(stored);
  const [draft, setDraft] = useState(content);
  const [error, setError] = useState("");
  const apply = (changes: Partial<PlanText>) => {
    try {
      onChange(updateText(project, text.id, changes), selection);
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Änderung nicht möglich.");
    }
  };
  return (
    <section aria-label="Texteigenschaften" className="flex flex-wrap items-end gap-3">
      <h2 className="text-sm font-semibold">Text</h2>
      <label className="text-xs">
        Inhalt
        <textarea
          aria-label="Textinhalt"
          value={draft}
          rows={Math.min(4, draft.split("\n").length)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== content && apply({ content: draft })}
          className="block w-56 rounded border bg-background p-1"
        />
      </label>
      <TextFields
        value={value}
        onChange={setValue}
        onCommit={(next) => {
          if (JSON.stringify(next) !== JSON.stringify(stored)) apply(next);
        }}
        layers={project.layers}
        denominator={planDenominator(project)}
      />
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
