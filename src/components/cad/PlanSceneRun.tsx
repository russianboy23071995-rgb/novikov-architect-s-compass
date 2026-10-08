import { memo } from "react";
import type { ElementTarget } from "@/application/selection/target";
import type { Point } from "@/domain/project/schema";
import type { PlanScene, PlanRun } from "@/rendering/viewport/plan-scene";
import type { CornerPreview } from "@/application/walls/corner-preview";
import { checkedImageUrl } from "@/interop/images/import";
import { wallLength } from "@/lib/bim/model";
import { wallBody } from "@/domain/elements/wall/body";
import { WALL_AXIS_COLOR } from "@/rendering/viewport/wall-axis";
import { linePath } from "@/lib/bim/lines";

type Props = PlanRun & {
  scene: PlanScene;
  selectedIds: ReadonlySet<string>;
  drawing: boolean;
  placement: boolean;
  pixelsPerMetre: number;
  wallOutlineWidth: number;
  cornerGeometry: CornerPreview["geometry"] | undefined;
  allowsShown: (id: string) => boolean;
  canPick: (id: string) => boolean;
  handlers: {
    click: (kind: ElementTarget["kind"], id: string, event: React.MouseEvent) => void;
    key: (kind: ElementTarget["kind"], id: string, event: React.KeyboardEvent) => void;
  };
};
/** A contiguous paint-order run. Unaffected runs retain every prop across pointer updates. */
export function PlanSceneContent({
  kind,
  ids,
  scene,
  selectedIds,
  drawing,
  placement,
  pixelsPerMetre,
  wallOutlineWidth,
  cornerGeometry,
  allowsShown,
  canPick,
  handlers,
}: Props) {
  const plan = {
    references: kind === "reference" ? ids.map((id) => scene.references.get(id)!) : [],
    hatches: kind === "hatch" ? ids.map((id) => scene.hatches.get(id)!) : [],
    walls: kind === "wall" ? ids.map((id) => scene.walls.get(id)!) : [],
    lines: kind === "line" ? ids.map((id) => scene.lines.get(id)!) : [],
  };
  const outlines = scene.outlines;
  const selectProps = (kind: ElementTarget["kind"], id: string) => ({
    role: "button",
    tabIndex: drawing ? -1 : 0,
    "aria-label": `Select ${kind} ${id}`,
    "aria-pressed": selectedIds.has(id),
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
            fill={hatch.fill.color}
            fillOpacity={hatch.fill.opacity}
            stroke="transparent"
            strokeWidth={12}
            vectorEffect="non-scaling-stroke"
            pointerEvents="all"
            className="cursor-pointer outline-none focus-visible:stroke-sky-300"
          />
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
              fill="var(--muted-foreground)"
              fillOpacity={0.55}
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
                        : "var(--primary)"
                  }
                  strokeWidth={wallOutlineWidth / pixelsPerMetre}
                  className="outline-none"
                />
                <line
                  visibility={allowsShown(opening.id) ? "visible" : "hidden"}
                  x1={opening.position * length - opening.width / 2}
                  x2={opening.position * length + opening.width / 2}
                  y1={0}
                  y2={0}
                  stroke="var(--primary)"
                  strokeWidth={wallOutlineWidth / pixelsPerMetre}
                  pointerEvents="none"
                />
              </g>
            ))}
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
    </>
  );
}
export const PlanSceneRun = memo(PlanSceneContent);
