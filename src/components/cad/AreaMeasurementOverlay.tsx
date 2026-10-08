import type { AreaMeasurement } from "@/application/measurement/area";
import type { Point2 } from "@/geometry/primitives/point";
export function AreaMeasurementOverlay({
  measurement,
  aim,
  pixelsPerMetre,
}: {
  measurement: AreaMeasurement;
  aim: Point2 | null;
  pixelsPerMetre: number;
}) {
  const done = measurement.squareMetres !== null;
  const points = [...measurement.points, ...(!done && aim ? [aim] : [])];
  if (!measurement.points.length) return null;
  const label = done
    ? `${measurement.squareMetres!.toLocaleString("de-DE", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} m²`
    : "Doppelklick schließt";
  const anchor = measurement.points[0]!;
  return (
    <g pointerEvents="none" aria-label={`Flächenmessung ${label}`}>
      <polygon
        points={points.map((p) => `${p.x},${-p.y}`).join(" ")}
        fill={done ? "var(--primary)" : "none"}
        fillOpacity={0.12}
        stroke="var(--primary)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeDasharray={done ? undefined : "5 3"}
      />
      {measurement.points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={-p.y}
          r={4 / pixelsPerMetre}
          fill="var(--background)"
          stroke="var(--primary)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <text
        x={anchor.x}
        y={-anchor.y - 12 / pixelsPerMetre}
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
