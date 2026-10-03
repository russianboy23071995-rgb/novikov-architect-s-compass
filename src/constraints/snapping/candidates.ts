import { intersectLines } from "../../geometry/intersections/lines.ts";
import { cursorGuide } from "../guides/directions.ts";
import { withConstructionReferences } from "../inference/construction-reference.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import { projectDirection, angle45Direction } from "../../geometry/projections/direction.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
import type { SnapCandidate, SnapContext, SnapReference } from "./engine.ts";
import type { RankedSnap } from "./ranking.ts";

type ActiveSource = { source: SnapReference; activation: number };
type Constrain = (point: Point2) => Point2;
const key = (r: SnapReference) => JSON.stringify([r.entityId, r.feature, r.point.x, r.point.y]);
const finite = (r: SnapReference) => Number.isFinite(r.point.x) && Number.isFinite(r.point.y);
const distance = (a: Point2, b: Point2, c: SnapContext) =>
  Math.hypot(a.x - b.x, a.y - b.y) * c.pixelsPerMetre;

/** One exact source-validation pass. Coordinates here identify a snapshot, not tolerance. */
function activeSources(context: SnapContext): ActiveSource[] {
  const sources = new Map(context.references.filter(finite).map((r) => [key(r), r]));
  const active = new Map<string, ActiveSource>();
  // The ordered list is authoritative; the legacy single source is its API fallback.
  const requested = context.activeReferences?.length
    ? context.activeReferences
    : [context.activeReference];
  requested.forEach((r, activation) => {
    if (!r || !finite(r)) return;
    const id = key(r),
      source = sources.get(id);
    if (source) active.set(id, { source, activation });
  });
  return [...active.values()];
}

function ranked(candidate: SnapCandidate, sources: readonly ActiveSource[]): RankedSnap {
  return {
    candidate,
    activations: sources.map((s) => s.activation).sort((a, b) => b - a),
    sources: sources.map((s) => [s.source.entityId, s.source.feature] as const),
  };
}

function endpointCandidates(
  cursor: Point2,
  context: SnapContext,
  constrain: Constrain,
  active: readonly ActiveSource[],
): RankedSnap[] {
  const activations = new Map(active.map((a) => [key(a.source), a.activation]));
  const result: RankedSnap[] = [];
  for (const source of context.references) {
    if (!finite(source) || !pointsCompatible(source.point, constrain(source.point))) continue;
    const d = distance(source.point, cursor, context);
    if (d > context.endpointRadiusPx) continue;
    result.push(
      ranked(
        {
          kind: "endpoint",
          worldPoint: { ...source.point },
          distanceOnScreen: d,
          sourceEntityId: source.entityId,
          sourceFeature: source.feature,
          ...(source.dependencies ? { sourceReferences: [source] } : {}),
          priority: 0,
        },
        [{ source, activation: activations.get(key(source)) ?? -1 }],
      ),
    );
  }
  return result;
}

function guideCandidates(
  cursor: Point2,
  context: SnapContext,
  constrain: Constrain,
  active: readonly ActiveSource[],
): RankedSnap[] {
  const result: RankedSnap[] = [];
  for (const ref of active) {
    const source = ref.source,
      p = source.point;
    if (distance(cursor, p, context) <= context.endpointRadiusPx) continue;
    const directions: { kind: SnapCandidate["kind"]; vector: Point2 }[] = [
      ...(source.directions ?? []).flatMap((vector) => [
        { kind: "extension" as const, vector },
        { kind: "perpendicular" as const, vector: { x: -vector.y, y: vector.x } },
      ]),
      { kind: "horizontal", vector: { x: 1, y: 0 } },
      { kind: "vertical", vector: { x: 0, y: 1 } },
      { kind: "angle", vector: { x: 1, y: 1 } },
      { kind: "angle", vector: { x: 1, y: -1 } },
    ];
    for (const { kind, vector } of directions) {
      const point = projectDirection(cursor, p, vector);
      if (!point || !pointsCompatible(point, constrain(point))) continue;
      const d = distance(point, cursor, context);
      if (d > context.endpointRadiusPx) continue;
      result.push(
        ranked(
          {
            kind,
            worldPoint: point,
            guideOrigin: p,
            distanceOnScreen: d,
            sourceEntityId: source.entityId,
            sourceFeature: source.feature,
            priority: 1,
            ...(kind === "angle" ? { angleDegrees: angle45Direction(point, p).degrees } : {}),
          },
          [ref],
        ),
      );
    }
  }
  return result;
}

function intersectionCandidates(
  cursor: Point2,
  context: SnapContext,
  constrain: Constrain,
  active: readonly ActiveSource[],
): RankedSnap[] {
  const result: RankedSnap[] = [];
  for (const a of active)
    for (const b of active) {
      if (a === b) continue;
      const ga = cursorGuide(cursor, a.source),
        gb = cursorGuide(cursor, b.source);
      // Preserve horizontal/vertical origin roles; other pairs use stable source order.
      const hv = ga.direction.y === 0 && gb.direction.x === 0;
      const vh = ga.direction.x === 0 && gb.direction.y === 0;
      if (vh || (!hv && key(a.source) > key(b.source))) continue;
      const point = intersectLines(ga.origin, ga.direction, gb.origin, gb.direction);
      if (!point) continue;
      if (!pointsCompatible(point, constrain(point))) continue;
      const d = distance(point, cursor, context);
      if (d > context.endpointRadiusPx) continue;
      result.push(
        ranked(
          {
            kind: "intersection",
            sourceReferences: [a.source, b.source],
            worldPoint: point,
            guideOrigin: a.source.point,
            secondaryGuideOrigin: b.source.point,
            distanceOnScreen: d,
            priority: 0.5,
            sourceEntityId: a.source.entityId,
            sourceFeature: a.source.feature + "/" + b.source.entityId + "/" + b.source.feature,
          },
          [a, b],
        ),
      );
    }
  return result;
}

/** Generate all existing non-grid candidates; never recursively query the engine. */
export function collectSnapCandidates(
  cursor: Point2,
  context: SnapContext,
  constrain: Constrain,
): RankedSnap[] {
  context = {
    ...context,
    references: withConstructionReferences(
      context.references,
      context.activeReferences ?? (context.activeReference ? [context.activeReference] : []),
    ),
  };
  const active = activeSources(context);
  return [
    ...endpointCandidates(cursor, context, constrain, active),
    ...guideCandidates(cursor, context, constrain, active),
    ...intersectionCandidates(cursor, context, constrain, active),
  ];
}

/** The grid is an unconditional fallback, including an unlabelled Ortho projection. */
export function gridSnap(
  cursor: Point2,
  context: SnapContext,
  constrain: Constrain,
): { point: Point2; candidate: SnapCandidate | null } {
  const spacing = context.gridSpacing;
  if (spacing === null) return { point: constrain(cursor), candidate: null };
  const grid = {
    x: Math.round(cursor.x / spacing) * spacing,
    y: Math.round(cursor.y / spacing) * spacing,
  };
  const projected = constrain(grid),
    compatible = pointsCompatible(grid, projected);
  const point = compatible ? grid : projected;
  return {
    point,
    candidate: compatible
      ? {
          kind: "grid",
          worldPoint: point,
          distanceOnScreen: distance(point, cursor, context),
          sourceEntityId: null,
          sourceFeature: "grid",
          priority: 2,
        }
      : null,
  };
}
