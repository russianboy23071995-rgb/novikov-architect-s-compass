import { useState } from "react";
import type { ScaleContext } from "@/domain/views/scale";
import { parseOutputScale } from "@/application/views/scale-input";

export function ViewScaleControl({
  context,
  onChange,
}: {
  context: ScaleContext;
  onChange: (denominator: number) => void;
}) {
  const presets = [50, 100, 200, 500, 1000, 2500, 5000];
  const [custom, setCustom] = useState(!presets.includes(context.denominator));
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
        title="Arbeitsmaßstab · im Projekt gespeichert, außerhalb Modell-Undo. Zoom bleibt unabhängig."
      >
        Maßstab
        <select
          aria-label="Maßstab auswählen"
          className="h-6 w-24 rounded border border-border bg-popover px-1"
          value={custom ? "custom" : context.denominator}
          onChange={(event) => {
            setError("");
            if (event.target.value === "custom") {
              setCustom(true);
              return;
            }
            const denominator = Number(event.target.value);
            setCustom(false);
            setDraft(`1:${denominator}`);
            onChange(denominator);
          }}
        >
          {presets.map((scale) => (
            <option key={scale} value={scale}>
              1:{scale}
            </option>
          ))}
          <option value="custom">Individuell</option>
        </select>
        {custom && (
          <input
            aria-label="Arbeitsmaßstab"
            aria-invalid={!!error}
            placeholder="1:xxxx"
            autoFocus
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
        )}
      </label>
      {error && (
        <span role="alert" className="text-destructive" title={error}>
          Ungültiger Maßstab
        </span>
      )}
    </form>
  );
}
