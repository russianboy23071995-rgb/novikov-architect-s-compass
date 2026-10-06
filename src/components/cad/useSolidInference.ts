import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import { useMemo } from "react";
import type { Project, Point } from "@/lib/bim/model";
import type { ProjectionState } from "@/rendering/viewport/projection-state";
import { createWallPreviewContext } from "@/rendering/viewport/wall-preview-context";
import type { ToolSnapPolicy } from "@/application/tools/snapping";
import { useShiftSnapLock } from "./useShiftSnapLock";
import { advanceGuideDirections } from "@/constraints/guides/directions";
import { DEFAULT_HOVER_DWELL_MS } from "@/constraints/inference/hover-reference";
import { useHoverReference } from "./useHoverReference";
import { hoveredSegment, withParallelDirections } from "@/constraints/inference/segment-hover";

/** One viewport adapter for passive inference and tool targeting on the same workplane. */
export function useSolidInference(
  project: Project,
  projection: ProjectionState | null,
  client: Point | null,
  enabled: boolean,
  resetKey: number,
  policy: ToolSnapPolicy | null,
  movingWallId: string | undefined,
  ortho: boolean,
  shift: boolean,
  visibility?: LayerVisibilityPolicy,
  gridSpacing: number | null = null,
) {
  const sessionKey = useMemo(
    () => ({ policy, project, visibility }),
    [policy, project, visibility],
  );
  const {
    plane,
    context: baseContext,
    adapter,
  } = useMemo(
    () =>
      createWallPreviewContext(
        project,
        projection,
        enabled,
        resetKey,
        policy,
        movingWallId,
        visibility,
      ),
    [project, projection, enabled, resetKey, policy, movingWallId, visibility],
  );
  const context = useMemo(() => ({ ...baseContext, sessionKey }), [baseContext, sessionKey]);
  const cursor = useMemo(() => {
    if (!client || plane?.status !== "ok") return null;
    const inverse = plane.value.toPlane(client);
    return inverse.status === "ok" ? inverse.value.point : null;
  }, [client, plane]);
  const hover = useHoverReference(cursor, context, DEFAULT_HOVER_DWELL_MS);
  const active = withParallelDirections(
    hover.references.filter((r) => context.acceptReference!(r)),
  );
  const edge =
    cursor && context.metric
      ? hoveredSegment(
          cursor,
          context.sourceQuery!(cursor, 1, 10, hover.references),
          context.metric,
        )
      : null;
  const resolveLockedSnap = useShiftSnapLock(sessionKey, resetKey);
  const resolve = (position: Point, shift = false) => {
    if (plane?.status !== "ok") return null;
    const inverse = plane.value.toPlane(position);
    if (inverse.status !== "ok") return null;
    return resolveLockedSnap(
      policy,
      inverse.value.point,
      {
        ...context,
        activeReferences: active,
        guideDirections: advanceGuideDirections(inverse.value.point, active, hover.guideDirections),
        endpointRadiusPx: 10,
        gridSpacing,
      },
      { ortho, shift, featureSnap: enabled },
    );
  };
  return {
    plane,
    context,
    adapter,
    edge,
    hover: {
      ...hover,
      references: active,
      guideDirections: hover.guideCursor
        ? advanceGuideDirections(hover.guideCursor, active, hover.guideDirections)
        : [],
    },
    resolve,
    candidate: client ? (resolve(client, shift)?.candidate ?? null) : null,
  };
}
