import { horizontalAxisDegrees, selectionMovementAxes } from "@/application/input/movement-axes";
import type { Project } from "@/domain/project/schema";
import type { SelectionSet } from "@/application/selection/state";
/** Presentation only: writes direction into the existing shared precision input. */
export function MovementAxisControls({
  project,
  targets,
  onDirection,
  onZ,
}: {
  project: Project;
  targets: SelectionSet;
  onDirection: (degrees: string) => void;
  onZ?: (() => void) | undefined;
}) {
  return (
    <div
      role="group"
      aria-label="Bewegungsachsen"
      className="absolute left-3 top-20 z-30 flex flex-wrap gap-1 rounded border bg-popover/95 p-1 text-xs"
    >
      <button className="rounded px-2 py-1 hover:bg-muted" onClick={() => onDirection("")}>
        Frei XY
      </button>
      {selectionMovementAxes(project, targets)
        .flatMap((a) =>
          a.direction[2] !== 0
            ? [a]
            : [
                a,
                {
                  ...a,
                  id: a.id + "-reverse",
                  label: "−" + a.label,
                  direction: a.direction.map((n) => -n) as [number, number, number],
                },
              ],
        )
        .map((axis) => (
          <button
            key={axis.id}
            disabled={axis.direction[2] !== 0 && !onZ}
            title={
              axis.direction[2] !== 0
                ? "Z: Auswahl vertikal bewegen"
                : `Richtung ${axis.label} festhalten`
            }
            className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40"
            onClick={() =>
              axis.direction[2] !== 0 ? onZ?.() : onDirection(String(horizontalAxisDegrees(axis)))
            }
          >
            {axis.label}
          </button>
        ))}
    </div>
  );
}
