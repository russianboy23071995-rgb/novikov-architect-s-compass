import type { PlacedObject } from "@/domain/elements/object/model";
import {
  objectAxonometricPreview,
  objectPlanPreview,
  type PreviewBounds,
} from "@/rendering/viewport/object-preview";

type Size = Pick<PlacedObject, "catalogId" | "width" | "depth" | "height" | "mirrored">;

const viewBox = (b: PreviewBounds) => {
  const pad = Math.max(b.width, b.height) * 0.06;
  return `${b.minX - pad} ${b.minY - pad} ${b.width + 2 * pad} ${b.height + 2 * pad}`;
};

/** The catalogue symbol from above (docs/OBJEKTBIBLIOTHEK.md, M1). */
export function ObjectPlanPreview({ object, className }: { object: Size; className?: string }) {
  const { lines, bounds } = objectPlanPreview(object);
  return (
    <svg viewBox={viewBox(bounds)} className={className} aria-hidden="true">
      {lines.map((line, i) => {
        const points = line.points.map((p) => `${p.x},${p.y}`).join(" ");
        const shared = {
          points,
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 1,
          vectorEffect: "non-scaling-stroke" as const,
        };
        return line.closed ? <polygon key={i} {...shared} /> : <polyline key={i} {...shared} />;
      })}
    </svg>
  );
}

/** The boxes of the 3D body from front right above (docs/OBJEKTBIBLIOTHEK.md, M1). */
export function ObjectAxonometricPreview({
  object,
  className,
}: {
  object: Size;
  className?: string;
}) {
  const { faces, bounds } = objectAxonometricPreview(object);
  return (
    <svg viewBox={viewBox(bounds)} className={className} aria-hidden="true">
      {faces.map((face, i) => (
        <polygon
          key={i}
          points={face.points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill={`color-mix(in srgb, var(--background) ${Math.round(face.shade * 100)}%, var(--foreground))`}
          stroke="currentColor"
          strokeWidth={0.75}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
