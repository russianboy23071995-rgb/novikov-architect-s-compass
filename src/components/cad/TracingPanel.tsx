import type { Project } from "@/domain/project/schema";
import { TRACING_COLORS, type Tracing } from "@/application/views/tracing";

/**
 * Transparency trace below the navigator (docs/TRANSPARENZPAUSE.md, S4): on/off, the storey that
 * shows through, its opacity and colour, and whether the snap engine uses it.
 */
export function TracingPanel({
  project,
  value,
  onChange,
}: {
  project: Project;
  value: Tracing;
  onChange: (value: Tracing) => void;
}) {
  const working = project.workingStoreyId ?? project.groundStoreyId;
  const others = [...project.storeys].reverse().filter((s) => s.id !== working);
  const known = TRACING_COLORS.some(([c]) => c === value.color);
  return (
    <section
      aria-label="Transparenzpause"
      className="glass-panel-strong grid gap-2 rounded-lg px-3 py-2 text-xs"
    >
      <label className="flex items-center gap-2 font-medium">
        <input
          type="checkbox"
          checked={value.enabled}
          disabled={!others.length}
          onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
        />
        Transparenzpause
      </label>
      {!others.length && (
        <p className="text-muted-foreground">Erst mit einem zweiten Geschoss möglich.</p>
      )}
      {value.enabled && others.length > 0 && (
        <>
          <label className="flex items-center justify-between gap-2">
            Geschoss
            <select
              aria-label="Geschoss der Transparenzpause"
              value={value.storeyId ?? ""}
              onChange={(event) => onChange({ ...value, storeyId: event.target.value })}
              className="min-w-0 rounded border bg-background p-1"
            >
              {others.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            Deckkraft {Math.round(value.opacity * 100)} %
            <input
              type="range"
              aria-label="Deckkraft der Transparenzpause"
              min={10}
              max={80}
              step={5}
              value={Math.round(value.opacity * 100)}
              onChange={(event) =>
                onChange({ ...value, opacity: Number(event.target.value) / 100 })
              }
              className="w-28"
            />
          </label>
          <div className="flex items-center justify-between gap-2">
            Farbe
            <div className="flex items-center gap-1">
              {TRACING_COLORS.map(([color, name]) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Farbe ${name}`}
                  aria-pressed={value.color === color}
                  title={name}
                  onClick={() => onChange({ ...value, color })}
                  className="h-4 w-4 rounded-full border-2"
                  style={{
                    background: color,
                    borderColor: value.color === color ? "var(--foreground)" : "transparent",
                  }}
                />
              ))}
              <input
                type="color"
                aria-label="Eigene Farbe der Transparenzpause"
                title="Eigene Farbe"
                value={value.color}
                onChange={(event) => onChange({ ...value, color: event.target.value })}
                className={`h-5 w-6 cursor-pointer rounded border ${known ? "" : "ring-2 ring-foreground"}`}
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.snap}
              onChange={(event) => onChange({ ...value, snap: event.target.checked })}
            />
            Fang an der Pause (Wände, Stützen)
          </label>
        </>
      )}
    </section>
  );
}
