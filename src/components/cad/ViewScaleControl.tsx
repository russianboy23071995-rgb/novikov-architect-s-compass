import { useId, useState } from "react";
import type { ScaleContext } from "@/domain/views/scale";
import { parseOutputScale } from "@/application/views/scale-session";

export function ViewScaleControl({
  context,
  onChange,
}: {
  context: ScaleContext;
  onChange: (denominator: number) => void;
}) {
  const list = useId();
  const [draft, setDraft] = useState(`1:${context.denominator}`);
  const [error, setError] = useState("");
  const apply = () => {
    try {
      const denominator = parseOutputScale(draft);
      onChange(denominator);
      setDraft(`1:${denominator}`);
      setError("");
    } catch (cause) {
      setError((cause as Error).message);
    }
  };
  return (
    <form
      className="flex items-center gap-1 text-[11px]"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <label
        className="flex items-center gap-1"
        title="Arbeitsmaßstab · nur für diese Sitzung; Papierdarstellung folgt. Zoom bleibt unabhängig."
      >
        Maßstab
        <input
          aria-label="Arbeitsmaßstab"
          aria-invalid={!!error}
          list={list}
          className="h-6 w-24 rounded border border-border bg-popover px-1"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError("");
          }}
          onBlur={apply}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Escape") {
              event.preventDefault();
              setDraft(`1:${context.denominator}`);
              setError("");
            }
          }}
        />
      </label>
      <datalist id={list}>
        {[20, 50, 100, 200, 500].map((scale) => (
          <option key={scale} value={`1:${scale}`} />
        ))}
      </datalist>
      {error && (
        <span role="alert" className="text-destructive" title={error}>
          Ungültiger Maßstab
        </span>
      )}
    </form>
  );
}
