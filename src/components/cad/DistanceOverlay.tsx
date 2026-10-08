import { CAD_TURQUOISE } from "@/rendering/viewport/highlight";
import { distanceMetres } from "@/application/measurement/distance";
import type { DistanceMeasurement } from "@/application/measurement/distance";
import type { Point2 } from "@/geometry/primitives/point";
export function DistanceOverlay({
  measurement,
  aim,
  pixelsPerMetre,
}: {
  measurement: DistanceMeasurement;
  aim: Point2 | null;
  pixelsPerMetre: number;
}) {
  const start = measurement.start,
    end = measurement.end ?? aim;
  if (!start || !end) return null;
  const label = `${distanceMetres(start, end).toLocaleString("de-DE", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} m`;
  return (
    <g pointerEvents="none" aria-label={`Messstrecke ${label}`}>
      <line
        x1={start.x}
        y1={-start.y}
        x2={end.x}
        y2={-end.y}
        stroke={CAD_TURQUOISE}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        strokeDasharray="5 3"
      />
      {[start, end].map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={-point.y}
          r={4 / pixelsPerMetre}
          fill="var(--background)"
          stroke={CAD_TURQUOISE}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <text
        x={(start.x + end.x) / 2}
        y={-(start.y + end.y) / 2 - 12 / pixelsPerMetre}
        textAnchor="middle"
        fontSize={13 / pixelsPerMetre}
        fill="var(--foreground)"
        stroke="var(--background)"
        strokeWidth={3 / pixelsPerMetre}
        paintOrder="stroke"
      >
        {label}
      </text>
    </g>
  );
}
