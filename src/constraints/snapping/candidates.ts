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
    if (source)
      active.set(id, {
        source: r.parallelDirections
          ? { ...source, parallelDirections: r.parallelDirections }
          : source,
        activation,
      });
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

function pointCandidates(
  cursor: Point2,
  context: SnapContext,
  constrain: Constrain,
  active: readonly ActiveSource[],
): RankedSnap[] {
  const activations = new Map(active.map((a) => [key(a.source), a.activation]));
  const result: RankedSnap[] = [];
  for (const source of context.references) {
    if (!finite(source) || !pointsCompatible(source.point, constrain(source.point))) continue;
    const d = context.metric
      ? context.metric.distance(source.point, cursor)
      : distance(source.point, cursor, context);
    if (!Number.isFinite(d) || d < 0 || d > context.endpointRadiusPx) continue;
    result.push(
      ranked(
        {
          kind: source.kind ?? "endpoint",
          worldPoint: { ...source.point },
          distanceOnScreen: d,
          sourceEntityId: source.entityId,
          sourceFeature: source.feature,
          ...(source.dependencies ? { sourceReferences: [source] } : {}),
          priority:
            source.kind === "segment-intersection" ? 0.375 : source.kind === "midpoint" ? 0.25 : 0,
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
    const guide = cursorGuide(cursor, source, context.guideDirections);
    for (const { kind, direction: vector } of [guide]) {
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
      const ga = cursorGuide(cursor, a.source, context.guideDirections),
        gb = cursorGuide(cursor, b.source, context.guideDirections);
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

/** Intersect external guides with an explicit editing axis, never project a source point. */
function axisIntersectionCandidates(
  cursor: Point2,
  context: SnapContext,
  active: readonly ActiveSource[],
): RankedSnap[] {
  const axis = context.fixedAxis;
  if (!axis) return [];
  const result: RankedSnap[] = [];
  for (const ref of active) {
    const guide = cursorGuide(cursor, ref.source, context.guideDirections);
    const point = intersectLines(axis.origin, axis.direction, guide.origin, guide.direction);
    if (!point) continue;
    const d = distance(point, cursor, context);
    if (d > context.endpointRadiusPx) continue;
    result.push(
      ranked(
        {
          kind: "axis-intersection",
          worldPoint: point,
          distanceOnScreen: d,
          guideOrigin: guide.origin,
          secondaryGuideOrigin: axis.origin,
          sourceReferences: [ref.source],
          sourceEntityId: ref.source.entityId,
          sourceFeature: ref.source.feature,
          priority: 0.5,
        },
        [ref],
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
    ...pointCandidates(cursor, context, constrain, active),
    ...axisIntersectionCandidates(cursor, context, active),
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
