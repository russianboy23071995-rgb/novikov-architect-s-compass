import {
  WALL_RENOVATIONS,
  WALL_RENOVATION_COLORS,
  WALL_RENOVATION_LABELS,
  type WallRenovation,
} from "@/domain/elements/wall/renovation";

/** Reiter „Bauzustand“ of the wall tool and of a wall element (docs/BAUZUSTAND.md). */
export function WallRenovationFields({
  value,
  onChange,
  hint,
}: {
  value: WallRenovation;
  onChange: (value: WallRenovation) => void;
  hint: string;
}) {
  return (
    <section aria-label="Bauzustand" className="space-y-3 text-sm">
      <div role="radiogroup" aria-label="Bauzustand der Wand" className="grid gap-2">
        {WALL_RENOVATIONS.map((status) => (
          <label key={status} className="flex items-center gap-2">
            <input
              type="radio"
              name="wall-renovation"
              value={status}
              checked={value === status}
              onChange={() => onChange(status)}
            />
            <span
              aria-hidden
              className="inline-block h-3 w-6 rounded-sm border"
              style={{
                background:
                  status === "existing"
                    ? "var(--muted-foreground)"
                    : WALL_RENOVATION_COLORS[status],
                opacity: status === "existing" ? 0.55 : 1,
              }}
            />
            {WALL_RENOVATION_LABELS[status]}
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </section>
  );
}
