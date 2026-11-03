import { useState } from "react";
import { ELEMENT_KINDS } from "@/domain/elements/registry";
import { slabOpeningArea, type SlabOpening } from "@/domain/elements/slab/opening";
import { updateSlabOpening } from "@/application/slabs/openings";
import type { Project } from "@/domain/project/schema";
import { Input } from "@/components/ui/input";
import { PropertyForm } from "./PropertyForm";
import type { Selection } from "./bim-view";

const metres = (value: number) =>
  value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 3 });

/** Axis-parallel rectangle as its lower left corner and size, else null. */
function rectangleOf(points: SlabOpening["points"]) {
  if (points?.length !== 4) return null;
  const xs = [...new Set(points.map((p) => p.x))],
    ys = [...new Set(points.map((p) => p.y))];
  if (xs.length !== 2 || ys.length !== 2) return null;
  const x = Math.min(...xs),
    y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, depth: Math.max(...ys) - y };
}

/**
 * Deckendurchbruch in the shared properties bar (docs/DECKENDURCHBRUCH.md). A rectangle along
 * the axes takes a new width and depth from its lower left corner; other outlines are edited at
 * their corners in the plan; a round opening takes a new diameter. Every change runs the shared
 * action, which keeps it in its slab.
 */
export function SlabOpeningProperties({
  project,
  opening,
  selection,
  onChange,
}: {
  project: Project;
  opening: SlabOpening;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
}) {
  const [error, setError] = useState("");
  const rectangle = rectangleOf(opening.points);
  return (
    <section className="flex flex-wrap items-end gap-x-4 gap-y-2" aria-label="Element properties">
      <h2 className="text-sm font-semibold">{ELEMENT_KINDS.slabOpening.label}</h2>
      <p className="max-w-48 truncate font-mono text-[10px] text-muted-foreground">{opening.id}</p>
      <p className="text-xs text-muted-foreground" aria-label="Durchbruchwerte">
        {`In Decke ${opening.slabId} · Fläche ${metres(slabOpeningArea(opening))} m²`}
        {rectangle ? ` · ${metres(rectangle.width)} × ${metres(rectangle.depth)} m` : ""}
        {opening.circle ? ` · ø ${metres(opening.circle.diameter)} m` : ""}
      </p>
      {opening.circle && (
        <PropertyForm
          key={`${opening.circle.center.x},${opening.circle.center.y},${opening.circle.diameter}`}
          onSubmit={(event) => {
            event.preventDefault();
            const raw = new FormData(event.currentTarget).get("diameter");
            const diameter = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
            try {
              if (!(diameter > 0)) throw new Error("size");
              onChange(
                updateSlabOpening(project, opening.id, {
                  circle: { ...opening.circle!, diameter },
                }),
                selection,
              );
              setError("");
            } catch (e) {
              setError(
                e instanceof Error && e.message !== "size" && !e.message.startsWith("[")
                  ? `Nicht übernommen: ${e.message}`
                  : "Nicht übernommen: Durchmesser größer als null, ganz in der Decke.",
              );
            }
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="block text-xs">
            Durchmesser (m)
            <Input
              name="diameter"
              type="number"
              step="any"
              required
              defaultValue={opening.circle.diameter}
              className="mt-1 h-8 w-28"
            />
          </label>
        </PropertyForm>
      )}
      {rectangle && (
        <PropertyForm
          key={opening.points!.map((p) => `${p.x},${p.y}`).join(";")}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const number = (name: string) => {
              const raw = data.get(name);
              return typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
            };
            const width = number("width"),
              depth = number("depth");
            try {
              if (!(width > 0) || !(depth > 0)) throw new Error("size");
              const { x, y } = rectangle;
              onChange(
                updateSlabOpening(project, opening.id, {
                  points: [
                    { x, y },
                    { x: x + width, y },
                    { x: x + width, y: y + depth },
                    { x, y: y + depth },
                  ],
                }),
                selection,
              );
              setError("");
            } catch (e) {
              setError(
                e instanceof Error && e.message !== "size" && !e.message.startsWith("[")
                  ? `Nicht übernommen: ${e.message}`
                  : "Nicht übernommen: Breite und Tiefe größer als null, ganz in der Decke.",
              );
            }
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="block text-xs">
            Breite X (m)
            <Input
              name="width"
              type="number"
              step="any"
              required
              defaultValue={rectangle.width}
              className="mt-1 h-8 w-28"
            />
          </label>
          <label className="block text-xs">
            Tiefe Y (m)
            <Input
              name="depth"
              type="number"
              step="any"
              required
              defaultValue={rectangle.depth}
              className="mt-1 h-8 w-28"
            />
          </label>
        </PropertyForm>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
