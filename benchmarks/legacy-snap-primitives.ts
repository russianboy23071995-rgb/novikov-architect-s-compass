import { storeyOf } from "../src/domain/storeys/access.ts";
import { connectedWallSolids } from "../src/domain/elements/wall/connections.ts";
import { wallBody } from "../src/domain/elements/wall/body.ts";
import type { Project } from "../src/lib/bim/model.ts";
import type { SnapReference } from "../src/constraints/snapping/engine.ts";
import type { Point2 } from "../src/geometry/primitives/point.ts";
import { segmentMidpoint } from "../src/geometry/primitives/segment.ts";
import type { SnapSegment } from "../src/constraints/snapping/segment-references.ts";

// Frozen pre-cache snap primitive builder (main 7f0cc91): full solids, no reuse. Diagnostics only.
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
          segment: { start: { ...a }, end: { ...b } },
          feature: `${feature}:${JSON.stringify([a.x, a.y, b.x, b.y])}`,
          directions: [{ x: b.x - a.x, y: b.y - a.y }],
        },
      ]
    : [];
}

export function legacySnapPrimitives(project: Project) {
  const joined = new Map(connectedWallSolids(project).map((w) => [w.wallId, w.contour]));
  const segments: SnapSegment[] = [];
  const midpoint = (id: string, feature: string, start: Point2, end: Point2) => {
    const refs = midpointReference(id, feature, start, end);
    if (refs[0]) segments.push({ start: { ...start }, end: { ...end }, source: refs[0] });
    return refs;
  };
  const references: SnapReference[] = [
    ...storeyOf(project).walls.flatMap((wall) => {
      const d = { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y };
      const body = wallBody(wall);
      return [
        ...[wall.start, wall.end].flatMap((point, index) => [
          {
            point: { ...point },
            entityId: wall.id,
            feature: index === 0 ? "axis-start" : "axis-end",
            directions: [d],
          },
          ...[-1, 1].map((side) => ({
            point:
              joined.get(wall.id)?.[index === 0 ? (side === -1 ? 0 : 3) : side === -1 ? 1 : 2] ??
              body.corner(index, side),
            entityId: wall.id,
            feature: joined.has(wall.id)
              ? `join-corner-${index}-${side}`
              : `corner-${index}-${side}`,
            directions: [d],
          })),
        ]),
        ...midpoint(wall.id, "axis-midpoint", wall.start, wall.end),
      ];
    }),
    ...storeyOf(project).hatches.flatMap((hatch) =>
      hatch.points.flatMap((point, index) => {
        const before = hatch.points[(index + hatch.points.length - 1) % hatch.points.length]!;
        const after = hatch.points[(index + 1) % hatch.points.length]!;
        return [
          {
            point: { ...point },
            entityId: hatch.id,
            feature: `vertex-${index}`,
            directions: [before, after].map((p) => ({ x: p.x - point.x, y: p.y - point.y })),
          },
          ...midpoint(hatch.id, `segment-${index}-midpoint`, point, after),
        ];
      }),
    ),
    ...(storeyOf(project).lines ?? []).flatMap((line) => [
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
          midpoint(line.id, `segment-${index}-midpoint`, line.points[index]!, point),
        ),
    ]),
  ];
  return { references, segments };
}
