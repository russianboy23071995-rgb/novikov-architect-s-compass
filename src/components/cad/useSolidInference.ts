import { useMemo } from "react";
import type { Project, Point } from "@/lib/bim/model";
import type { ProjectionState } from "@/rendering/viewport/projection-state";
import { createWallPreviewContext } from "@/rendering/viewport/wall-preview-context";
import type { ToolSnapPolicy } from "@/application/tools/snapping";
import { resolveToolSnap } from "@/application/tools/snapping";
import { advanceGuideDirections } from "@/constraints/guides/directions";
import { DEFAULT_HOVER_DWELL_MS } from "@/constraints/inference/hover-reference";
import { useHoverReference } from "./useHoverReference";

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
) {
  const { plane, context, adapter } = useMemo(
    () => createWallPreviewContext(project, projection, enabled, resetKey, policy, movingWallId),
    [project, projection, enabled, resetKey, policy, movingWallId],
  );
  const cursor = useMemo(() => {
    if (!client || plane?.status !== "ok") return null;
    const inverse = plane.value.toPlane(client);
    return inverse.status === "ok" ? inverse.value.point : null;
  }, [client, plane]);
  const hover = useHoverReference(cursor, context, DEFAULT_HOVER_DWELL_MS);
  const resolve = (position: Point, shift = false) => {
    if (plane?.status !== "ok") return null;
    const inverse = plane.value.toPlane(position);
    if (inverse.status !== "ok") return null;
    const active = hover.references.filter((r) => context.acceptReference!(r));
    return resolveToolSnap(
      policy,
      inverse.value.point,
      {
        ...context,
        activeReferences: active,
        guideDirections: advanceGuideDirections(inverse.value.point, active, hover.guideDirections),
        endpointRadiusPx: 10,
        gridSpacing: null,
      },
      { ortho, shift, featureSnap: enabled },
    );
  };
  return {
    plane,
    context,
    adapter,
    hover,
    resolve,
    candidate: client ? (resolve(client, shift)?.candidate ?? null) : null,
  };
}
