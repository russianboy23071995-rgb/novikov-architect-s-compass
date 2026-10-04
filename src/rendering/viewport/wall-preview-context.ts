import type { Project, Point } from "../../lib/bim/model.ts";
import type { ProjectionState } from "./projection-state.ts";
import { createWallPointCandidates } from "./wall-point-candidates.ts";
import { sameReference } from "../../constraints/inference/hover-reference.ts";
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
  const sourceQuery = (cursor: Point, _scale: number, radius: number): SnapReference[] => {
    if (!projection || !adapter || plane?.status !== "ok") return [];
    const screen = plane.value.toScreen(cursor);
    if (screen.status !== "ok") return [];
    const result = adapter.query(project, projection, screen.value, radius);
    if (result.status !== "ok") return [];
    return result.candidates
      .filter((c) => c.visibility === "visible")
      .map((c) => {
        const reference = { ...c.reference };
        delete reference.segment;
        return reference;
      });
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
      sourceQuery(reference.point, 1, 0.001).some((r) => sameReference(r, reference)),
  };
  return { adapter, plane, context };
}
