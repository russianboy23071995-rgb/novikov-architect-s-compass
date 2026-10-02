import type { Project } from "../../lib/bim/model.ts";
import type { SnapReference } from "../../constraints/snapping/engine.ts";

/** Disposable references derived from the authoritative model. Wall endpoints mean axis ends. */
export function projectSnapReferences(project: Project): SnapReference[] {
  return [
    ...project.storey.walls.flatMap((wall) => {
      const d = { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y };
      const length = Math.hypot(d.x, d.y);
      const normal = {
        x: ((-d.y / length) * wall.thickness) / 2,
        y: ((d.x / length) * wall.thickness) / 2,
      };
      return [wall.start, wall.end].flatMap((point, index) => [
        {
          point: { ...point },
          entityId: wall.id,
          feature: index === 0 ? "axis-start" : "axis-end",
          directions: [d],
        },
        ...[-1, 1].map((side) => ({
          point: { x: point.x + side * normal.x, y: point.y + side * normal.y },
          entityId: wall.id,
          feature: `corner-${index}-${side}`,
          directions: [d],
        })),
      ]);
    }),
    ...(project.storey.lines ?? []).flatMap((line) =>
      line.points.map((point, index) => ({
        point: { ...point },
        entityId: line.id,
        feature: `vertex-${index}`,
        directions: [line.points[index - 1], line.points[index + 1]]
          .filter((p) => p !== undefined)
          .map((p) => ({ x: p.x - point.x, y: p.y - point.y })),
      })),
    ),
  ];
}
