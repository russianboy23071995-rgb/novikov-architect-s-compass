import { useEffect, useState } from "react";
import { validateLineStyle, type LineStyleDefinition } from "@/application/lines/style-library";
import { formatMetres, withAddedHeightLine } from "@/application/rooms/height-lines";
import {
  defaultHeightLines,
  HEIGHT_LINE_LOWER,
  HEIGHT_LINE_LOWER_LABELS,
  HEIGHT_LINE_UPPER,
  HEIGHT_LINE_UPPER_LABELS,
  MAX_ROOM_HEIGHT_LINE,
  MAX_ROOM_HEIGHT_LINES,
  MIN_ROOM_HEIGHT_LINE,
  type HeightLine,
  type HeightLineLower,
  type HeightLineStyle,
  type HeightLineUpper,
} from "@/domain/elements/room/height-line";
import { useLineInventory } from "./useLineInventory";

/** Embedded copy of a library style (validated, complete) for a height line. */
function embedded(style: LineStyleDefinition): HeightLineStyle {
  const valid = validateLineStyle(style);
  return {
    id: valid.id,
    name: valid.name,
    dashes: [...valid.dashes],
    color: valid.color,
    ...(valid.colorEditable === false ? { colorEditable: false } : {}),
    period: valid.period,
    segments: valid.segments.map((s) => ({ start: { ...s.start }, end: { ...s.end } })),
  };
}

/** Height of one line; commits on Enter or leaving the field, refuses out-of-range values. */
function HeightInput({ value, onValue }: { value: number; onValue: (h: number) => void }) {
  const [raw, setRaw] = useState(formatMetres(value));
  const [error, setError] = useState("");
  useEffect(() => {
    setRaw(formatMetres(value));
    setError("");
  }, [value]);
  const commit = () => {
    const n = Number(raw.trim().replace(",", "."));
    if (!raw.trim() || !Number.isFinite(n) || n < MIN_ROOM_HEIGHT_LINE || n > MAX_ROOM_HEIGHT_LINE)
      return setError(
        `Höhe zwischen ${formatMetres(MIN_ROOM_HEIGHT_LINE)} und ${formatMetres(MAX_ROOM_HEIGHT_LINE)} m.`,
      );
    setError("");
    if (n !== value) onValue(n);
    else setRaw(formatMetres(value));
  };
  return (
    <span>
      <input
        aria-label="Höhe der Höhenlinie"
        inputMode="decimal"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        className="w-16 rounded border bg-background p-1"
      />
      {error && <span className="block max-w-40 text-destructive">{error}</span>}
    </span>
  );
}

/** Colour of one line; previews while choosing, commits once when the picker closes, so a
 * room change stays one undo step. */
function ColorInput({
  value,
  fixed,
  onValue,
}: {
  value: string;
  fixed: boolean;
  onValue: (color: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft.toLowerCase() !== value.toLowerCase()) onValue(draft);
  };
  return (
    <input
      type="color"
      aria-label="Farbe der Höhenlinie"
      value={draft}
      disabled={fixed}
      title={fixed ? "Diese Linienart hat eine feste Farbe." : undefined}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
      }}
      className="h-7 w-9 rounded border bg-background disabled:opacity-50"
    />
  );
}

/**
 * All height lines of a room or of the room tool (docs/ROOM_ELEMENT.md, R3b): height, colour,
 * line style from the settings library, lower and upper reference; add, delete, reset.
 * Every change hands over the complete new list once.
 */
export function HeightLineEditor({
  lines,
  onChange,
}: {
  lines: readonly HeightLine[];
  onChange: (lines: HeightLine[]) => void;
}) {
  const inventory = useLineInventory();
  const [error, setError] = useState("");
  const change = (index: number, patch: Partial<HeightLine>) =>
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  return (
    <div className="space-y-2 text-xs" aria-label="Höhenlinien bearbeiten">
      {lines.length === 0 && <p className="text-muted-foreground">Keine Höhenlinien.</p>}
      {lines.length > 0 && (
        <table className="w-full border-separate border-spacing-y-1">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="font-normal">Höhe (m)</th>
              <th className="font-normal">Farbe</th>
              <th className="font-normal">Linienart</th>
              <th className="font-normal">Unterkante</th>
              <th className="font-normal">Oberkante</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const known = inventory.styles.some((s) => s.id === line.style.id);
              return (
                <tr key={line.id} aria-label={`Höhenlinie ${formatMetres(line.height)}`}>
                  <td>
                    <HeightInput
                      value={line.height}
                      onValue={(height) => change(index, { height })}
                    />
                  </td>
                  <td>
                    <ColorInput
                      value={line.color}
                      fixed={line.style.colorEditable === false}
                      onValue={(color) => change(index, { color })}
                    />
                  </td>
                  <td>
                    <select
                      aria-label="Linienart der Höhenlinie"
                      value={line.style.id}
                      onChange={(e) => {
                        const chosen = inventory.styles.find((s) => s.id === e.target.value);
                        if (!chosen) return;
                        try {
                          const style = embedded(chosen);
                          change(index, {
                            style,
                            ...(style.colorEditable === false ? { color: style.color } : {}),
                          });
                          setError("");
                        } catch (err) {
                          setError((err as Error).message);
                        }
                      }}
                      className="max-w-36 rounded border bg-background p-1"
                    >
                      {!known && <option value={line.style.id}>{line.style.name}</option>}
                      {inventory.styles.map((style) => (
                        <option key={style.id} value={style.id}>
                          {style.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      aria-label="Unterkante der Höhenlinie"
                      value={line.lower}
                      onChange={(e) => change(index, { lower: e.target.value as HeightLineLower })}
                      className="rounded border bg-background p-1"
                    >
                      {HEIGHT_LINE_LOWER.map((lower) => (
                        <option key={lower} value={lower}>
                          {HEIGHT_LINE_LOWER_LABELS[lower]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      aria-label="Oberkante der Höhenlinie"
                      value={line.upper}
                      onChange={(e) => change(index, { upper: e.target.value as HeightLineUpper })}
                      className="rounded border bg-background p-1"
                    >
                      {HEIGHT_LINE_UPPER.map((upper) => (
                        <option key={upper} value={upper}>
                          {HEIGHT_LINE_UPPER_LABELS[upper]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      aria-label="Höhenlinie löschen"
                      onClick={() => onChange(lines.filter((_, i) => i !== index))}
                      className="rounded border px-2 py-1 hover:bg-muted"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={lines.length >= MAX_ROOM_HEIGHT_LINES}
          onClick={() => {
            try {
              onChange(withAddedHeightLine(lines));
              setError("");
            } catch (err) {
              setError((err as Error).message);
            }
          }}
          className="rounded border px-2 py-1 hover:bg-muted disabled:opacity-50"
        >
          Höhenlinie hinzufügen
        </button>
        <button
          type="button"
          onClick={() => onChange(defaultHeightLines())}
          className="rounded border px-2 py-1 hover:bg-muted"
        >
          Standard (1,00 / 2,00 m) wiederherstellen
        </button>
      </div>
      {inventory.error && <p className="text-destructive">{inventory.error}</p>}
      {error && <p className="text-destructive">{error}</p>}
    </div>
  );
}
