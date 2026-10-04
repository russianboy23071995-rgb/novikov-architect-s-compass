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

/** Visible-only footpoint policy, separate from the shared acquisition state machine. */
export function createWallPreviewContext(
  project: Project,
  projection: ProjectionState | null,
  enabled: boolean,
  resetKey: number,
) {
  const adapter = projection ? createWallPointCandidates(project, projection) : null;
  const plane = projection?.workplane(0);
  const sources = getLocalSnapSources(project);
  const wallIds = new Set(project.storey.walls.map((w) => w.id));
  const pointOnly = (source: SnapReference) => {
    const result = { ...source };
    delete result.segment;
    return result;
  };
  const original = (r: SnapReference) =>
    !r.dependencies && wallIds.has(r.entityId) ? sources.lookup(referenceKey(r)) : undefined;
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
    if (!projection || !adapter || plane?.status !== "ok") return [];
    const screen = plane.value.toScreen(cursor);
    if (screen.status !== "ok") return [];
    const result = adapter.query(project, projection, screen.value, radius);
    if (result.status !== "ok") return [];
    const local = result.candidates
      .filter((c) => c.visibility === "visible")
      .map((c) => pointOnly(c.reference));
    // Remote active origins and flattened dependencies validate construction references.
    // They are not limited to the local cursor radius; view filtering happens before ranking.
    const leaves = active
      .filter(valid)
      .flatMap((r) => r.dependencies ?? [r])
      .map(original)
      .filter((r) => r !== undefined)
      .map(pointOnly);
    const base = [...new Map([...local, ...leaves].map((r) => [referenceKey(r), r])).values()];
    return withConstructionReferences(base, active.filter(valid));
  };
  const context: HoverContext = {
    enabled,
    sessionKey: project,
    resetKey,
    references: [],
    pixelsPerMetre: 1,
    ...(plane?.status === "ok" ? { metric: plane.value.metric } : {}),
    suspended: !projection || plane?.status !== "ok",
    sourceQuery,
    acceptReference: (reference) =>
      valid(reference) && adapter?.visibilityAt(reference.point) === "visible",
    acceptCandidate: (candidate) => adapter?.visibilityAt(candidate.worldPoint) === "visible",
  };
  return { adapter, plane, context };
}
