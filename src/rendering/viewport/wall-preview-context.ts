import {
  prepareViewportModel,
  viewportModel,
  type PreparedViewportModel,
} from "./prepared-model.ts";
import { wallBase } from "../../domain/elements/wall/heights.ts";
import { createMovementOriginQuery, movementCorners } from "./movement-origin.ts";
import { buildBuildingSolid } from "../../lib/bim/geometry.ts";
import { visibleSurfaces } from "./layer-display.ts";
import { classifyAnchorVisibility } from "./anchor-visibility.ts";
import { workingStoreyElevation } from "../../domain/storeys/elevation.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { isLayerVisible } from "../../application/layers/visibility.ts";
import type { LayerVisibilityPolicy } from "../../application/layers/visibility.ts";
import type { Project, Point } from "../../lib/bim/model.ts";
import type { ProjectionState } from "./projection-state.ts";
import { createWallPointCandidates } from "./wall-point-candidates.ts";
import {
  referenceKey,
  withConstructionReferences,
} from "../../constraints/inference/construction-reference.ts";
import { getLocalSnapSources } from "../../application/snapping/local-sources.ts";
import type { HoverContext } from "../../constraints/inference/hover-reference.ts";
import type { SnapReference } from "../../constraints/snapping/engine.ts";
import type { ToolSnapPolicy } from "../../application/tools/snapping.ts";
import { getWallFootSources } from "./wall-foot-sources.ts";

/** Visible-only footpoint policy, separate from the shared acquisition state machine. */
export function createWallPreviewContext(
  project: Project,
  projection: ProjectionState | null,
  enabled: boolean,
  resetKey: number,
  policy: ToolSnapPolicy | null = null,
  movingWallId?: string,
  visibility?: LayerVisibilityPolicy,
  workplaneHeight?: number,
  prepared?: PreparedViewportModel,
) {
  const basis = prepared ?? prepareViewportModel(project);
  const model = viewportModel(project, basis);
  const adapter = projection
    ? createWallPointCandidates(project, projection, movingWallId, visibility, basis)
    : null;
  const elevation = workplaneHeight ?? workingStoreyElevation(model);
  const plane = projection?.workplane(elevation);
  if (workplaneHeight !== undefined && workplaneHeight !== workingStoreyElevation(model)) {
    const allows = (id: string) => id !== movingWallId && isLayerVisible(project, visibility, id);
    const solid = visibleSurfaces(buildBuildingSolid(model), allows);
    const query = projection ? createMovementOriginQuery(project, projection, allows, basis) : null;
    const references: SnapReference[] = movementCorners(model)
      .filter((c) => allows(c.id) && Math.abs(c.point[2] - elevation) < 1e-8)
      .map((c) => ({
        entityId: c.id,
        feature: `spatial-corner:${JSON.stringify(c.point)}`,
        point: { x: c.point[0], y: c.point[1] },
      }));
    const lookup = new Map(references.map((r) => [referenceKey(r), r]));
    const isOrigin = (r: SnapReference) =>
      !!policy?.origin && referenceKey(r) === referenceKey(policy.origin);
    const valid = (r: SnapReference): boolean =>
      isOrigin(r) || (!!lookup.has(referenceKey(r)) && (!policy || policy.sources([r]).length > 0));
    const visible = (p: Point) =>
      classifyAnchorVisibility(solid, projection, [p.x, p.y, elevation]) === "visible";
    const context: HoverContext = {
      enabled,
      sessionKey: policy ?? project,
      resetKey,
      pinnedReferences: policy?.origin ? [policy.origin] : [],
      references: [],
      pixelsPerMetre: 1,
      ...(plane?.status === "ok" ? { metric: plane.value.metric } : {}),
      suspended: !projection || plane?.status !== "ok",
      sourceQuery: (cursor, _scale, radius, active = []) => {
        if (plane?.status !== "ok" || !query) return [];
        const screen = plane.value.toScreen(cursor);
        const hit = screen.status === "ok" ? query(screen.value, radius, elevation) : null;
        const local = hit
          ? lookup.get(
              JSON.stringify([
                hit.id,
                `spatial-corner:${JSON.stringify(hit.point)}`,
                hit.point[0],
                hit.point[1],
              ]),
            )
          : null;
        return withConstructionReferences(
          [
            ...active.filter(valid),
            ...(local && valid(local) ? [local] : []),
            ...(policy?.origin ? [policy.origin] : []),
          ],
          active.filter(valid),
        );
      },
      acceptReference: (r) => isOrigin(r) || (valid(r) && visible(r.point)),
      acceptCandidate: (c) => visible(c.worldPoint),
    };
    return { adapter, plane, context };
  }
  const sources = getLocalSnapSources(model);
  const edges = getWallFootSources(model);
  const wallIds = new Set(
    storeyOf(model)
      .walls.filter((w) => wallBase(w) === 0 && isLayerVisible(project, visibility, w.id))
      .map((w) => w.id),
  );
  const pointOnly = (source: SnapReference) => {
    const result = { ...source };
    delete result.segment;
    return result;
  };
  const isOrigin = (r: SnapReference) =>
    !!policy?.origin && referenceKey(r) === referenceKey(policy.origin);
  const original = (r: SnapReference) =>
    isOrigin(r)
      ? (policy!.origin ?? undefined)
      : !r.dependencies && wallIds.has(r.entityId) && (!policy || policy.sources([r]).length > 0)
        ? (sources.lookup(referenceKey(r)) ?? edges.lookup(referenceKey(r)))
        : undefined;
  const valid = (r: SnapReference): boolean =>
    r.dependencies
      ? r.entityId === "@construction" &&
        r.dependencies.length > 0 &&
        r.dependencies.every((d) => !!original(d))
      : !!original(r);
  const sourceQuery = (
    cursor: Point,
    _scale: number,
    radius: number,
    active: readonly SnapReference[] = [],
  ): SnapReference[] => {
    if (
      (visibility && !visibility.isCurrent(project, visibility.context)) ||
      !projection ||
      !adapter ||
      plane?.status !== "ok"
    )
      return [];
    const screen = plane.value.toScreen(cursor);
    if (screen.status !== "ok") return [];
    const result = adapter.query(project, projection, screen.value, radius);
    if (result.status !== "ok") return [];
    const local = result.candidates
      .filter((c) => c.visibility === "visible" && valid(c.reference))
      .map((c) => pointOnly(c.reference));
    const axes = policy
      ? sources.queryPrimitives(
          cursor,
          plane.value.metric,
          radius,
          (r) => r.entityId !== movingWallId && r.feature.startsWith("axis-midpoint:") && valid(r),
        ).segments
      : [];
    const segments = [
      ...axes,
      ...edges.queryPrimitives(
        cursor,
        plane.value.metric,
        radius,
        (r) => r.entityId !== movingWallId && valid(r),
      ).segments,
    ]
      .map((s) => s.source)
      .filter((r) => {
        const hit = plane.value.metric.projectSegment(cursor, r.segment!.start, r.segment!.end);
        if (!hit || hit.t < 0 || hit.t > 1) return false;
        const { start, end } = r.segment!;
        const point = {
          x: start.x + hit.t * (end.x - start.x),
          y: start.y + hit.t * (end.y - start.y),
        };
        return (
          adapter.visibilityAt(point) === "visible" && adapter.visibilityAt(r.point) === "visible"
        );
      });
    // Remote active origins and flattened dependencies validate construction references.
    // They are not limited to the local cursor radius; view filtering happens before ranking.
    const leaves = active
      .filter(valid)
      .flatMap((r) => r.dependencies ?? [r])
      .map(original)
      .filter((r) => r !== undefined)
      .map(pointOnly);
    const base = [
      ...new Map(
        [...leaves, ...local, ...segments, ...(policy?.origin ? [policy.origin] : [])].map((r) => [
          referenceKey(r),
          r,
        ]),
      ).values(),
    ];
    return withConstructionReferences(base, active.filter(valid));
  };
  const context: HoverContext = {
    enabled,
    sessionKey: policy ?? project,
    pinnedReferences: policy?.origin ? [policy.origin] : [],
    resetKey,
    references: [],
    pixelsPerMetre: 1,
    ...(plane?.status === "ok" ? { metric: plane.value.metric } : {}),
    suspended: !projection || plane?.status !== "ok",
    sourceQuery,
    acceptReference: (reference) =>
      isOrigin(reference) ||
      (valid(reference) && adapter?.visibilityAt(reference.point) === "visible"),
    acceptCandidate: (candidate) => adapter?.visibilityAt(candidate.worldPoint) === "visible",
  };
  return { adapter, plane, context };
}
