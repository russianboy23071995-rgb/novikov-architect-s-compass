import { useEffect, useId, useRef, useState } from "react";
import { panPlan, planScaleBar, planViewBox, zoomPlan } from "@/rendering/viewport/plan-camera";
import type { PlanCamera, ViewSize } from "@/rendering/viewport/plan-camera";
import { previewEdit } from "@/application/direct-edit/controller";
import type { EditSession } from "@/lib/bim/direct-edit";
import { wallLength } from "@/lib/bim/model";
import type { Point, Project } from "@/lib/bim/model";
import { drawingPoint } from "./bim-view";
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
  onSelect: (selection: Selection, anchor?: Point, index?: number, modelPoint?: Point) => void;
  editSession?: EditSession | null;
  onEditCommit?: (session: EditSession, point: Point) => void;
  onPoint: (point: Point) => void;
  onFinish?: () => void;
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
  onFinish,
  editSession,
  onEditCommit,
  camera,
  viewSize,
  onCamera,
  pan,
  grid,
}: BimPlanProps & {
  camera: PlanCamera;
  viewSize: ViewSize;
  onCamera: (camera: PlanCamera) => void;
  pan: boolean;
  grid: boolean;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const gridId = useId();
  const gridStep = planScaleBar(camera.pixelsPerMetre).metres;
  const navigation = useRef<{ pointerId: number; x: number; y: number; camera: PlanCamera } | null>(
    null,
  );
  const navigationClick = useRef(false);
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      if (navigation.current) return;
      const bounds = element.getBoundingClientRect();
      const delta =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewSize.height : 1);
      onCamera(
        zoomPlan(camera, viewSize, Math.exp(-Math.max(-300, Math.min(300, delta)) * 0.002), {
          x: event.clientX - bounds.x,
          y: event.clientY - bounds.y,
        }),
      );
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [camera, viewSize, onCamera]);
  const editDown = useRef<EditSession | null>(null);
  const [hover, setHover] = useState<Point | null>(null);
  const [editPointer, setEditPointer] = useState<{ session: EditSession; point: Point } | null>(
    null,
  );
  const rawPoint = (event: { clientX: number; clientY: number }) => {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: point.x, y: -point.y };
  };
  const editPoint = (event: { clientX: number; clientY: number }) => {
    const point = rawPoint(event);
    return point ? drawingPoint(point, editSession?.anchor ?? null, snap, ortho) : null;
  };
  let preview: Project | null = null;
  let editError = "";
  if (editSession && editPointer?.session === editSession) {
    try {
      preview = previewEdit(editSession, project, selection, editPointer.point);
    } catch {
      editError = "Ungültiges Ziel: Geometrie und Fenstergrenzen prüfen.";
    }
  }
  const shown = preview ?? project;
  const handles: { point: Point; index: number; label: string }[] = [];
  if (selection?.kind === "wall") {
    const wall = project.storey.walls.find((item) => item.id === selection.id);
    if (wall) {
      const length = wallLength(wall);
      const nx = ((-(wall.end.y - wall.start.y) / length) * wall.thickness) / 2;
      const ny = (((wall.end.x - wall.start.x) / length) * wall.thickness) / 2;
      [wall.start, wall.end].forEach((point, index) =>
        [-1, 1].forEach((side) =>
          handles.push({
            point: { x: point.x + side * nx, y: point.y + side * ny },
            index,
            label: `Wandecke ${index === 0 ? "Anfang" : "Ende"} ${side === 1 ? "links" : "rechts"}`,
          }),
        ),
      );
    }
  } else if (selection?.kind === "line") {
    const line = project.storey.lines?.find((item) => item.id === selection.id);
    line?.points.forEach((point, index) => {
      if (
        index === line.points.length - 1 &&
        index > 1 &&
        point.x === line.points[0]!.x &&
        point.y === line.points[0]!.y
      )
        return;
      handles.push({ point, index, label: `Linienpunkt ${index + 1}` });
    });
  }
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
      if (!drawing && !editSession) {
        event.stopPropagation();
        onSelect(
          { kind, id },
          { x: event.clientX, y: event.clientY },
          undefined,
          rawPoint(event) ?? undefined,
        );
      }
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (!drawing && !editSession && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        onSelect({ kind, id });
      }
    },
  });
  return (
    <svg
      ref={svg}
      aria-label="BIM floor plan"
      tabIndex={0}
      viewBox={planViewBox(camera, viewSize)}
      preserveAspectRatio="none"
      onPointerDown={(event) => {
        navigationClick.current = event.button === 1 || (pan && event.button === 0);
        if (navigationClick.current) {
          event.preventDefault();
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          navigation.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            camera,
          };
          editDown.current = null;
          return;
        }
        editDown.current = editSession ?? null;
      }}
      onPointerUp={(event) => {
        if (navigation.current?.pointerId === event.pointerId) {
          navigation.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onLostPointerCapture={() => {
        navigation.current = null;
      }}
      onPointerCancel={() => {
        navigation.current = null;
        editDown.current = null;
      }}
      onClickCapture={(event) => {
        if (navigationClick.current || pan) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onAuxClick={(event) => event.preventDefault()}
      className={`h-full w-full touch-none ${pan ? "cursor-grab" : drawing ? "cursor-crosshair" : ""}`}
      onPointerMove={(event) => {
        const active = navigation.current;
        if (active && active.pointerId === event.pointerId) {
          onCamera(
            panPlan(active.camera, { x: event.clientX - active.x, y: event.clientY - active.y }),
          );
          return;
        }
        if (pan) return;
        if (drawing) setHover(pointFromEvent(event));
        if (editSession) {
          const point = editPoint(event);
          if (point) setEditPointer({ session: editSession, point });
        }
      }}
      onPointerLeave={() => setHover(null)}
      onClick={(event) => {
        if (editSession) {
          if (editDown.current !== editSession) return;
          editDown.current = null;
          const point = editPoint(event);
          if (point) {
            setEditPointer({ session: editSession, point });
            try {
              onEditCommit?.(editSession, point);
            } catch {
              /* Invalid preview stays editable. */
            }
          }
          return;
        }
        if (drawing) {
          event.currentTarget.focus();
          if (onFinish && event.detail > 1) return;
          const point = pointFromEvent(event);
          if (point) onPoint(point);
        } else if (event.target === event.currentTarget) onSelect(null);
      }}
      onDoubleClick={(event) => {
        if (pan || navigationClick.current) return;
        if (drawing && onFinish) {
          event.preventDefault();
          onFinish();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") navigation.current = null;
        if (pan) return;
        if (drawing && onFinish && event.key === "Enter") {
          event.preventDefault();
          onFinish();
        }
      }}
    >
      {grid && (
        <g pointerEvents="none">
          <defs>
            <pattern id={gridId} width={gridStep} height={gridStep} patternUnits="userSpaceOnUse">
              <path
                d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`}
                fill="none"
                stroke="var(--muted-foreground)"
                strokeOpacity={0.15}
                strokeWidth={1 / camera.pixelsPerMetre}
              />
            </pattern>
          </defs>
          <rect
            x={camera.center.x - viewSize.width / camera.pixelsPerMetre / 2}
            y={-camera.center.y - viewSize.height / camera.pixelsPerMetre / 2}
            width={viewSize.width / camera.pixelsPerMetre}
            height={viewSize.height / camera.pixelsPerMetre}
            fill={`url(#${gridId})`}
          />
        </g>
      )}
      {shown.storey.walls.map((wall) => {
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
            {shown.storey.windows
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
      {(shown.storey.lines ?? []).map((line) => (
        <g key={line.id}>
          {selection?.id === line.id && (
            <path
              d={linePath(line)}
              fill="none"
              stroke="#38bdf8"
              strokeOpacity={0.4}
              strokeWidth={5}
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
            className="cursor-pointer outline-none focus-visible:stroke-sky-300/40"
          />
        </g>
      ))}
      {!drawing &&
        !editSession &&
        selection &&
        handles.map(({ point, index, label }) => (
          <circle
            key={label}
            cx={point.x}
            cy={-point.y}
            r={5 / camera.pixelsPerMetre}
            fill="white"
            stroke="#0284c7"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            role="button"
            tabIndex={0}
            aria-label={label}
            className="cursor-pointer outline-none focus:stroke-foreground"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(selection, { x: event.clientX, y: event.clientY }, index, point);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                const bounds = event.currentTarget.getBoundingClientRect();
                onSelect(selection, { x: bounds.x, y: bounds.y }, index, point);
              }
            }}
          />
        ))}
      {editSession && editPointer?.session === editSession && (
        <g pointerEvents="none">
          <line
            x1={editSession.anchor.x}
            y1={-editSession.anchor.y}
            x2={editPointer.point.x}
            y2={-editPointer.point.y}
            stroke={editError ? "#dc2626" : "#0284c7"}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            strokeDasharray="5 4"
          />
          <circle
            cx={editPointer.point.x}
            cy={-editPointer.point.y}
            r={0.055}
            fill={editError ? "#dc2626" : "#0284c7"}
          />
          {editError && (
            <text
              role="alert"
              x={editPointer.point.x}
              y={-editPointer.point.y - 0.15}
              fontSize={0.13}
              fill="#dc2626"
            >
              {editError}
            </text>
          )}
        </g>
      )}
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
