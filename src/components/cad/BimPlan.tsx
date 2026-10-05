import { pointsCompatible } from "@/geometry/tolerances/model";
import type { Hatch } from "@/domain/elements/hatch/model";
import { visiblePlanGeometry } from "@/rendering/viewport/layer-display";
import { isLayerVisible } from "@/application/layers/visibility";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import type { ReferenceSelectionBinding } from "./useReferenceSelection";
import { ReferenceSelectionPanel } from "./ReferenceSelectionPanel";
import { referenceKey } from "@/constraints/inference/construction-reference";
import { pickReferencePoints, pickReferenceSegments } from "@/rendering/viewport/reference-picking";
import { segmentKey } from "@/application/snapping/reference-selection";
import { useSnapDensity } from "./useSnapDensity";
import { cursorGuide } from "@/constraints/guides/directions";
import { DEFAULT_HOVER_DWELL_MS } from "@/constraints/inference/hover-reference";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  createToolSourceQuery,
  createVisibleToolSourceQuery,
  resolveToolSnap,
  toolPinnedReferences,
} from "@/application/tools/snapping";
import type { ToolSnapPolicy } from "@/application/tools/snapping";
import { useHoverReference } from "./useHoverReference";
import { getLocalSnapSources } from "@/application/snapping/local-sources";
import { panPlan, planScaleBar, planViewBox, zoomPlan } from "@/rendering/viewport/plan-camera";
import type { PlanCamera, ViewSize } from "@/rendering/viewport/plan-camera";
import { previewEdit } from "@/application/direct-edit/controller";
import type { EditSession } from "@/lib/bim/direct-edit";
import { wallLength } from "@/lib/bim/model";
import type { Point, Project } from "@/lib/bim/model";
import type { Selection } from "./bim-view";
import { linePath } from "@/lib/bim/lines";

export type BimPlanProps = {
  referenceSelection?: ReferenceSelectionBinding | undefined;
  referenceScope?: object | undefined;
  interactive?: boolean;
  project: Project;
  visibility?: LayerVisibilityPolicy;
  snapping?: ToolSnapPolicy | null;
  selection: Selection;
  drawing: boolean;
  endpointSnap?: boolean;
  hoverDwellMs?: number;
  start: Point | null;
  draftPoints?: Point[];
  draftFill?: Hatch["fill"] | undefined;
  snap: boolean;
  ortho: boolean;
  onSelect: (selection: Selection, anchor?: Point, index?: number, modelPoint?: Point) => void;
  editSession?: EditSession | null;
  numericTarget?: Point | null | undefined;
  drawingTarget?: Point | null | undefined;
  onDrawingAim?: ((point: Point) => void) | undefined;
  onEditAim?: (session: EditSession, point: Point) => void;
  onEditDirection?: (session: EditSession, point: Point) => void;
  onEditCommit?: (session: EditSession, point: Point) => void;
  onPoint: (point: Point) => void;
  onFinish?: () => void;
};

export function BimPlan({
  referenceSelection,
  referenceScope,
  interactive = true,
  project,
  visibility,
  snapping: requestedSnapping = null,
  selection: requestedSelection,
  drawing,
  endpointSnap = false,
  hoverDwellMs = DEFAULT_HOVER_DWELL_MS,
  start,
  draftPoints = [],
  draftFill,
  snap,
  ortho,
  onSelect,
  onPoint,
  onFinish,
  editSession: requestedEditSession,
  onEditCommit,
  numericTarget,
  drawingTarget,
  onDrawingAim,
  onEditAim,
  onEditDirection,
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
  const editSession =
    requestedEditSession && isLayerVisible(project, visibility, requestedEditSession.target.id)
      ? requestedEditSession
      : null;
  const snapping = requestedEditSession && !editSession ? null : requestedSnapping;
  const selection =
    requestedSelection && isLayerVisible(project, visibility, requestedSelection.id)
      ? requestedSelection
      : null;
  const visibilitySession = useMemo(
    () => ({ referenceScope, visibility, project, snapping }),
    [referenceScope, visibility, project, snapping],
  );
  const selecting = referenceSelection?.selecting ?? false;
  const selectedSegments = referenceSelection?.selected ?? null;
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
  const [referenceReset, setReferenceReset] = useState(0);
  const [shiftHeld, setShiftHeld] = useState(false);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (selecting || !interactive) return;
      if (
        event.target instanceof Element &&
        event.target.closest('[role="dialog"],[role="alertdialog"]')
      )
        return;
      if (event.key === "Shift") setShiftHeld(event.type === "keydown");
      if (event.key === "Escape" && event.type === "keydown") {
        setHover(null);
        setReferenceReset((value) => value + 1);
      }
    };
    const clear = () => setShiftHeld(false);
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", key);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", key);
      window.removeEventListener("blur", clear);
    };
  }, [selecting, interactive]);
  useEffect(() => setHover(null), [endpointSnap, camera, editSession]);
  const pinnedReferences = useMemo(() => toolPinnedReferences(snapping), [snapping]);
  const modelSources = useMemo(() => getLocalSnapSources(project), [project]);
  const sourceQuery = useMemo(
    () =>
      visibility
        ? createVisibleToolSourceQuery(project, visibility, visibility.context, snapping)
        : createToolSourceQuery(modelSources, snapping),
    [modelSources, snapping, project, visibility],
  );
  const density = useSnapDensity(
    sourceQuery,
    pan ? null : hover,
    camera.pixelsPerMetre,
    endpointSnap && snap && interactive,
    referenceReset,
    camera,
    selectedSegments,
  );
  const references = pinnedReferences;
  const trackingContext = useMemo(
    () => ({
      enabled: endpointSnap && snap && interactive,
      sessionKey: visibilitySession,
      acceptReference: sourceQuery.accepts,
      references,
      sourceQuery,
      intersectionsPaused: density.paused,
      selectedSegments,
      suspended: selecting || pan,
      pixelsPerMetre: camera.pixelsPerMetre,
      camera,
      viewSize,
      resetKey: referenceReset,
      pinnedReferences,
    }),
    [
      endpointSnap,
      snap,
      interactive,
      visibilitySession,
      pan,
      references,
      sourceQuery,
      density.paused,
      selectedSegments,
      selecting,
      camera,
      viewSize,
      referenceReset,
      pinnedReferences,
    ],
  );
  const {
    references: activeReferences,
    guideDirections,
    guideCursor,
    previewPoints,
    acquirePoints,
  } = useHoverReference(hover, trackingContext, hoverDwellMs);
  const activeReference = activeReferences.at(-1) ?? null;
  const resolvePointer = (point: Point, shift = shiftHeld) =>
    resolveToolSnap(
      snapping,
      point,
      {
        references,
        sourceQuery,
        intersectionsPaused: density.paused,
        selectedSegments,
        pixelsPerMetre: camera.pixelsPerMetre,
        enabled: snap,
        endpointRadiusPx: 10,
        gridSpacing: 0.1,
        activeReference,
        activeReferences,
        guideDirections,
      },
      { ortho, shift, featureSnap: endpointSnap },
    );
  const pointerSnap = hover ? resolvePointer(hover) : null;
  const resolvedHover =
    drawingTarget !== undefined
      ? drawingTarget
        ? {
            point: drawingTarget,
            candidate:
              pointerSnap && pointsCompatible(pointerSnap.point, drawingTarget)
                ? pointerSnap.candidate
                : null,
          }
        : null
      : numericTarget !== undefined
        ? null
        : pointerSnap;
  const snapLabels = {
    midpoint: "Mittelpunkt",
    "segment-intersection": "Segmentschnittpunkt",
    parallel: "Parallel",
    endpoint: resolvedHover?.candidate?.sourceReferences?.[0]?.dependencies
      ? "Hilfspunkt"
      : "Endpunkt",
    grid: "Raster",
    horizontal: "Horizontal",
    vertical: "Vertikal",
    extension: "Verlängerung",
    perpendicular: "Lotrecht",
    angle: `${resolvedHover?.candidate?.angleDegrees ?? 45}°`,
    intersection: "Schnittpunkt",
    "axis-intersection": "Achsenschnittpunkt",
  };
  const [editPointer, setEditPointer] = useState<{ session: EditSession; point: Point } | null>(
    null,
  );
  const rawPoint = (event: { clientX: number; clientY: number }) => {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: point.x, y: -point.y };
  };
  const resolvedEdit =
    numericTarget !== undefined
      ? numericTarget
        ? { point: numericTarget, candidate: null }
        : null
      : editSession && editPointer?.session === editSession
        ? resolvePointer(editPointer.point)
        : null;
  let preview: Project | null = null;
  let editError = "";
  if (editSession && resolvedEdit) {
    try {
      preview = previewEdit(editSession, project, selection, resolvedEdit.point);
    } catch {
      editError = "Ungültiges Ziel: Geometrie und Fenstergrenzen prüfen.";
    }
  }
  const shown = preview ?? project;
  const plan = visiblePlanGeometry(shown, (id) => isLayerVisible(project, visibility, id));
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
  } else if (selection?.kind === "hatch") {
    project.storey.hatches
      .find((h) => h.id === selection.id)
      ?.points.forEach((point, index) =>
        handles.push({ point, index, label: `Schraffurecke ${index + 1}` }),
      );
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
    return resolvePointer({ x: point.x, y: -point.y }, event.shiftKey).point;
  };
  const selectProps = (kind: "wall" | "window" | "line" | "hatch", id: string) => ({
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
  const listPosition = referenceSelection?.hits.length ? referenceSelection.position : null;
  const panelX = listPosition
    ? Math.max(
        12,
        Math.min(
          viewSize.width - 452,
          (listPosition.x - camera.center.x) * camera.pixelsPerMetre + viewSize.width / 2 + 12,
        ),
      )
    : 12;
  const panelY = listPosition
    ? Math.max(
        12,
        Math.min(
          viewSize.height - 272,
          (-listPosition.y + camera.center.y) * camera.pixelsPerMetre + viewSize.height / 2 + 12,
        ),
      )
    : 12;
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
        if ((event.target as Element).closest("[data-reference-panel]")) return;
        if (selecting && referenceSelection && !navigationClick.current && !pan) {
          event.preventDefault();
          event.stopPropagation();
          const point = rawPoint(event);
          if (!point) return;
          const local = sourceQuery.inspect(point, camera.pixelsPerMetre, 10);
          const hits =
            referenceSelection.mode === "points"
              ? pickReferencePoints(local.references, point, camera.pixelsPerMetre)
              : pickReferenceSegments(local.segments, point, camera.pixelsPerMetre);
          if (hits.length === 1) referenceSelection.toggle(hits[0]!);
          else referenceSelection.hitsAt(hits, point);
          return;
        }
        if (navigationClick.current || pan) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onAuxClick={(event) => event.preventDefault()}
      className={`h-full w-full touch-none ${pan ? "cursor-grab" : drawing ? "cursor-crosshair" : ""}`}
      onPointerMove={(event) => {
        if (!interactive) return;
        setShiftHeld(event.shiftKey);
        const active = navigation.current;
        if (active && active.pointerId === event.pointerId) {
          onCamera(
            panPlan(active.camera, { x: event.clientX - active.x, y: event.clientY - active.y }),
          );
          return;
        }
        if (pan || selecting) return;
        if (endpointSnap || editSession) setHover(rawPoint(event));
        const drawingPoint = rawPoint(event);
        if (drawing && drawingPoint)
          onDrawingAim?.(resolvePointer(drawingPoint, event.shiftKey).point);
        if (editSession) {
          const point = rawPoint(event);
          if (point) {
            setEditPointer({ session: editSession, point });
            onEditAim?.(editSession, resolvePointer(point, event.shiftKey).point);
          }
        }
      }}
      onPointerLeave={() => {
        if (selecting) return;
        setHover(null);
        setEditPointer(null);
      }}
      onClick={(event) => {
        if (editSession) {
          if (numericTarget !== undefined) return;
          if (editDown.current !== editSession) return;
          editDown.current = null;
          const point = rawPoint(event);
          if (point) {
            setEditPointer({ session: editSession, point });
            try {
              const target = resolvePointer(point, event.shiftKey).point;
              if (onEditDirection) onEditDirection(editSession, target);
              else onEditCommit?.(editSession, target);
            } catch {
              /* Invalid preview stays editable. */
            }
          }
          return;
        }
        if (drawing) {
          event.currentTarget.focus();
          if (onFinish && event.detail > 1) return;
          const point = drawingTarget !== undefined ? drawingTarget : pointFromEvent(event);
          if (point) onPoint(point);
        } else if (event.target === event.currentTarget) onSelect(null);
      }}
      onDoubleClick={(event) => {
        if (selecting || pan || navigationClick.current) return;
        if (drawing && onFinish) {
          event.preventDefault();
          onFinish();
        }
      }}
      onKeyDown={(event) => {
        if (selecting) return;
        if (event.key === "Escape") {
          navigation.current = null;
          setHover(null);
        }
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
      {plan.hatches.map((hatch) => (
        <polygon
          key={hatch.id}
          {...selectProps("hatch", hatch.id)}
          points={hatch.points.map((p) => `${p.x},${-p.y}`).join(" ")}
          fill={hatch.fill.color}
          fillOpacity={hatch.fill.opacity}
          stroke={selection?.id === hatch.id ? "#cbd5e1" : "transparent"}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          pointerEvents="all"
          className="cursor-pointer outline-none focus-visible:stroke-sky-300"
        />
      ))}
      {plan.walls.map((wall) => {
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
            {plan.openings
              .filter((opening) => opening.wallId === wall.id)
              .map((opening) => (
                <g key={opening.id}>
                  <rect
                    {...(isLayerVisible(project, visibility, opening.id)
                      ? selectProps("window", opening.id)
                      : {})}
                    x={opening.position * length - opening.width / 2}
                    y={-wall.thickness / 2}
                    width={opening.width}
                    height={wall.thickness}
                    fill="var(--background)"
                    stroke={
                      !isLayerVisible(project, visibility, opening.id)
                        ? "none"
                        : selection?.id === opening.id
                          ? "var(--foreground)"
                          : "var(--primary)"
                    }
                    strokeWidth={selection?.id === opening.id ? 0.04 : 0.025}
                    className="outline-none focus:stroke-foreground"
                  />
                  <line
                    visibility={
                      isLayerVisible(project, visibility, opening.id) ? "visible" : "hidden"
                    }
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
      {plan.lines.map((line) => (
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
      {editSession && resolvedEdit && (
        <g pointerEvents="none">
          <line
            x1={editSession.anchor.x}
            y1={-editSession.anchor.y}
            x2={resolvedEdit.point.x}
            y2={-resolvedEdit.point.y}
            stroke={editError ? "#dc2626" : "#0284c7"}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            strokeDasharray="5 4"
          />
          <circle
            cx={resolvedEdit.point.x}
            cy={-resolvedEdit.point.y}
            r={0.055}
            fill={editError ? "#dc2626" : "#0284c7"}
          />
          {editError && (
            <text
              role="alert"
              x={resolvedEdit.point.x}
              y={-resolvedEdit.point.y - 0.15}
              fontSize={0.13}
              fill="#dc2626"
            >
              {editError}
            </text>
          )}
        </g>
      )}
      {drawing && draftFill && draftPoints.length >= 2 && (
        <polygon
          points={[...draftPoints, ...(resolvedHover ? [resolvedHover.point] : [])]
            .map((p) => `${p.x},${-p.y}`)
            .join(" ")}
          fill={draftFill.color}
          fillOpacity={draftFill.opacity}
          stroke="var(--primary)"
          strokeWidth={1}
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
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
          <circle
            cx={start.x}
            cy={-start.y}
            r={6 / camera.pixelsPerMetre}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          {resolvedHover && (
            <line
              x1={start.x}
              y1={-start.y}
              x2={resolvedHover.point.x}
              y2={-resolvedHover.point.y}
              stroke="var(--primary)"
              strokeWidth={0.025}
              strokeDasharray="0.1 0.05"
            />
          )}
        </g>
      )}
      {!pan &&
        snap &&
        guideCursor &&
        activeReferences.map((reference) => {
          const guide = cursorGuide(guideCursor, reference, guideDirections);
          const extension =
            40 / camera.pixelsPerMetre / Math.hypot(guide.direction.x, guide.direction.y);
          return (
            <line
              key={JSON.stringify([reference.entityId, reference.feature])}
              aria-label="Referenzhilfslinie"
              data-guide-kind={guide.kind}
              pointerEvents="none"
              x1={guide.origin.x}
              y1={-guide.origin.y}
              x2={guide.point.x + extension * guide.direction.x}
              y2={-guide.point.y - extension * guide.direction.y}
              stroke="#929aa3"
              strokeWidth={1}
              strokeOpacity={0.7}
              strokeDasharray="6 4"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      {!pan &&
        activeReferences.map((reference) => (
          <g
            key={`${reference.entityId}/${reference.feature}`}
            pointerEvents="none"
            aria-label="Aktive Hover-Referenz"
          >
            {reference.segment && (
              <line
                aria-label="Erfasste Linienreferenz"
                x1={reference.segment.start.x}
                y1={-reference.segment.start.y}
                x2={reference.segment.end.x}
                y2={-reference.segment.end.y}
                stroke="#929aa3"
                strokeWidth={3}
                strokeDasharray="6 4"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <circle
              cx={reference.point.x}
              cy={-reference.point.y}
              r={10.5 / camera.pixelsPerMetre}
              fill="none"
              stroke="#929aa3"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      {!pan && endpointSnap && (
        <g pointerEvents="none">
          {" "}
          {resolvedHover?.candidate?.guideOrigin && (
            <line
              aria-label="Temporäre Hilfslinie"
              x1={resolvedHover.candidate.guideOrigin.x}
              y1={-resolvedHover.candidate.guideOrigin.y}
              x2={resolvedHover.point.x}
              y2={-resolvedHover.point.y}
              stroke="#929aa3"
              strokeWidth={1}
              strokeDasharray="6 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {resolvedHover?.candidate?.secondaryGuideOrigin && (
            <line
              aria-label="Zweite temporäre Hilfslinie"
              x1={resolvedHover.candidate.secondaryGuideOrigin.x}
              y1={-resolvedHover.candidate.secondaryGuideOrigin.y}
              x2={resolvedHover.point.x}
              y2={-resolvedHover.point.y}
              stroke="#929aa3"
              strokeWidth={1}
              strokeDasharray="6 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </g>
      )}
      {!pan &&
        endpointSnap &&
        resolvedHover?.candidate &&
        (drawing || resolvedHover.candidate.kind !== "grid") && (
          <g
            pointerEvents="none"
            aria-label={`Fanghilfe ${snapLabels[resolvedHover.candidate.kind]}`}
          >
            {resolvedHover.candidate.kind === "midpoint" ? (
              <path
                d={`M ${resolvedHover.point.x} ${-resolvedHover.point.y - 5 / camera.pixelsPerMetre} l ${5 / camera.pixelsPerMetre} ${9 / camera.pixelsPerMetre} h ${-10 / camera.pixelsPerMetre} Z`}
                fill="none"
                stroke="#0284c7"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <circle
                cx={resolvedHover.point.x}
                cy={-resolvedHover.point.y}
                r={4 / camera.pixelsPerMetre}
                fill="none"
                stroke="#0284c7"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            )}
            <text
              x={resolvedHover.point.x + 9 / camera.pixelsPerMetre}
              y={-resolvedHover.point.y - 9 / camera.pixelsPerMetre}
              fontSize={12 / camera.pixelsPerMetre}
              fill="#0284c7"
            >
              {snapLabels[resolvedHover.candidate.kind]}
            </text>
          </g>
        )}
      {selecting && (
        <g pointerEvents="none">
          <rect
            x={camera.center.x - viewSize.width / camera.pixelsPerMetre / 2}
            y={-camera.center.y - viewSize.height / camera.pixelsPerMetre / 2}
            width={viewSize.width / camera.pixelsPerMetre}
            height={viewSize.height / camera.pixelsPerMetre}
            fill="var(--background)"
            opacity={0.65}
          />
          {referenceSelection?.mode === "points" &&
            referenceSelection.points
              .filter((r) => isLayerVisible(project, visibility, r.entityId))
              .map((r) => (
                <circle
                  key={referenceKey(r)}
                  cx={r.point.x}
                  cy={-r.point.y}
                  r={8 / camera.pixelsPerMetre}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth={2 / camera.pixelsPerMetre}
                />
              ))}
          {modelSources.allSegments
            .filter((s) => isLayerVisible(project, visibility, s.source.entityId))
            .filter(
              (s) =>
                referenceSelection?.state.draft?.includes(segmentKey(s.source)) ||
                (referenceSelection?.hot &&
                  segmentKey(referenceSelection.hot) === segmentKey(s.source)),
            )
            .map((s) => (
              <line
                key={segmentKey(s.source)}
                x1={s.start.x}
                y1={-s.start.y}
                x2={s.end.x}
                y2={-s.end.y}
                stroke="#64748b"
                strokeWidth={3 / camera.pixelsPerMetre}
              />
            ))}
        </g>
      )}
      {referenceSelection &&
        (selecting || referenceSelection.selected || (endpointSnap && snap && density.paused)) && (
          <foreignObject
            transform={`translate(${camera.center.x - viewSize.width / camera.pixelsPerMetre / 2 + panelX / camera.pixelsPerMetre} ${-camera.center.y - viewSize.height / camera.pixelsPerMetre / 2 + panelY / camera.pixelsPerMetre}) scale(${1 / camera.pixelsPerMetre})`}
            width={Math.min(440, viewSize.width - 24)}
            height={selecting ? 340 : 90}
          >
            <ReferenceSelectionPanel
              binding={referenceSelection}
              pointsEnabled={trackingContext.enabled}
              pointPreview={previewPoints(referenceSelection.points)}
              onApplyPoints={() => {
                const points = referenceSelection.points;
                const valid = points.every(
                  (r) =>
                    isLayerVisible(project, visibility, r.entityId) &&
                    modelSources.lookup(referenceKey(r)) &&
                    (!snapping || snapping.sources([r]).length > 0),
                );
                if (valid && acquirePoints(points)) referenceSelection.cancel();
              }}
              paused={endpointSnap && snap && density.paused}
              label={(r) => {
                const wi = project.storey.walls.findIndex((w) => w.id === r.entityId);
                const li = project.storey.lines?.findIndex((l) => l.id === r.entityId) ?? -1;
                if (referenceSelection.mode === "points")
                  return `${wi >= 0 ? `Wand ${wi + 1}` : li >= 0 ? `Linie ${li + 1}` : "Hilfsreferenz"} · ${r.kind === "midpoint" ? "Mittelpunkt" : "Punkt"} (${r.point.x.toFixed(2)}; ${r.point.y.toFixed(2)})`;
                return wi >= 0
                  ? `Wand ${wi + 1} · Achse`
                  : `Linie ${li + 1} · Teilsegment ${Number(r.feature.match(/segment-(\d+)/)?.[1] ?? 0) + 1}`;
              }}
            />
          </foreignObject>
        )}
    </svg>
  );
}
