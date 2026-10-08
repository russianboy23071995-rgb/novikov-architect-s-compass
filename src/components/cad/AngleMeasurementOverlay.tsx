import type { AngleMeasurement } from "@/application/measurement/angle";
import { includedAngle } from "@/geometry/primitives/angle";
import type { Point2 } from "@/geometry/primitives/point";
import { CAD_TURQUOISE } from "@/rendering/viewport/highlight";
export function AngleMeasurementOverlay({
  measurement,
  aim,
  pixelsPerMetre,
}: {
  measurement: AngleMeasurement;
  aim: Point2 | null;
  pixelsPerMetre: number;
}) {
  const points = [...measurement.points, ...(measurement.degrees === null && aim ? [aim] : [])];
  if (!measurement.points.length) return null;
  let degrees = measurement.degrees;
  if (degrees === null && points.length === 3) {
    try {
      degrees = includedAngle(points[0]!, points[1]!, points[2]!);
    } catch {
      /* zero-length aim is not a valid angle */
    }
  }
  const label =
    degrees === null
      ? measurement.points.length === 1
        ? "Scheitel wählen"
        : "Zweiten Schenkel wählen"
      : `${degrees.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}°`;
  const vertex = points[1] ?? points[0]!;
  return (
    <g pointerEvents="none" aria-label={`Winkelmessung ${label}`}>
      <polyline
        points={points.map((p) => `${p.x},${-p.y}`).join(" ")}
        fill="none"
        stroke={CAD_TURQUOISE}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {measurement.points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={-p.y}
          r={4 / pixelsPerMetre}
          fill="var(--background)"
          stroke={CAD_TURQUOISE}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <text
        x={vertex.x}
        y={-vertex.y - 14 / pixelsPerMetre}
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
