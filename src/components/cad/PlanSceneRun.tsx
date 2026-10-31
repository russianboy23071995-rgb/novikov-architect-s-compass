import { DimensionGraphic } from "./DimensionGraphic";
import { dimensionLayout } from "@/domain/elements/dimension/model";
import { cutPaint, wallCutPaint, type CutFill } from "./cut-fill";
import type { ScaleContext } from "@/domain/views/scale";
import { HatchPattern } from "./HatchPattern";
import { LinePattern } from "./LinePattern";
import { CAD_SHIMMER } from "@/rendering/viewport/highlight";
import { memo } from "react";
import type { ElementTarget } from "@/application/selection/target";
import type { Point } from "@/domain/project/schema";
import type { PlanScene, PlanRun } from "@/rendering/viewport/plan-scene";
import type { CornerPreview } from "@/application/walls/corner-preview";
import { checkedImageUrl } from "@/interop/images/import";
import { wallLength } from "@/domain/project/schema";
import { wallBody } from "@/domain/elements/wall/body";
import { roomArea, roomLabelPoint } from "@/domain/elements/room/model";
import { heightLineLabel } from "@/application/rooms/height-lines";

/** Pattern repeat of height lines in model metres (0,50 m ≙ 5 mm at 1:100). */
const HEIGHT_LINE_REPEAT = 0.5;
/** Positions of height line labels along their line, clear of the stamp in the middle. */
const LABEL_POSITIONS = [0.15, 0.85, 0.3, 0.7];
import { WALL_AXIS_COLOR } from "@/rendering/viewport/wall-axis";
import { linePath } from "@/lib/bim/lines";
import { doorPlanPath, doorPlanSymbol } from "@/rendering/viewport/door-symbol";

/** Position number beside an opening, on the side away from a door's swing; kept readable
 * (never upside down) whatever the wall direction. Screen-constant size like other plan text.
 */
function MarkLabel({
  text,
  x,
  side,
  thickness,
  angle,
  pixelsPerMetre,
  visible,
}: {
  text: string | undefined;
  x: number;
  side: 1 | -1;
  thickness: number;
  angle: number;
  pixelsPerMetre: number;
  visible: boolean;
}) {
  if (!text || !visible) return null;
  const y = side * (thickness / 2 + 10 / pixelsPerMetre);
  const flip = Math.cos((angle * Math.PI) / 180) < 0;
  return (
    <text
      x={x}
      y={y}
      transform={flip ? `rotate(180 ${x} ${y})` : undefined}
      fontSize={11 / pixelsPerMetre}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="var(--foreground)"
      pointerEvents="none"
    >
      {text}
    </text>
  );
}

/** Hint colour for overlapping openings (allowed, not an error). */
const OVERLAP_COLOR = "#d97706";

type Props = PlanRun & {
  scene: PlanScene;
  scaleContext: ScaleContext;
  selectedIds: ReadonlySet<string>;
  drawing: boolean;
  placement: boolean;
  pixelsPerMetre: number;
  wallOutlineWidth: number;
  cutFill: CutFill;
  showRenovation: boolean;
  cornerGeometry: CornerPreview["geometry"] | undefined;
  allowsShown: (id: string) => boolean;
  canPick: (id: string) => boolean;
  handlers: {
    secondary: (kind: ElementTarget["kind"], id: string, event: React.MouseEvent) => void;
    click: (kind: ElementTarget["kind"], id: string, event: React.MouseEvent) => void;
    key: (kind: ElementTarget["kind"], id: string, event: React.KeyboardEvent) => void;
  };
};
/** A contiguous paint-order run. Unaffected runs retain every prop across pointer updates. */
export function PlanSceneContent({
  kind,
  ids,
  scene,
  scaleContext,
  selectedIds,
  drawing,
  placement,
  pixelsPerMetre,
  wallOutlineWidth,
  cutFill,
  showRenovation,
  cornerGeometry,
  allowsShown,
  canPick,
  handlers,
}: Props) {
  const plan = {
    references: kind === "reference" ? ids.map((id) => scene.references.get(id)!) : [],
    rooms: kind === "room" ? ids.map((id) => scene.rooms.get(id)!) : [],
    slabs: kind === "slab" ? ids.map((id) => scene.slabs.get(id)!) : [],
    roofs: kind === "roof" ? ids.map((id) => scene.roofs.get(id)!) : [],
    hatches: kind === "hatch" ? ids.map((id) => scene.hatches.get(id)!) : [],
    walls: kind === "wall" ? ids.map((id) => scene.walls.get(id)!) : [],
    columns: kind === "column" ? ids.map((id) => scene.columns.get(id)!) : [],
    dimensions: kind === "dimension" ? ids.map((id) => scene.dimensions.get(id)!) : [],
    lines: kind === "line" ? ids.map((id) => scene.lines.get(id)!) : [],
  };
  const outlines = scene.outlines;
  const selectProps = (kind: ElementTarget["kind"], id: string) => ({
    role: "button",
    "data-plan-pick": "",
    "data-kind": kind,
    "data-id": id,
    tabIndex: drawing ? -1 : 0,
    "aria-label": `Select ${kind} ${id}`,
    "aria-pressed": selectedIds.has(id),
    onContextMenu: (event: React.MouseEvent) => handlers.secondary(kind, id, event),
    onClick: (event: React.MouseEvent) => handlers.click(kind, id, event),
    onKeyDown: (event: React.KeyboardEvent) => handlers.key(kind, id, event),
  });
  return (
    <>
      {plan.references.map((r) => {
        const a = scene.assets.get(r.assetId)!;
        return (
          <g
            key={r.id}
            transform={`translate(${r.origin.x} ${-r.origin.y}) rotate(${(-r.rotation * 180) / Math.PI})`}
          >
            <image
              {...selectProps("reference", r.id)}
              className="cursor-pointer outline-none"
              href={checkedImageUrl(a)}
              width={a.pixelWidth * r.metresPerPixel}
              height={a.pixelHeight * r.metresPerPixel}
              pointerEvents={placement ? "none" : "all"}
            />
            {selectedIds.has(r.id) && (
              <rect
                width={a.pixelWidth * r.metresPerPixel}
                height={a.pixelHeight * r.metresPerPixel}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}
      {plan.rooms.map((room) => {
        const points = room.points.map((p) => `${p.x},${-p.y}`).join(" ");
        const selected = selectedIds.has(room.id);
        const label = roomLabelPoint(room.points);
        const heights = scene.roomHeights.get(room.id);
        const size = 11 / pixelsPerMetre;
        const area = roomArea(room).toLocaleString("de-DE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return (
          <g key={room.id}>
            {/* Light fill, selectable interior; the stamp shows name, number and area (R2). */}
            <polygon
              {...selectProps("room", room.id)}
              aria-label={`Raum ${room.number}`}
              points={points}
              fill="#38bdf8"
              fillOpacity={selected ? 0.16 : 0.07}
              stroke={selected ? "#0284c7" : "none"}
              strokeWidth={1.5}
              strokeDasharray={selected ? "6 3" : undefined}
              vectorEffect="non-scaling-stroke"
              pointerEvents={placement ? "none" : "all"}
              className="cursor-pointer outline-none focus-visible:stroke-sky-300"
            />
            {heights && heights.clear.openPieces.length > 0 && (
              <path
                aria-label={`Raum ohne Höhenquelle ${room.number}`}
                d={heights.clear.openPieces
                  .map((piece) => "M" + piece.map((p) => `${p.x},${-p.y}`).join(" L") + " Z")
                  .join(" ")}
                fill="#f59e0b"
                fillOpacity={0.14}
                pointerEvents="none"
              />
            )}
            {heights?.lines.flatMap((result, lineIndex) =>
              result.segments.map((segment, i) => {
                const { line } = result;
                // Labels staggered along the line, away from the stamp in the middle.
                const at = LABEL_POSITIONS[lineIndex % LABEL_POSITIONS.length]!;
                const mid = {
                  x: segment.start.x + (segment.end.x - segment.start.x) * at,
                  y: segment.start.y + (segment.end.y - segment.start.y) * at,
                };
                let angle =
                  (-Math.atan2(segment.end.y - segment.start.y, segment.end.x - segment.start.x) *
                    180) /
                  Math.PI;
                if (angle > 90) angle -= 180;
                if (angle <= -90) angle += 180;
                const text = heightLineLabel(line);
                return (
                  <g
                    key={`${line.id}-${i}`}
                    aria-label={`Höhenlinie ${text} ${room.number}`}
                    pointerEvents="none"
                  >
                    {/* Colour and line style of the height line (R3b), pattern in model metres. */}
                    <LinePattern
                      line={{
                        points: [segment.start, segment.end],
                        pattern: line.style,
                        repeatLength: HEIGHT_LINE_REPEAT,
                        penWidth: 0.25,
                        color: line.color,
                      }}
                      pixelsPerMetre={pixelsPerMetre}
                    />
                    <text
                      x={mid.x}
                      y={-mid.y}
                      transform={`rotate(${angle} ${mid.x} ${-mid.y})`}
                      dy={-3 / pixelsPerMetre}
                      fontSize={10 / pixelsPerMetre}
                      textAnchor="middle"
                      fill={line.color}
                    >
                      {text}
                    </text>
                  </g>
                );
              }),
            )}
            <text
              aria-label={`Raumstempel ${room.number}`}
              x={label.x}
              y={-label.y}
              fontSize={size}
              textAnchor="middle"
              fill="var(--foreground)"
              pointerEvents="none"
            >
              {room.name && (
                <tspan x={label.x} dy={-size * 0.6} fontWeight={600}>
                  {room.name}
                </tspan>
              )}
              <tspan x={label.x} dy={room.name ? size * 1.2 : 0}>
                {room.number}
              </tspan>
              <tspan x={label.x} dy={size * 1.2}>
                {area} m²
              </tspan>
            </text>
          </g>
        );
      })}
      {plan.roofs.map((roof) => {
        const points = roof.points.map((p) => `${p.x},${-p.y}`).join(" ");
        const selected = selectedIds.has(roof.id);
        const view = scene.roofViews.get(roof.id);
        const line = selected ? "#94a3b8" : "var(--primary)";
        const thin = Math.max(0.5, wallOutlineWidth * 0.6);
        const segments = (list: readonly (readonly [Point, Point])[]) =>
          list.map(([a, b]) => `M${a.x},${-a.y} L${b.x},${-b.y}`).join(" ");
        const { start, end } = roof.referenceLine;
        const length = Math.hypot(end.x - start.x, end.y - start.y);
        const left = { x: -(end.y - start.y) / length, y: (end.x - start.x) / length };
        const rise = roof.rise === "left" ? left : { x: -left.x, y: -left.y };
        const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
        const arrow = 36 / pixelsPerMetre,
          head = 8 / pixelsPerMetre;
        const tip = { x: mid.x + rise.x * arrow, y: mid.y + rise.y * arrow };
        const back = { x: tip.x - rise.x * head, y: tip.y - rise.y * head };
        return (
          <g key={roof.id}>
            {/* Selectable area without stroke; the drawing follows the plan view (D4). */}
            <polygon
              {...selectProps("roof", roof.id)}
              aria-label={`Dach ${roof.id}`}
              points={points}
              fill="none"
              stroke="none"
              pointerEvents={placement ? "none" : "all"}
              className="cursor-pointer outline-none"
            />
            {/* Cut at 1 m like a cut wall; below it thin (seen from above); above it dashed
                (underside seen from below). docs/ROOF_ELEMENT.md, D4. */}
            {view && view.cut.length > 0 && (
              <path
                aria-label={`Dachschnitt ${roof.id}`}
                d={view.cut
                  .map((loop) => "M" + loop.map((p) => `${p.x},${-p.y}`).join(" L") + " Z")
                  .join(" ")}
                fillRule="evenodd"
                {...cutPaint(cutFill)}
                stroke={line}
                strokeWidth={wallOutlineWidth / pixelsPerMetre}
                pointerEvents="none"
              />
            )}
            {view && (
              <path
                aria-label={`Dach unter dem Schnitt ${roof.id}`}
                d={segments(view.below)}
                fill="none"
                stroke={line}
                strokeWidth={thin / pixelsPerMetre}
                pointerEvents="none"
              />
            )}
            {view && (
              <path
                aria-label={`Dach über dem Schnitt ${roof.id}`}
                d={segments(view.above)}
                fill="none"
                stroke={line}
                strokeWidth={thin / pixelsPerMetre}
                strokeDasharray={`${6 / pixelsPerMetre} ${4 / pixelsPerMetre}`}
                pointerEvents="none"
              />
            )}
            {selected && (
              <g pointerEvents="none" aria-label="Bezugslinie und Steigrichtung">
                <line
                  x1={start.x}
                  y1={-start.y}
                  x2={end.x}
                  y2={-end.y}
                  stroke="#0284c7"
                  strokeWidth={1.5}
                  strokeDasharray="8 3 2 3"
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={mid.x}
                  y1={-mid.y}
                  x2={tip.x}
                  y2={-tip.y}
                  stroke="#0284c7"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
                <polygon
                  points={[
                    tip,
                    { x: back.x + rise.y * head * 0.6, y: back.y - rise.x * head * 0.6 },
                    { x: back.x - rise.y * head * 0.6, y: back.y + rise.x * head * 0.6 },
                  ]
                    .map((p) => `${p.x},${-p.y}`)
                    .join(" ")}
                  fill="#0284c7"
                />
              </g>
            )}
          </g>
        );
      })}
      {plan.slabs.map((slab) => {
        const points = slab.points.map((p) => `${p.x},${-p.y}`).join(" ");
        return (
          <g key={slab.id}>
            {/* Contour only, no fill (user decision 29.10.2026): solid line in the wall contour
                colour and width; the interior stays selectable. */}
            <polygon
              {...selectProps("slab", slab.id)}
              aria-label={`Decke ${slab.id}`}
              points={points}
              fill="none"
              stroke={selectedIds.has(slab.id) ? "#94a3b8" : "var(--primary)"}
              strokeWidth={wallOutlineWidth / pixelsPerMetre}
              pointerEvents={placement ? "none" : "all"}
              className="cursor-pointer outline-none focus-visible:stroke-sky-300"
            />
          </g>
        );
      })}
      {plan.hatches.map((hatch) => (
        <g key={hatch.id}>
          {hatch.background.visible && (
            <polygon
              aria-label="Schraffurhintergrund"
              points={hatch.points.map((p) => `${p.x},${-p.y}`).join(" ")}
              fill={hatch.background.color}
              pointerEvents="none"
            />
          )}
          <polygon
            {...selectProps("hatch", hatch.id)}
            points={hatch.points.map((p) => `${p.x},${-p.y}`).join(" ")}
            fill={hatch.pattern ? "transparent" : hatch.fill.color}
            fillOpacity={hatch.fill.opacity}
            stroke="transparent"
            strokeWidth={12}
            vectorEffect="non-scaling-stroke"
            pointerEvents="all"
            className="cursor-pointer outline-none focus-visible:stroke-sky-300"
          />
          {hatch.pattern && (
            <HatchPattern
              context={scaleContext}
              hatch={hatch}
              definition={scene.hatchPatterns.get(hatch.pattern.patternId)!}
              pixelsPerMetre={pixelsPerMetre}
            />
          )}
          {hatch.contour.visible && (
            <polygon
              aria-label="Schraffurkontur"
              points={hatch.points.map((p) => `${p.x},${-p.y}`).join(" ")}
              fill="none"
              stroke={hatch.contour.color}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}
          {selectedIds.has(hatch.id) && (
            <polygon
              points={hatch.points.map((p) => `${p.x},${-p.y}`).join(" ")}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}
        </g>
      ))}
      {plan.walls.map((wall) => {
        const length = wallLength(wall);
        const body = wallBody(wall);
        const angle =
          (-Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * 180) / Math.PI;
        return (
          <g
            key={wall.id}
            transform={`translate(${body.start.x} ${-body.start.y}) rotate(${angle})`}
          >
            <polygon
              {...selectProps("wall", wall.id)}
              points={(
                (!!cornerGeometry &&
                  cornerGeometry.walls.find((w) => w.wallId === wall.id)?.localProfile) ||
                scene.solids.get(wall.id)?.localProfile || [
                  { x: 0, y: -wall.thickness / 2 },
                  { x: length, y: -wall.thickness / 2 },
                  { x: length, y: wall.thickness / 2 },
                  { x: 0, y: wall.thickness / 2 },
                ]
              )
                .map((p) => `${p.x},${-p.y}`)
                .join(" ")}
              {...wallCutPaint(cutFill, showRenovation, wall.renovation)}
              stroke={cornerGeometry ? "var(--primary)" : "none"}
              strokeWidth={wallOutlineWidth / pixelsPerMetre}
              className="outline-none focus-visible:stroke-sky-300"
            />
            {!cornerGeometry && (
              <path
                aria-label={`Wandkontur ${wall.id}`}
                d={(outlines.get(wall.id) ?? [])
                  .map((edge) => {
                    const local = (p: Point) => {
                      const dx = p.x - body.start.x,
                        dy = p.y - body.start.y;
                      return `${dx * body.normal.y - dy * body.normal.x},${-(dx * body.normal.x + dy * body.normal.y)}`;
                    };
                    return `M${local(edge.start)} L${local(edge.end)}`;
                  })
                  .join(" ")}
                fill="none"
                stroke={selectedIds.has(wall.id) ? "#94a3b8" : "var(--primary)"}
                strokeWidth={wallOutlineWidth / pixelsPerMetre}
                pointerEvents="none"
              />
            )}
            {(scene.openings.get(wall.id) ?? []).map((opening) => (
              <g key={opening.id}>
                <rect
                  {...(canPick(opening.id) ? selectProps("window", opening.id) : {})}
                  x={opening.position * length - opening.width / 2}
                  y={-wall.thickness / 2}
                  width={opening.width}
                  height={wall.thickness}
                  fill="var(--background)"
                  stroke={
                    !allowsShown(opening.id)
                      ? "none"
                      : selectedIds.has(opening.id)
                        ? WALL_AXIS_COLOR
                        : scene.overlapping.has(opening.id)
                          ? OVERLAP_COLOR
                          : "var(--primary)"
                  }
                  strokeWidth={wallOutlineWidth / pixelsPerMetre}
                  className="outline-none"
                  style={selectedIds.has(opening.id) ? CAD_SHIMMER : undefined}
                />
                <line
                  visibility={allowsShown(opening.id) ? "visible" : "hidden"}
                  x1={opening.position * length - opening.width / 2}
                  x2={opening.position * length + opening.width / 2}
                  y1={0}
                  y2={0}
                  stroke={selectedIds.has(opening.id) ? WALL_AXIS_COLOR : "var(--primary)"}
                  style={selectedIds.has(opening.id) ? CAD_SHIMMER : undefined}
                  strokeWidth={wallOutlineWidth / pixelsPerMetre}
                  pointerEvents="none"
                />
                <MarkLabel
                  text={opening.mark}
                  x={opening.position * length}
                  side={1}
                  thickness={wall.thickness}
                  angle={angle}
                  pixelsPerMetre={pixelsPerMetre}
                  visible={allowsShown(opening.id)}
                />
              </g>
            ))}
            {(scene.doors.get(wall.id) ?? []).map((door) => {
              const shown = allowsShown(door.id),
                selected = selectedIds.has(door.id);
              const stroke = selected ? WALL_AXIS_COLOR : "var(--primary)";
              const outline = !selected && scene.overlapping.has(door.id) ? OVERLAP_COLOR : stroke;
              return (
                <g key={door.id} aria-label={`Tür ${door.id}`}>
                  <rect
                    {...(canPick(door.id) ? selectProps("door", door.id) : {})}
                    x={door.position * length - door.width / 2}
                    y={-wall.thickness / 2}
                    width={door.width}
                    height={wall.thickness}
                    fill="var(--background)"
                    stroke={shown ? outline : "none"}
                    strokeWidth={wallOutlineWidth / pixelsPerMetre}
                    className="outline-none"
                    style={selected ? CAD_SHIMMER : undefined}
                  />
                  <path
                    visibility={shown ? "visible" : "hidden"}
                    d={doorPlanPath(doorPlanSymbol(door, { length, thickness: wall.thickness }))}
                    fill="none"
                    stroke={stroke}
                    style={selected ? CAD_SHIMMER : undefined}
                    strokeWidth={wallOutlineWidth / pixelsPerMetre}
                    pointerEvents="none"
                  />
                  <MarkLabel
                    text={door.mark}
                    x={door.position * length}
                    side={door.opensTo === "left" ? 1 : -1}
                    thickness={wall.thickness}
                    angle={angle}
                    pixelsPerMetre={pixelsPerMetre}
                    visible={shown}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
      {plan.columns.map((column) => {
        const view = scene.columnViews.get(column.id)!;
        const selected = selectedIds.has(column.id);
        return (
          <polygon
            key={column.id}
            {...selectProps("column", column.id)}
            points={view.outline.map((p) => `${p.x},${-p.y}`).join(" ")}
            // Cut at 1 m like a wall (cut fill, renovation colours); otherwise outline only.
            {...(view.cut
              ? wallCutPaint(cutFill, showRenovation, column.renovation)
              : { fill: "var(--background)", fillOpacity: 0.01 })}
            stroke={selected ? "#94a3b8" : "var(--primary)"}
            strokeWidth={wallOutlineWidth / pixelsPerMetre}
            strokeDasharray={view.cut ? undefined : `${6 / pixelsPerMetre} ${4 / pixelsPerMetre}`}
            pointerEvents={placement ? "none" : "all"}
            className="cursor-pointer outline-none focus-visible:stroke-sky-300"
          />
        );
      })}
      {plan.dimensions.map((dimension) => {
        const { line } = dimensionLayout(dimension);
        const selected = selectedIds.has(dimension.id);
        return (
          <g key={dimension.id}>
            {/* Wide transparent hit band along the dimension line. */}
            <line
              {...selectProps("dimension", dimension.id)}
              x1={line.start.x}
              y1={-line.start.y}
              x2={line.end.x}
              y2={-line.end.y}
              stroke="transparent"
              strokeWidth={10 / pixelsPerMetre}
              pointerEvents={placement ? "none" : "stroke"}
              className="cursor-pointer outline-none"
            />
            <DimensionGraphic
              orientation={dimension.orientation}
              offset={dimension.offset}
              points={dimension.points}
              denominator={scaleContext.denominator}
              pixelsPerMetre={pixelsPerMetre}
              color={selected ? "#0284c7" : "var(--foreground)"}
            />
          </g>
        );
      })}
      {plan.lines.map((line) => (
        <g key={line.id}>
          {selectedIds.has(line.id) && (
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
          {line.style === "custom" ? (
            <LinePattern line={line} pixelsPerMetre={pixelsPerMetre} />
          ) : (
            <path
              d={linePath(line)}
              fill="none"
              stroke={line.color}
              strokeWidth={(line.penWidth * 96) / 25.4}
              strokeDasharray={line.style === "dashed" ? "8 5" : undefined}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}
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
    </>
  );
}
export const PlanSceneRun = memo(PlanSceneContent);
