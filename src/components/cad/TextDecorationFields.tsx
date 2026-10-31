import { TEXT_DECORATION_DEFAULTS } from "@/domain/elements/text/model";
import type { TextDefaults } from "./TextFields";

type Decoration = "background" | "frame" | "halo";
const LABELS: Record<Decoration, string> = {
  background: "Hinterlegung",
  frame: "Umrandung",
  halo: "Freistellung",
};
const HINTS: Record<Decoration, string> = {
  background: "Gefülltes Feld hinter dem Text",
  frame: "Rahmen um den Text (Linienstärke in mm Papier)",
  halo: "Rand um die Buchstaben, damit Text über Schraffuren lesbar bleibt",
};

/**
 * Text design (docs/TEXT.md, T2): bold/italic/underline and the three decorations, each
 * switched on with its defaults and then coloured. Every choice applies at once.
 */
export function TextDecorationFields({
  value,
  onChoose,
}: {
  value: TextDefaults;
  onChoose: (value: TextDefaults) => void;
}) {
  const toggle = (field: "bold" | "italic" | "underline", label: string, short: string) => (
    <label className="flex items-center gap-1 text-xs" title={label}>
      <input
        type="checkbox"
        aria-label={label}
        checked={!!value[field]}
        onChange={(e) => onChoose({ ...value, [field]: e.target.checked || undefined })}
      />
      <span
        className={field === "bold" ? "font-bold" : field === "italic" ? "italic" : "underline"}
      >
        {short}
      </span>
    </label>
  );
  const decoration = (field: Decoration) => {
    const current = value[field];
    return (
      <div className="flex items-end gap-1 text-xs" title={HINTS[field]}>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            aria-label={LABELS[field]}
            checked={!!current}
            onChange={(e) =>
              onChoose({
                ...value,
                [field]: e.target.checked ? { ...TEXT_DECORATION_DEFAULTS[field] } : undefined,
              })
            }
          />
          {LABELS[field]}
        </label>
        {current && (
          <input
            type="color"
            aria-label={`${LABELS[field]} Farbe`}
            value={current.color}
            onChange={(e) => onChoose({ ...value, [field]: { ...current, color: e.target.value } })}
            className="h-6 w-8 rounded border bg-background"
          />
        )}
        {field === "frame" && value.frame && (
          <select
            aria-label="Umrandung Linienstärke"
            value={String(value.frame.width)}
            onChange={(e) =>
              onChoose({ ...value, frame: { ...value.frame!, width: Number(e.target.value) } })
            }
            className="rounded border bg-background p-0.5"
          >
            {[0.13, 0.18, 0.25, 0.35, 0.5, 0.7].map((w) => (
              <option key={w} value={String(w)}>
                {w.toLocaleString("de-DE")} mm
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };
  return (
    <section aria-label="Textgestaltung" className="flex flex-wrap items-end gap-3">
      {toggle("bold", "Fett", "F")}
      {toggle("italic", "Kursiv", "K")}
      {toggle("underline", "Unterstrichen", "U")}
      {decoration("background")}
      {decoration("frame")}
      {decoration("halo")}
    </section>
  );
}
