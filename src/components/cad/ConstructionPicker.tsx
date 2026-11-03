import type { ReactNode } from "react";

/** Every way an area tool can construct its outline (docs/ERSTELLUNG_PIKTOGRAMME.md). */
export type ConstructionId =
  "walls" | "polygon" | "diagonal" | "side-height" | "boundary" | "circle";

function Pictogram({ children }: { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
const dot = (x: number, y: number) => <circle cx={x} cy={y} r={1.6} fill="currentColor" />;

/** Pictogram and name per construction, in the line style of the tool rail. */
export const CONSTRUCTIONS: Record<ConstructionId, { label: string; icon: ReactNode }> = {
  walls: {
    label: "Klick in Raum zwischen Wänden",
    icon: (
      <Pictogram>
        <path d="M3 4h18v16H3z" strokeWidth={2.6} />
        <path d="M11 10l2 5 1-2 2.2 2.2.9-.9L15 12.1l2-1z" fill="currentColor" strokeWidth={0.8} />
      </Pictogram>
    ),
  },
  polygon: {
    label: "Polygon per Klick (Linie zu Linie)",
    icon: (
      <Pictogram>
        <path d="M4 18l3-12 9 3 4 8z" />
        {dot(4, 18)}
        {dot(7, 6)}
        {dot(16, 9)}
        {dot(20, 17)}
      </Pictogram>
    ),
  },
  diagonal: {
    label: "Rechteck über die Diagonale",
    icon: (
      <Pictogram>
        <path d="M4 6h16v12H4z" />
        <path d="M4 18L20 6" strokeDasharray="2 2" />
        {dot(4, 18)}
        {dot(20, 6)}
      </Pictogram>
    ),
  },
  "side-height": {
    label: "Rechteck über drei Punkte (Seite und Höhe)",
    icon: (
      <Pictogram>
        <path d="M3 15l12-8 4 6-12 8z" />
        {dot(3, 15)}
        {dot(15, 7)}
        {dot(19, 13)}
      </Pictogram>
    ),
  },
  boundary: {
    label: "Geschlossene Kontur übernehmen",
    icon: (
      <Pictogram>
        <path d="M3 5l11-2 7 7-3 10-14-2z" strokeDasharray="2.5 2" />
        <path
          d="M10 9l2.2 6 1.1-2.4 2.6 2.6 1-1-2.6-2.6 2.4-1.1z"
          fill="currentColor"
          strokeWidth={0.8}
        />
      </Pictogram>
    ),
  },
  circle: {
    label: "Kreis: Mittelpunkt und Rand",
    icon: (
      <Pictogram>
        <circle cx={12} cy={12} r={8} />
        <path d="M12 12h8" strokeDasharray="2 2" />
        {dot(12, 12)}
        {dot(20, 12)}
      </Pictogram>
    ),
  },
};

/**
 * Small pictogram buttons for the construction of an area tool (user wish 03.11.2026), instead
 * of a list: one click picks the way of drawing. Shared by slab, slab opening, hatch, room and
 * roof outline, in the bar and in the settings window. A radio group: arrow keys move, the
 * picked one is pressed.
 */
export function ConstructionPicker<T extends ConstructionId>({
  label,
  options,
  value,
  onValue,
}: {
  /** Name of the group for assistive technology, e.g. „Decken-Erstellung“. */
  label: string;
  options: readonly T[];
  value: T;
  onValue: (value: T) => void;
}) {
  return (
    <div className="text-xs">
      <span className="block">Erstellung</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="mt-0.5 flex gap-0.5 rounded border bg-background p-0.5"
        onKeyDown={(event) => {
          const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
          if (!step) return;
          event.preventDefault();
          const next = options[(options.indexOf(value) + step + options.length) % options.length]!;
          onValue(next);
          (
            event.currentTarget.querySelector(`[data-construction="${next}"]`) as HTMLElement | null
          )?.focus();
        }}
      >
        {options.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            aria-label={CONSTRUCTIONS[id].label}
            title={CONSTRUCTIONS[id].label}
            data-construction={id}
            tabIndex={value === id ? 0 : -1}
            onClick={() => onValue(id)}
            className={`rounded p-1 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              value === id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
            }`}
          >
            {CONSTRUCTIONS[id].icon}
          </button>
        ))}
      </div>
    </div>
  );
}
