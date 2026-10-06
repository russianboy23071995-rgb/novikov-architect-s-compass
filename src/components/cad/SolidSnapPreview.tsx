import type { ProjectionState } from "@/rendering/viewport/projection-state";
import type { Point } from "@/lib/bim/model";
import type { SnapReference } from "@/constraints/snapping/engine";
import type { useSolidInference } from "./useSolidInference";

/** Presentation only; passive hover and edits share the viewport inference adapter. */
export function SolidSnapPreview({
  projection,
  enabled,
  inference,
}: {
  projection: ProjectionState | null;
  enabled: boolean;
  inference: ReturnType<typeof useSolidInference>;
}) {
  const { plane, context, hover, candidate } = inference;
  if (!enabled || !projection) return null;
  if (plane?.status !== "ok")
    return (
      <p className="pointer-events-none absolute bottom-2 left-2 text-xs" role="status">
        Arbeitsebene aus diesem Blick nicht eindeutig
      </p>
    );
  const { width, height, left, top } = projection.viewport;
  const screen = (point: Point) => {
    const value = plane.value.toScreen(point);
    return value.status === "ok" ? { x: value.value.x - left, y: value.value.y - top } : null;
  };
  const visible = (r: SnapReference) => context.acceptReference!(r);
  const markers = hover.references.filter(visible);
  const trackedEdges = markers.filter((r) => r.segment);
  const edgeMarkers =
    inference.edge &&
    !trackedEdges.some(
      (r) => r.feature === inference.edge!.feature && r.entityId === inference.edge!.entityId,
    )
      ? [...trackedEdges, inference.edge]
      : trackedEdges;
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
        {edgeMarkers.map((r) => {
          const a = screen(r.segment!.start),
            b = screen(r.segment!.end);
          const active = trackedEdges.includes(r);
          return a && b ? (
            <line
              key={`${r.entityId}:${r.feature}`}
              data-edge-reference={active ? "active" : "hover"}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#aeb5bd"
              strokeWidth={active ? 3 : 2}
              strokeDasharray={active ? undefined : "4 3"}
            />
          ) : null;
        })}
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
        {candidate?.sourceFeature === "t-axis" && " · T-Anschluss"}
      </p>
    </>
  );
}
