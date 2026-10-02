import type { Project } from "../../lib/bim/model.ts";
import type { SnapReference } from "../../constraints/snapping/engine.ts";

/** Disposable references derived from the authoritative model. Wall endpoints mean axis ends. */
export function projectSnapReferences(project: Project): SnapReference[] {
  return [
    ...project.storey.walls.flatMap((wall) => [
      { point: { ...wall.start }, entityId: wall.id, feature: "axis-start" },
      { point: { ...wall.end }, entityId: wall.id, feature: "axis-end" },
    ]),
    ...(project.storey.lines ?? []).flatMap((line) =>
      line.points.map((point, index) => ({
        point: { ...point },
        entityId: line.id,
        feature: `vertex-${index}`,
      })),
    ),
  ];
}
