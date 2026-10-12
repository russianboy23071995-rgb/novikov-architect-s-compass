import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Point2 } from "@/geometry/primitives/point";
import type { StyleSegment } from "@/application/lines/style-library";
import { querySnap } from "@/constraints/snapping/engine";
import { angle45Direction } from "@/geometry/projections/direction";
export function LineStyleDrawing({
  period,
  color,
  segments,
  onChange,
}: {
  period: number;
  color: string;
  segments: readonly StyleSegment[];
  onChange: (segments: readonly StyleSegment[]) => void;
}) {
  const [start, setStart] = useState<Point2 | null>(null);
  const [cursor, setCursor] = useState<Point2 | null>(null);
  const direction = useRef<Point2 | null>(null);
  const point = (event: PointerEvent<SVGSVGElement>) => {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return null;
    const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const raw = {
      x: Math.max(0, Math.min(period, local.x)),
      y: Math.max(-10, Math.min(10, local.y)),
    };
    if (!event.shiftKey) direction.current = null;
    else if (start && !direction.current)
      direction.current = angle45Direction(raw, start).direction;
    return querySnap(raw, {
      references: segments.flatMap((line, i) =>
        [line.start, line.end].map((p, j) => ({
          point: p,
          entityId: `draft-${i}`,
          feature: `endpoint-${j}`,
        })),
      ),
      pixelsPerMetre: Math.hypot(matrix.a, matrix.b),
      enabled: true,
      endpointRadiusPx: 10,
      gridSpacing: 1,
      orthoOrigin: null,
      angleOrigin: event.shiftKey ? start : null,
      angleDirection: direction.current,
    }).point;
  };
  return (
    <svg
      tabIndex={0}
      aria-label="Linienstruktur zeichnen"
      viewBox={`0 -12 ${period} 24`}
      className="h-56 w-full rounded border bg-white/20 touch-none"
      onPointerMove={(event) => setCursor(point(event))}
      onPointerLeave={() => setCursor(null)}
      onKeyUp={(event) => {
        if (event.key === "Shift") direction.current = null;
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && start) {
          event.stopPropagation();
          event.preventDefault();
          setStart(null);
          setCursor(null);
          direction.current = null;
        }
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.focus();
        const target = point(event);
        if (!target) return;
        if (!start) {
          setStart(target);
        } else {
          if (Math.hypot(target.x - start.x, target.y - start.y) > 1e-8) {
            onChange([...segments, { start, end: target }]);
            setStart(null);
            direction.current = null;
          }
        }
      }}
    >
      <line
        x1={0}
        y1={0}
        x2={period}
        y2={0}
        stroke="#94a3b8"
        strokeWidth="0.7"
        strokeDasharray="3 3"
        vectorEffect="non-scaling-stroke"
      />
      {segments.map((line, i) => (
        <line
          key={i}
          x1={line.start.x}
          y1={line.start.y}
          x2={line.end.x}
          y2={line.end.y}
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {start && cursor && (
        <line
          x1={start.x}
          y1={start.y}
          x2={cursor.x}
          y2={cursor.y}
          stroke="#22b8c5"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
