import { useState } from "react";
import { wallLength } from "@/lib/bim/model";
import type { Point, Project } from "@/lib/bim/model";
import { drawingPoint, planBounds } from "./bim-view";
import type { Selection } from "./bim-view";
import { linePath } from "@/lib/bim/lines";

export type BimPlanProps = {
  project: Project;
  selection: Selection;
  drawing: boolean;
  start: Point | null;
  draftPoints?: Point[];
  snap: boolean;
  ortho: boolean;
  onSelect: (selection: Selection) => void;
  onPoint: (point: Point) => void;
};

export function BimPlan({
  project,
  selection,
  drawing,
  start,
  draftPoints = [],
  snap,
  ortho,
  onSelect,
  onPoint,
}: BimPlanProps) {
  const [hover, setHover] = useState<Point | null>(null);
  const pointFromEvent = (event: React.MouseEvent<SVGSVGElement>) => {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return drawingPoint({ x: point.x, y: -point.y }, start, snap, ortho);
  };
  const selectProps = (kind: "wall" | "window" | "line", id: string) => ({
    role: "button",
    tabIndex: drawing ? -1 : 0,
    "aria-label": `Select ${kind} ${id}`,
    "aria-pressed": selection?.id === id,
    onClick: (event: React.MouseEvent) => {
      if (!drawing) {
        event.stopPropagation();
        onSelect({ kind, id });
      }
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (!drawing && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        onSelect({ kind, id });
      }
    },
  });
  return (
    <svg
      aria-label="BIM floor plan"
      tabIndex={0}
      viewBox={planBounds(project)}
      className={`h-full w-full ${drawing ? "cursor-crosshair" : ""}`}
      onPointerMove={(event) => {
        if (drawing) setHover(pointFromEvent(event));
      }}
      onPointerLeave={() => setHover(null)}
      onClick={(event) => {
        if (drawing) {
          event.currentTarget.focus();
          const point = pointFromEvent(event);
          if (point) onPoint(point);
        } else if (event.target === event.currentTarget) onSelect(null);
      }}
    >
      {project.storey.walls.map((wall) => {
        const length = wallLength(wall);
        const angle =
          (-Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * 180) / Math.PI;
        return (
          <g
            key={wall.id}
            transform={`translate(${wall.start.x} ${-wall.start.y}) rotate(${angle})`}
          >
            <rect
              {...selectProps("wall", wall.id)}
              x={0}
              y={-wall.thickness / 2}
              width={length}
              height={wall.thickness}
              fill={selection?.id === wall.id ? "var(--primary)" : "var(--muted-foreground)"}
              fillOpacity={0.55}
              stroke="var(--primary)"
              strokeWidth={0.018}
              className="outline-none focus:stroke-foreground"
            />
            <text
              x={length / 2}
              y={-wall.thickness / 2 - 0.16}
              textAnchor="middle"
              fontSize={0.14}
              fill="var(--foreground)"
              pointerEvents="none"
            >
              {length.toFixed(2)} m
            </text>
            {project.storey.windows
              .filter((opening) => opening.wallId === wall.id)
              .map((opening) => (
                <g key={opening.id}>
                  <rect
                    {...selectProps("window", opening.id)}
                    x={opening.position * length - opening.width / 2}
                    y={-wall.thickness / 2}
                    width={opening.width}
                    height={wall.thickness}
                    fill="var(--background)"
                    stroke={selection?.id === opening.id ? "var(--foreground)" : "var(--primary)"}
                    strokeWidth={selection?.id === opening.id ? 0.04 : 0.025}
                    className="outline-none focus:stroke-foreground"
                  />
                  <line
                    x1={opening.position * length - opening.width / 2}
                    x2={opening.position * length + opening.width / 2}
                    y1={0}
                    y2={0}
                    stroke="var(--primary)"
                    strokeWidth={0.02}
                    pointerEvents="none"
                  />
                </g>
              ))}
          </g>
        );
      })}
      {(project.storey.lines ?? []).map((line) => (
        <g key={line.id}>
          {selection?.id === line.id && (
            <path
              d={linePath(line)}
              fill="none"
              stroke="#38bdf8"
              strokeOpacity={0.4}
              strokeWidth={8}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}
          <path
            d={linePath(line)}
            fill="none"
            stroke={line.color}
            strokeWidth={(line.penWidth * 96) / 25.4}
            strokeDasharray={line.style === "dashed" ? "8 5" : undefined}
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
          <path
            {...selectProps("line", line.id)}
            d={linePath(line)}
            fill="none"
            stroke="transparent"
            strokeWidth={12}
            vectorEffect="non-scaling-stroke"
            className="cursor-pointer focus:stroke-sky-300/40"
          />
        </g>
      ))}
      {drawing && draftPoints.length > 0 && (
        <polyline
          points={draftPoints.map((p) => `${p.x},${-p.y}`).join(" ")}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={0.025}
          pointerEvents="none"
        />
      )}
      {drawing && start && (
        <g pointerEvents="none">
          <circle cx={start.x} cy={-start.y} r={0.05} fill="var(--primary)" />
          {hover && (
            <line
              x1={start.x}
              y1={-start.y}
              x2={hover.x}
              y2={-hover.y}
              stroke="var(--primary)"
              strokeWidth={0.025}
              strokeDasharray="0.1 0.05"
            />
          )}
        </g>
      )}
    </svg>
  );
}
