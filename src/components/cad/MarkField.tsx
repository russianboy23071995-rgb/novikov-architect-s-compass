import { useState } from "react";
import { Input } from "@/components/ui/input";
import { OverlapHint } from "./OverlapHint";

/** Position number of a window or door; applied on Enter or when leaving the field. */
export function MarkField({
  value,
  hint,
  onApply,
}: {
  value: string;
  hint: string;
  onApply: (mark: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    setDraft(value);
  }
  const apply = () => {
    if (draft !== value) onApply(draft);
  };
  return (
    <div className="text-xs">
      <label className="block">
        Nummer
        <Input
          aria-label="Positionsnummer"
          className="mt-1 h-8 w-28"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={apply}
          onKeyDown={(event) => {
            if (event.key === "Enter") apply();
            if (event.key === "Escape") setDraft(value);
          }}
        />
      </label>
      <OverlapHint text={hint} />
    </div>
  );
}
