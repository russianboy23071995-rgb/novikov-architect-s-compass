import { WORLD_MOVEMENT_AXES } from "@/application/input/movement-axes";
import type { Point } from "@/domain/project/schema";
import type { ProjectionState } from "@/rendering/viewport/projection-state";

/** Orientation overlay only. Direction locking remains in the shared Shift snap pipeline. */
export function MovementOriginAxes({
  projection,
  origin,
  elevation,
  verticalActive = false,
}: {
  projection: ProjectionState;
  origin: Point;
  elevation: number;
  verticalActive?: boolean;
}) {
  const { width, height } = projection.viewport;
  const project = (x: number, y: number, z: number) => {
    const p = projection.project([x, y, z]);
    return { x: ((p[0] + 1) * width) / 2, y: ((1 - p[1]) * height) / 2 };
  };
  const start = project(origin.x, origin.y, elevation);
  const length = Math.min(160, width / 5, height / 4);
  const colors = { x: "#b75e63", y: "#438f83", z: "#8c97a4" };
  return (
    <svg
      aria-label="Bewegungsachsen am Ursprung"
      className="pointer-events-none absolute inset-0 z-20"
      width={width}
      height={height}
    >
      {WORLD_MOVEMENT_AXES.map((axis) => {
        const end = project(
          origin.x + axis.direction[0],
          origin.y + axis.direction[1],
          elevation + axis.direction[2],
        );
        const size = Math.hypot(end.x - start.x, end.y - start.y);
        // A view-aligned axis has no unambiguous screen direction.
        if (!Number.isFinite(size) || size < 0.001) return null;
        const dx = (end.x - start.x) / size,
          dy = (end.y - start.y) / size;
        const x = start.x + dx * length,
          y = start.y + dy * length;
        const color = colors[axis.id as keyof typeof colors];
        return (
          <g key={axis.id} data-movement-axis={axis.id}>
            <title>
              {axis.id === "z"
                ? "Z: über Bewegungsachsen wählen; Länge mit Vorzeichen"
                : `${axis.label}: Maus in Richtung führen, dann Shift halten`}
            </title>
            <line
              x1={start.x - dx * length * 0.6}
              y1={start.y - dy * length * 0.6}
              x2={x}
              y2={y}
              stroke={color}
              strokeWidth={axis.id === "z" && verticalActive ? 3 : 1.5}
              strokeDasharray={axis.id === "z" ? "3 5" : "7 4"}
            />
            <path
              d={`M ${x - dx * 8 - dy * 4} ${y - dy * 8 + dx * 4} L ${x} ${y} L ${x - dx * 8 + dy * 4} ${y - dy * 8 - dx * 4}`}
              fill="none"
              stroke={color}
              strokeWidth={axis.id === "z" && verticalActive ? 3 : 1.5}
            />
            <text
              x={x + dx * 12}
              y={y + dy * 12}
              textAnchor="middle"
              dominantBaseline="central"
              fill={color}
              stroke="var(--background, white)"
              strokeWidth={3}
              paintOrder="stroke"
              fontSize={12}
              fontWeight={600}
            >
              {axis.label}
              {axis.id === "z" && verticalActive ? " · aktiv" : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
