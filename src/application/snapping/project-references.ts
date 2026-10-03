import type { Project } from "../../lib/bim/model.ts";
import type { SnapReference } from "../../constraints/snapping/engine.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import { segmentMidpoint } from "../../geometry/primitives/segment.ts";

function midpointReference(
  entityId: string,
  feature: string,
  a: Point2,
  b: Point2,
): SnapReference[] {
  const point = segmentMidpoint(a, b);
  return point
    ? [
        {
          point,
          entityId,
          kind: "midpoint",
          // Include the source segment snapshot: a rotation about its centre must invalidate tracking too.
          feature: `${feature}:${JSON.stringify([a.x, a.y, b.x, b.y])}`,
          directions: [{ x: b.x - a.x, y: b.y - a.y }],
        },
      ]
    : [];
}

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
      return [
        ...[wall.start, wall.end].flatMap((point, index) => [
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
        ]),
        ...midpointReference(wall.id, "axis-midpoint", wall.start, wall.end),
      ];
    }),
    ...(project.storey.lines ?? []).flatMap((line) => [
      ...line.points.map((point, index) => ({
        point: { ...point },
        entityId: line.id,
        feature: `vertex-${index}`,
        directions: [line.points[index - 1], line.points[index + 1]]
          .filter((p) => p !== undefined)
          .map((p) => ({ x: p.x - point.x, y: p.y - point.y })),
      })),
      ...line.points
        .slice(1)
        .flatMap((point, index) =>
          midpointReference(line.id, `segment-${index}-midpoint`, line.points[index]!, point),
        ),
    ]),
  ];
}
