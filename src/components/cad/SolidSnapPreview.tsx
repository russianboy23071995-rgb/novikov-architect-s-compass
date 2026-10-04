import { useMemo } from "react";
import type { Project, Point } from "@/lib/bim/model";
import type { ProjectionState } from "@/rendering/viewport/projection-state";
import { createWallPreviewContext } from "@/rendering/viewport/wall-preview-context";
import { useHoverReference } from "./useHoverReference";
import { DEFAULT_HOVER_DWELL_MS } from "@/constraints/inference/hover-reference";

import type { SnapReference } from "@/constraints/snapping/engine";
import { querySnap } from "@/constraints/snapping/engine";

/** Presentation adapter only: shared source search, ranking, dwell and guide directions. */
export function SolidSnapPreview({
  project,
  projection,
  client,
  enabled,
  resetKey,
}: {
  project: Project;
  projection: ProjectionState | null;
  client: Point | null;
  enabled: boolean;
  resetKey: number;
}) {
  const { plane, context } = useMemo(
    () => createWallPreviewContext(project, projection, enabled, resetKey),
    [project, projection, enabled, resetKey],
  );
  const cursor = useMemo(() => {
    if (!client || plane?.status !== "ok") return null;
    const inverse = plane.value.toPlane(client);
    return inverse.status === "ok" ? inverse.value.point : null;
  }, [client, plane]);
  const hover = useHoverReference(cursor, context, DEFAULT_HOVER_DWELL_MS);
  if (!enabled || !projection) return null;
  if (plane?.status !== "ok")
    return (
      <p className="pointer-events-none absolute bottom-2 left-2 text-xs" role="status">
        Arbeitsebene aus diesem Blick nicht eindeutig
      </p>
    );
  const resolved = cursor
    ? querySnap(cursor, {
        ...context,
        activeReferences: hover.references.filter((r) => context.acceptReference!(r)),
        guideDirections: hover.guideDirections,
        endpointRadiusPx: 10,
        gridSpacing: null,
        orthoOrigin: null,
      }).candidate
    : null;
  const candidate =
    resolved && ["endpoint", "midpoint", "intersection"].includes(resolved.kind) ? resolved : null;
  const { width, height, left, top } = projection.viewport;
  const screen = (point: Point) => {
    const value = plane.value.toScreen(point);
    return value.status === "ok" ? { x: value.value.x - left, y: value.value.y - top } : null;
  };
  const visible = (r: SnapReference) => context.acceptReference!(r);
  const markers = hover.references.filter(visible);
  const span = Math.hypot(width, height);
  return (
    <>
      {/* z=0 construction guides sit behind opaque wall pixels, including their real openings. */}
      <svg
        aria-label="3D Hilfslinien"
        className="pointer-events-none absolute inset-0"
        width={width}
        height={height}
      >
        {hover.guideDirections.map((g, i) => {
          const a = screen(g.source.point),
            b = screen({
              x: g.source.point.x + g.direction.x,
              y: g.source.point.y + g.direction.y,
            });
          if (!a || !b) return null;
          const length = Math.hypot(b.x - a.x, b.y - a.y);
          if (!length) return null;
          const dx = ((b.x - a.x) / length) * span,
            dy = ((b.y - a.y) / length) * span;
          return (
            <line
              key={i}
              x1={a.x - dx}
              y1={a.y - dy}
              x2={a.x + dx}
              y2={a.y + dy}
              stroke="#aeb5bd"
              strokeWidth={1.3}
              strokeDasharray="6 4"
            />
          );
        })}
      </svg>
      <svg
        aria-label="3D Fangvorschau"
        className="pointer-events-none absolute inset-0 z-20"
        width={width}
        height={height}
      >
        {markers.map((r) => {
          const p = screen(r.point);
          return (
            p && (
              <circle
                key={JSON.stringify([r.entityId, r.feature])}
                data-reference="active"
                cx={p.x}
                cy={p.y}
                r={10.5}
                fill="none"
                stroke="#aeb5bd"
                strokeWidth={2.5}
              />
            )
          );
        })}
        {candidate &&
          (() => {
            const p = screen(candidate.worldPoint);
            return (
              p && (
                <circle
                  data-reference="hover"
                  cx={p.x}
                  cy={p.y}
                  r={10.5}
                  fill="none"
                  stroke="#aeb5bd"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
              )
            );
          })()}
      </svg>
      <p
        role="status"
        className="pointer-events-none absolute bottom-2 left-2 z-20 rounded bg-background/80 px-2 py-1 text-xs"
      >
        XY · z=0 · {hover.references.length} Hilfsreferenzen
      </p>
    </>
  );
}
