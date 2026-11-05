import { TextGraphic } from "./TextGraphic";
import { StairPlanGraphic } from "./StairPlanGraphic";
import { measuredTextWidth } from "./text-measure";
import { textBlock, textHeight } from "@/domain/elements/text/model";
import { DimensionGraphic } from "./DimensionGraphic";
import { dimensionLayout } from "@/domain/elements/dimension/model";
import { cutPaint, wallCutPaint, type CutFill } from "./cut-fill";
import type { ScaleContext } from "@/domain/views/scale";
import { HatchPattern } from "./HatchPattern";
import { WallLayerGraphic } from "./WallLayerGraphic";
import { LinePattern } from "./LinePattern";
import { CAD_SHIMMER } from "@/rendering/viewport/highlight";
import { memo } from "react";
import type { ElementTarget } from "@/application/selection/target";
import type { Point } from "@/domain/project/schema";
import { planRunJoints, type PlanScene, type PlanRun } from "@/rendering/viewport/plan-scene";
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
import { RAILING_MEMBERS } from "@/domain/elements/railing/model";
import { doorPlanPath, doorPlanSymbol } from "@/rendering/viewport/door-symbol";
import {
  doorPlanFrame,
  planRectPath,
  windowPlanSymbol,
} from "@/rendering/viewport/opening-plan-symbol";

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

/** Props that make a drawn element selectable (click, context menu, keys, aria-pressed). */
const selectPropsFor =
  (selectedIds: ReadonlySet<string>, drawing: boolean, handlers: Props["handlers"]) =>
  (kind: ElementTarget["kind"], id: string) => ({
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

type PlanWallScene = PlanScene["walls"] extends ReadonlyMap<string, infer W> ? W : never;
type WallProps = Pick<
  Props,
  | "scene"
  | "selectedIds"
  | "drawing"
  | "pixelsPerMetre"
  | "wallOutlineWidth"
  | "cutFill"
  | "showRenovation"
  | "cornerGeometry"
  | "allowsShown"
  | "canPick"
  | "handlers"
> & { wall: PlanWallScene };
/** Ids whose selection a wall shows: the wall, its windows and its doors. */
const WALL_PROPS = [
  "wall",
  "scene",
  "drawing",
  "pixelsPerMetre",
  "wallOutlineWidth",
  "cutFill",
  "showRenovation",
  "cornerGeometry",
  "allowsShown",
  "canPick",
  "handlers",
] as const satisfies readonly Exclude<keyof WallProps, "selectedIds">[];
/** Same wall drawing: every prop unchanged, the selection only as far as this wall shows it,
 * i.e. the wall, its windows and its doors (docs/TABS.md, Auswahlklick Schritt 2). A click then
 * re-renders only the walls whose highlight changes. Checked without building lists: it runs
 * for every wall on every click. */
function sameWall(prev: WallProps, next: WallProps) {
  for (const key of WALL_PROPS) if (!Object.is(prev[key], next[key])) return false;
  const a = prev.selectedIds,
    b = next.selectedIds;
  if (a === b) return true;
  const id = next.wall.id;
  if (a.has(id) !== b.has(id)) return false;
  for (const o of next.scene.openings.get(id) ?? []) if (a.has(o.id) !== b.has(o.id)) return false;
  for (const d of next.scene.doors.get(id) ?? []) if (a.has(d.id) !== b.has(d.id)) return false;
  return true;
}
/** One wall of the plan with its windows and doors, memoised (see sameWall). */
const PlanWall = memo(function PlanWall({
  wall,
  scene,
  selectedIds,
  drawing,
  pixelsPerMetre,
  wallOutlineWidth,
  cutFill,
  showRenovation,
  cornerGeometry,
  allowsShown,
  canPick,
  handlers,
}: WallProps) {
  const outlines = scene.outlines;
  const bands =
    showRenovation && wall.renovation && wall.renovation !== "existing"
      ? undefined
      : scene.wallLayers.get(wall.id);
  const selectProps = selectPropsFor(selectedIds, drawing, handlers);
  const length = wallLength(wall);
  const body = wallBody(wall);
  const angle = (-Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * 180) / Math.PI;
  const profile = (!!cornerGeometry &&
    cornerGeometry.walls.find((w) => w.wallId === wall.id)?.localProfile) ||
    scene.solids.get(wall.id)?.localProfile || [
      { x: 0, y: -wall.thickness / 2 },
      { x: length, y: -wall.thickness / 2 },
      { x: length, y: wall.thickness / 2 },
      { x: 0, y: wall.thickness / 2 },
    ];
  return (
    <g key={wall.id} transform={`translate(${body.start.x} ${-body.start.y}) rotate(${angle})`}>
      {bands && (
        <WallLayerGraphic
          profile={profile}
          bands={bands}
          pixelsPerMetre={pixelsPerMetre}
          lineWidth={wallOutlineWidth}
        />
      )}
      <polygon
        {...selectProps("wall", wall.id)}
        points={profile.map((p) => `${p.x},${-p.y}`).join(" ")}
        {...(bands
          ? { fill: "var(--background)", fillOpacity: 0 }
          : wallCutPaint(cutFill, showRenovation, wall.renovation))}
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
      {(scene.openings.get(wall.id) ?? []).map((opening) => {
        // Window element (FT3): jambs cut, glass pane, boards seen below the cut.
        const symbol = windowPlanSymbol(opening, wall);
        const line = selectedIds.has(opening.id) ? WALL_AXIS_COLOR : "var(--primary)";
        return (
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
            {symbol ? (
              <g
                aria-label={`Fensterelement ${opening.mark ?? opening.id}`}
                visibility={allowsShown(opening.id) ? "visible" : "hidden"}
                fill="none"
                stroke={line}
                style={selectedIds.has(opening.id) ? CAD_SHIMMER : undefined}
                pointerEvents="none"
              >
                <path
                  d={planRectPath(symbol.sills)}
                  strokeWidth={(0.5 * wallOutlineWidth) / pixelsPerMetre}
                />
                <path
                  d={planRectPath(symbol.jambs)}
                  fill="var(--background)"
                  strokeWidth={wallOutlineWidth / pixelsPerMetre}
                />
                <path
                  d={planRectPath(symbol.glasses)}
                  strokeWidth={(0.5 * wallOutlineWidth) / pixelsPerMetre}
                />
              </g>
            ) : (
              <line
                visibility={allowsShown(opening.id) ? "visible" : "hidden"}
                x1={opening.position * length - opening.width / 2}
                x2={opening.position * length + opening.width / 2}
                y1={0}
                y2={0}
                stroke={line}
                style={selectedIds.has(opening.id) ? CAD_SHIMMER : undefined}
                strokeWidth={wallOutlineWidth / pixelsPerMetre}
                pointerEvents="none"
              />
            )}
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
        );
      })}
      {(scene.doors.get(wall.id) ?? []).map((door) => {
        const shown = allowsShown(door.id),
          selected = selectedIds.has(door.id);
        const stroke = selected ? WALL_AXIS_COLOR : "var(--primary)";
        const outline = !selected && scene.overlapping.has(door.id) ? OVERLAP_COLOR : stroke;
        // Door element (FT3): frame jambs cut; the leaf swings in the clear width.
        const frame = doorPlanFrame(door, wall);
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
              d={doorPlanPath(
                doorPlanSymbol(frame ? { ...door, width: frame.leafWidth } : door, {
                  length,
                  thickness: wall.thickness,
                }),
              )}
              fill="none"
              stroke={stroke}
              style={selected ? CAD_SHIMMER : undefined}
              strokeWidth={wallOutlineWidth / pixelsPerMetre}
              pointerEvents="none"
            />
            {frame && (
              <path
                aria-label={`Türzarge ${door.mark ?? door.id}`}
                visibility={shown ? "visible" : "hidden"}
                d={planRectPath(frame.jambs)}
                fill="var(--background)"
                stroke={stroke}
                style={selected ? CAD_SHIMMER : undefined}
                strokeWidth={wallOutlineWidth / pixelsPerMetre}
                pointerEvents="none"
              />
            )}
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
}, sameWall);

type PlanLineScene = PlanScene["lines"] extends ReadonlyMap<string, infer L> ? L : never;
type LineProps = Pick<Props, "selectedIds" | "drawing" | "pixelsPerMetre" | "handlers"> & {
  line: PlanLineScene;
};
/** Same line drawing: every prop unchanged, the selection only for this line (docs/TABS.md). */
function sameLine(prev: LineProps, next: LineProps) {
  return (
    prev.line === next.line &&
    prev.drawing === next.drawing &&
    prev.pixelsPerMetre === next.pixelsPerMetre &&
    prev.handlers === next.handlers &&
    (prev.selectedIds === next.selectedIds ||
      prev.selectedIds.has(next.line.id) === next.selectedIds.has(next.line.id))
  );
}
/** One line of the plan, memoised (see sameLine): a click re-renders only the lines whose
 * highlight changes (docs/TABS.md, Rest beim Auswählen). */
const PlanLine = memo(function PlanLine({
  line,
  selectedIds,
  drawing,
  pixelsPerMetre,
  handlers,
}: LineProps) {
  const selectProps = selectPropsFor(selectedIds, drawing, handlers);
  return (
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
  );
}, sameLine);

/** Lines per memoised block: a click then reconciles the blocks and the lines of one block
 * instead of every line of the plan (docs/TABS.md, Rest beim Auswählen). */
const LINE_CHUNK = 64;
function lineChunks(lines: PlanLineScene[]) {
  const chunks: PlanLineScene[][] = [];
  for (let i = 0; i < lines.length; i += LINE_CHUNK) chunks.push(lines.slice(i, i + LINE_CHUNK));
  return chunks;
}
type LineChunkProps = Omit<LineProps, "line"> & { lines: PlanLineScene[] };
function sameLineChunk(prev: LineChunkProps, next: LineChunkProps) {
  if (
    prev.lines.length !== next.lines.length ||
    prev.drawing !== next.drawing ||
    prev.pixelsPerMetre !== next.pixelsPerMetre ||
    prev.handlers !== next.handlers
  )
    return false;
  for (let i = 0; i < next.lines.length; i++) {
    const line = next.lines[i]!;
    if (prev.lines[i] !== line) return false;
    if (
      prev.selectedIds !== next.selectedIds &&
      prev.selectedIds.has(line.id) !== next.selectedIds.has(line.id)
    )
      return false;
  }
  return true;
}
/** A block of lines, memoised (see sameLineChunk); its lines stay memoised one by one. */
const PlanLineChunk = memo(function PlanLineChunk({ lines, ...rest }: LineChunkProps) {
  return (
    <>
      {lines.map((line) => (
        <PlanLine key={line.id} line={line} {...rest} />
      ))}
    </>
  );
}, sameLineChunk);

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
    slabOpenings: kind === "slabOpening" ? ids.map((id) => scene.slabOpenings.get(id)!) : [],
    roofs: kind === "roof" ? ids.map((id) => scene.roofs.get(id)!) : [],
    hatches: kind === "hatch" ? ids.map((id) => scene.hatches.get(id)!) : [],
    walls: kind === "wall" ? ids.map((id) => scene.walls.get(id)!) : [],
    columns: kind === "column" ? ids.map((id) => scene.columns.get(id)!) : [],
    stairs: kind === "stair" ? ids.map((id) => scene.stairs.get(id)!) : [],
    railings: kind === "railing" ? ids.map((id) => scene.railings.get(id)!) : [],
    roofWindows: kind === "roofWindow" ? ids.map((id) => scene.roofWindows.get(id)!) : [],
    objects: kind === "object" ? ids.map((id) => scene.objects.get(id)!) : [],
    terrains: kind === "terrain" ? ids.map((id) => scene.terrains.get(id)!) : [],
    dimensions: kind === "dimension" ? ids.map((id) => scene.dimensions.get(id)!) : [],
    texts: kind === "text" ? ids.map((id) => scene.texts.get(id)!) : [],
    lines: kind === "line" ? ids.map((id) => scene.lines.get(id)!) : [],
  };
  const outlines = scene.outlines;
  // Layers of the build-up (docs/WANDAUFBAU.md, SA2); a shown Neubau/Abbruch colour wins.
  const shownLayers = (wall: (typeof plan.walls)[number]) =>
    showRenovation && wall.renovation && wall.renovation !== "existing"
      ? undefined
      : scene.wallLayers.get(wall.id);
  const selectProps = selectPropsFor(selectedIds, drawing, handlers);
  // A T joint is drawn once, above both of its walls (not repeated in every run).
  const runJoints = kind === "wall" ? planRunJoints(scene, ids) : [];
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
              strokeWidth={0}
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
      {plan.slabOpenings.map(({ opening, symbol }) => {
        // Template of the user (docs/DECKENDURCHBRUCH.md): outline with a symmetric black corner
        // wedge, a circle with its upper left half black; slab contour colour and width.
        const ink = selectedIds.has(opening.id) ? "#94a3b8" : "var(--primary)";
        const width = wallOutlineWidth / pixelsPerMetre;
        const pick = {
          ...selectProps("slabOpening", opening.id),
          "aria-label": `Deckendurchbruch ${opening.id}`,
          fill: "transparent",
          stroke: ink,
          strokeWidth: width,
          pointerEvents: placement ? ("none" as const) : ("all" as const),
          className: "cursor-pointer outline-none focus-visible:stroke-sky-300",
        };
        const ring = (points: readonly { x: number; y: number }[]) =>
          points.map((p) => `${p.x},${-p.y}`).join(" ");
        return (
          <g key={opening.id} data-slab-opening={opening.id}>
            {symbol.kind === "circle" ? (
              <>
                <path
                  data-symbol="half"
                  d={`M ${symbol.half[0].x} ${-symbol.half[0].y} A ${symbol.radius} ${symbol.radius} 0 0 0 ${symbol.half[1].x} ${-symbol.half[1].y} Z`}
                  fill={ink}
                  pointerEvents="none"
                />
                <circle {...pick} cx={symbol.center.x} cy={-symbol.center.y} r={symbol.radius} />
              </>
            ) : (
              <>
                {symbol.wedge && (
                  <polygon
                    data-symbol="wedge"
                    points={ring(symbol.wedge)}
                    fill={ink}
                    pointerEvents="none"
                  />
                )}
                <polygon {...pick} points={ring(symbol.outline)} />
              </>
            )}
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
      {plan.walls.map((wall) => (
        <PlanWall
          key={wall.id}
          wall={wall}
          scene={scene}
          selectedIds={selectedIds}
          drawing={drawing}
          pixelsPerMetre={pixelsPerMetre}
          wallOutlineWidth={wallOutlineWidth}
          cutFill={cutFill}
          showRenovation={showRenovation}
          cornerGeometry={cornerGeometry}
          allowsShown={allowsShown}
          canPick={canPick}
          handlers={handlers}
        />
      ))}
      {runJoints.map((joint) => {
        // Incoming core through the host's cover layers at a T joint (L09 U2), drawn above both
        // walls; only where both walls show their layers.
        const wall = scene.walls.get(joint.wallId),
          host = scene.walls.get(joint.hostWallId);
        if (!wall || !host || !shownLayers(wall) || !shownLayers(host)) return null;
        const body = wallBody(wall);
        const angle =
          (-Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * 180) / Math.PI;
        return (
          <g
            key={`${joint.hostWallId}>${joint.wallId}`}
            aria-label={`Schichtstoß ${joint.wallId}`}
            transform={`translate(${body.start.x} ${-body.start.y}) rotate(${angle})`}
          >
            <WallLayerGraphic
              profile={joint.profile}
              bands={joint.bands}
              pixelsPerMetre={pixelsPerMetre}
              lineWidth={wallOutlineWidth}
              edges
            />
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
      {plan.stairs.map((stair) => {
        const view = scene.stairViews.get(stair.id)!;
        return (
          <g key={stair.id}>
            {/* Transparent pick area over the whole flight. */}
            <polygon
              {...selectProps("stair", stair.id)}
              points={view.outline.map((p) => `${p.x},${-p.y}`).join(" ")}
              fill="var(--background)"
              fillOpacity={0.01}
              stroke="none"
              strokeWidth={0}
              pointerEvents={placement ? "none" : "all"}
              className="cursor-pointer outline-none"
            />
            <StairPlanGraphic
              plan={view}
              pixelsPerMetre={pixelsPerMetre}
              color={selectedIds.has(stair.id) ? "#0284c7" : "var(--primary)"}
              width={wallOutlineWidth}
            />
          </g>
        );
      })}
      {plan.terrains.map((terrain) => {
        // Terrain (docs/GELAENDE.md, G2): outline, contour lines, height points with their level.
        // Only the outline picks, so a click inside stays free for what lies on the terrain.
        const selected = selectedIds.has(terrain.id);
        const color = selected ? "#0284c7" : "#6f8a55";
        const label = 11 / pixelsPerMetre;
        return (
          <g key={terrain.id} aria-label={`Gelände ${terrain.id}`}>
            {scene.terrainViews.get(terrain.id)!.map(({ a, b }, i) => (
              <line
                key={i}
                x1={a.x}
                y1={-a.y}
                x2={b.x}
                y2={-b.y}
                stroke={color}
                strokeOpacity={0.55}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            ))}
            <polygon
              {...selectProps("terrain", terrain.id)}
              points={terrain.outline.map((p) => `${p.x},${-p.y}`).join(" ")}
              fill="none"
              stroke={color}
              strokeWidth={selected ? 2 : 1.2}
              vectorEffect="non-scaling-stroke"
              pointerEvents={placement ? "none" : "stroke"}
              className="cursor-pointer outline-none"
            />
            {[...terrain.outline, ...terrain.points].map((p, i) => (
              <g key={i} pointerEvents="none">
                <circle cx={p.x} cy={-p.y} r={2.5 / pixelsPerMetre} fill={color} />
                <text
                  x={p.x + 5 / pixelsPerMetre}
                  y={-p.y - 4 / pixelsPerMetre}
                  fontSize={label}
                  fill={color}
                >
                  {(p.z >= 0 ? "+" : "") + p.z.toFixed(2).replace(".", ",")}
                </text>
              </g>
            ))}
          </g>
        );
      })}
      {plan.objects.map((object) => {
        // Object (docs/OBJEKTBIBLIOTHEK.md, O1): its catalogue symbol seen from above in thin
        // lines; the outlines of its parts are the pick area. "all" also hits the invisible stroke
        // of width 1 (one metre here), so pick areas without a line set it to 0.
        const view = scene.objectViews.get(object.id)!;
        const selected = selectedIds.has(object.id);
        const color = selected ? "#0284c7" : "var(--primary)";
        const outline = view.outline.map((p) => `${p.x},${-p.y}`).join(" ");
        return (
          <g key={object.id} aria-label={`Objekt ${object.id}`}>
            {selected && (
              <polygon
                points={outline}
                fill="#38bdf8"
                fillOpacity={0.15}
                stroke="#38bdf8"
                strokeOpacity={0.5}
                strokeWidth={4}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )}
            {view.pick.map((ring, i) => (
              <polygon
                key={i}
                {...selectProps("object", object.id)}
                points={ring.map((p) => `${p.x},${-p.y}`).join(" ")}
                fill="var(--background)"
                fillOpacity={0.01}
                stroke="none"
                strokeWidth={0}
                pointerEvents={placement ? "none" : "all"}
                className="cursor-pointer outline-none"
              />
            ))}
            {view.symbol.map((part, i) => {
              const d =
                part.points.map((p, k) => `${k ? "L" : "M"}${p.x},${-p.y}`).join(" ") +
                (part.closed ? " Z" : "");
              return (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={0.8}
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
              );
            })}
          </g>
        );
      })}
      {plan.roofWindows.map((window) => {
        // Roof window (docs/DACHFLAECHENFENSTER.md, D2): above the 1 m cut, so its opening is
        // dashed like the roof outline above the cut, with a cross as the window symbol.
        const ring = scene.roofWindowViews.get(window.id);
        if (!ring) return null;
        const points = ring.map((p) => `${p.x},${-p.y}`).join(" ");
        const selected = selectedIds.has(window.id);
        const color = selected ? "#0284c7" : "var(--primary)";
        const [a, b, c, d] = ring;
        return (
          <g key={window.id} aria-label={`Dachflächenfenster ${window.id}`}>
            {selected && (
              <polygon
                points={points}
                fill="#38bdf8"
                fillOpacity={0.15}
                stroke="#38bdf8"
                strokeOpacity={0.5}
                strokeWidth={4}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )}
            <polygon
              {...selectProps("roofWindow", window.id)}
              points={points}
              fill="var(--background)"
              fillOpacity={0.01}
              stroke={color}
              strokeWidth={1.2}
              strokeDasharray={`${6 / pixelsPerMetre} ${3 / pixelsPerMetre}`}
              vectorEffect="non-scaling-stroke"
              pointerEvents={placement ? "none" : "all"}
              className="cursor-pointer outline-none"
            />
            <path
              d={`M${a!.x},${-a!.y} L${c!.x},${-c!.y} M${b!.x},${-b!.y} L${d!.x},${-d!.y}`}
              fill="none"
              stroke={color}
              strokeWidth={0.8}
              strokeDasharray={`${6 / pixelsPerMetre} ${3 / pixelsPerMetre}`}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          </g>
        );
      })}
      {plan.railings.map((railing) => {
        // Railing (docs/GELAENDER.md, G2): the handrail in true width along the line, a thin
        // centre line that stays visible at every scale, and the posts in true size.
        const view = scene.railingViews.get(railing.id)!;
        const d = railing.points.map((p, i) => `${i ? "L" : "M"}${p.x},${-p.y}`).join(" ");
        const color = selectedIds.has(railing.id) ? "#0284c7" : "var(--primary)";
        return (
          <g key={railing.id} aria-label={`Geländer ${railing.id}`}>
            {selectedIds.has(railing.id) && (
              <path
                d={d}
                fill="none"
                stroke="#38bdf8"
                strokeOpacity={0.4}
                strokeWidth={5}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )}
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeOpacity={0.35}
              strokeWidth={RAILING_MEMBERS.handrail}
              strokeLinejoin="miter"
              pointerEvents="none"
            />
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={1}
              strokeDasharray={
                railing.infill === "panel"
                  ? undefined
                  : `${6 / pixelsPerMetre} ${3 / pixelsPerMetre}`
              }
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
            {view.posts.map((corners, i) => (
              <polygon
                key={i}
                points={corners.map((p) => `${p.x},${-p.y}`).join(" ")}
                fill={color}
                stroke="none"
                pointerEvents="none"
              />
            ))}
            <path
              {...selectProps("railing", railing.id)}
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={12}
              vectorEffect="non-scaling-stroke"
              pointerEvents={placement ? "none" : "stroke"}
              className="cursor-pointer outline-none focus-visible:stroke-sky-300/40"
            />
          </g>
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
              terminator={dimension.terminator}
              units={dimension.units}
              textSize={dimension.textSize}
            />
          </g>
        );
      })}
      {plan.texts.map((text) => {
        // Selection follows the drawn block: measured width, background padding included.
        const h = textHeight(text, scaleContext.denominator);
        const box = textBlock(
          text,
          scaleContext.denominator,
          measuredTextWidth(text) * h,
          (text.background?.padding ?? 0) * h,
        );
        const selected = selectedIds.has(text.id);
        return (
          <g key={text.id}>
            <polygon
              {...selectProps("text", text.id)}
              points={box.map((p) => `${p.x},${-p.y}`).join(" ")}
              fill="transparent"
              stroke={selected ? "#0284c7" : "none"}
              strokeWidth={1 / pixelsPerMetre}
              strokeDasharray={`${4 / pixelsPerMetre} ${3 / pixelsPerMetre}`}
              pointerEvents={placement ? "none" : "all"}
              className="cursor-pointer outline-none"
            />
            <TextGraphic
              text={text}
              denominator={scaleContext.denominator}
              pixelsPerMetre={pixelsPerMetre}
            />
          </g>
        );
      })}
      {lineChunks(plan.lines).map((lines) => (
        <PlanLineChunk
          key={lines[0]!.id}
          lines={lines}
          selectedIds={selectedIds}
          drawing={drawing}
          pixelsPerMetre={pixelsPerMetre}
          handlers={handlers}
        />
      ))}
    </>
  );
}
export const PlanSceneRun = memo(PlanSceneContent);
