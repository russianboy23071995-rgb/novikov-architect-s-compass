import { storeyOf } from "../../domain/storeys/access.ts";
import { connectedWallContours } from "../../domain/elements/wall/connections.ts";
import { isOwnedProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
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

type Part = { references: SnapReference[]; segments: SnapSegment[] };
// Parts derived from deeply frozen elements of owned snapshots. Identity fixes their content,
// so an unchanged line, hatch or wall set keeps its derived references across commits.
const elementParts = new WeakMap<object, Part>();
const wallParts = new WeakMap<object, { inputs: readonly object[]; part: Part }>();

/** Collects one element's references and the midpoint segments that point at them. */
function part(build: (midpoint: typeof midpointReference) => SnapReference[]): Part {
  const segments: SnapSegment[] = [];
  const references = build((id, feature, start, end) => {
    const refs = midpointReference(id, feature, start, end);
    if (refs[0]) segments.push({ start: { ...start }, end: { ...end }, source: refs[0] });
    return refs;
  });
  return { references, segments };
}

function remembered<T extends object>(owned: boolean, element: T, build: (e: T) => Part): Part {
  if (!owned) return build(element);
  let cached = elementParts.get(element);
  if (!cached) elementParts.set(element, (cached = build(element)));
  return cached;
}

/** No intersection enumeration; shared primitive adapter for old and local query paths. */
export function projectSnapPrimitives(project: Project) {
  const owned = isOwnedProjectSnapshot(project);
  const storey = storeyOf(project);
  const parts = [
    wallsPart(project, owned),
    ...storey.hatches.map((hatch) => remembered(owned, hatch, hatchPart)),
    ...(storey.lines ?? []).map((line) => remembered(owned, line, linePart)),
  ];
  return {
    references: parts.flatMap((p) => p.references),
    segments: parts.flatMap((p) => p.segments),
  };
}

/** Wall references depend on joined contours: reuse only for the same walls, joins, T-joins
 * and windows (contour checks read them); any other change derives all walls again.
 */
function wallsPart(project: Project, owned: boolean): Part {
  const storey = storeyOf(project);
  const inputs = [storey.walls, storey.wallJoins, storey.wallTJunctions, storey.windows];
  const cached = owned ? wallParts.get(storey.walls) : undefined;
  if (cached && cached.inputs.every((input, i) => input === inputs[i])) return cached.part;
  // Snapping needs only the joined 2D contours, not the extruded solids.
  const joined = connectedWallContours(project);
  const result = part((midpoint) =>
    storey.walls.flatMap((wall) => {
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
  );
  if (owned) wallParts.set(storey.walls, { inputs, part: result });
  return result;
}

function hatchPart(hatch: Project["storeys"][number]["hatches"][number]): Part {
  return part((midpoint) =>
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
  );
}

function linePart(line: NonNullable<Project["storeys"][number]["lines"]>[number]): Part {
  return part((midpoint) => [
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
  ]);
}
