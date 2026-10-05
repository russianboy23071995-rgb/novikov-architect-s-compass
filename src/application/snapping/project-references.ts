import { wallBody } from "../../domain/elements/wall/body.ts";
import type { Project } from "../../lib/bim/model.ts";
import type { SnapReference } from "../../constraints/snapping/engine.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import { segmentMidpoint } from "../../geometry/primitives/segment.ts";
import { segmentIntersectionReferences } from "../../constraints/snapping/segment-references.ts";
import type { SnapSegment } from "../../constraints/snapping/segment-references.ts";

// Project snapshots are immutable. Weak keys do not retain discarded projects/history.
// Keep tool filtering and temporary construction origins out of this model-only cache.
const referenceCache = new WeakMap<Project, readonly SnapReference[]>();
/** Interpret only the wall endpoint features emitted below; midpoints are not editable grips. */
export function wallEndpointIndex(feature: string): 0 | 1 | null {
  if (["axis-start", "corner-0--1", "corner-0-1"].includes(feature)) return 0;
  if (["axis-end", "corner-1--1", "corner-1-1"].includes(feature)) return 1;
  return null;
}

export function getProjectSnapReferences(project: Project): readonly SnapReference[] {
  let references = referenceCache.get(project);
  if (!references) {
    references = Object.freeze(projectSnapReferences(project));
    referenceCache.set(project, references);
  }
  return references;
}

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
          // Include the source segment snapshot: a rotation about its centre must invalidate tracking too.
          feature: `${feature}:${JSON.stringify([a.x, a.y, b.x, b.y])}`,
          directions: [{ x: b.x - a.x, y: b.y - a.y }],
        },
      ]
    : [];
}

/** Disposable references derived from the authoritative model. Wall endpoints mean axis ends. */
export function projectSnapReferences(project: Project): SnapReference[] {
  const { references, segments } = projectSnapPrimitives(project);
  return [...references, ...segmentIntersectionReferences(segments)];
}

/** No intersection enumeration; shared primitive adapter for old and local query paths. */
export function projectSnapPrimitives(project: Project) {
  const segments: SnapSegment[] = [];
  const midpoint = (id: string, feature: string, start: Point2, end: Point2) => {
    const refs = midpointReference(id, feature, start, end);
    if (refs[0]) segments.push({ start: { ...start }, end: { ...end }, source: refs[0] });
    return refs;
  };
  const references: SnapReference[] = [
    ...project.storey.walls.flatMap((wall) => {
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
            point: body.corner(index, side),
            entityId: wall.id,
            feature: `corner-${index}-${side}`,
            directions: [d],
          })),
        ]),
        ...midpoint(wall.id, "axis-midpoint", wall.start, wall.end),
      ];
    }),
    ...project.storey.hatches.flatMap((hatch) =>
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
          midpoint(line.id, `segment-${index}-midpoint`, line.points[index]!, point),
        ),
    ]),
  ];
  return { references, segments };
}
