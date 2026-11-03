import { memo } from "react";
import type { SectionHeightMarks } from "@/domain/views/sections";
import type { SectionDrawing, SectionPoint } from "@/rendering/viewport/section-drawing";
import { cutPaint, type CutFill } from "./cut-fill";
import { MARK_PAPER, sectionGraphicExtent } from "./section-graphic";
import { HeightMark } from "./HeightMark";
import { segmentPath } from "./section-paths";
import { SectionLayerGraphic } from "./SectionLayerGraphic";
import { CAD_TURQUOISE } from "@/rendering/viewport/highlight";

const svgPoints = (points: readonly SectionPoint[]) =>
  points.map((p) => `${p.x},${-p.y}`).join(" ");
const loopPath = (loops: readonly SectionPoint[][]) =>
  loops.map((loop) => `M${svgPoints(loop).replaceAll(" ", " L")} Z`).join(" ");
/** Line weights of cut outlines: building parts heavy, frames medium, glass thin. */
const stroke = { part: 1.75, frame: 1.1, glass: 0.6 } as const;
/** Hatch spacing of cut layers: 1,5 mm on paper. */
const HATCH_PAPER = 0.0015;

/**
 * The drawn section or elevation (docs/SCHNITT.md, SC3): the view beyond, storey levels with
 * height marks, cut parts in the cut fill and the border at both ends of the line. SVG in
 * drawing metres, y flipped. Shared by the section tab and a section placed on a layout
 * (docs/ZEICHNUNG.md, ZW4); there the height marks are drawn here too (`marks`), in the tab
 * they stay editable and are drawn by the tab. Selected elements (`selectedIds`, e.g. found by the
 * filter, docs/FILTER.md) are drawn in the selection colour.
 *
 * Memoised: zooming and panning change only the view box of the surrounding SVG, never this
 * content (docs/performance/SECTION_ZOOM.md).
 */
export const SectionGraphic = memo(function SectionGraphic({
  drawing,
  cutFill,
  denominator,
  marks,
  selectedIds,
}: {
  drawing: SectionDrawing;
  cutFill: CutFill;
  denominator: number;
  marks?: readonly SectionHeightMarks[] | undefined;
  selectedIds?: ReadonlySet<string> | undefined;
}) {
  const paint = cutPaint(cutFill);
  const mark = MARK_PAPER * denominator;
  const markGap = mark * 1.5;
  const extent = sectionGraphicExtent(drawing, denominator);
  const picked = (id: string) => selectedIds?.has(id) ?? false;
  const ink = (id: string) => (picked(id) ? CAD_TURQUOISE : "var(--foreground)");
  return (
    <>
      <g aria-label="Ansicht">
        {drawing.views.map((v, i) => (
          <g key={i} data-element-id={v.id} data-selected={picked(v.id) || undefined}>
            <polygon points={svgPoints(v.points)} fill="var(--background)" />
            {picked(v.id) && (
              <polygon points={svgPoints(v.points)} fill={CAD_TURQUOISE} fillOpacity={0.25} />
            )}
            {v.edges.length > 0 && (
              <path
                d={segmentPath(v.edges)}
                fill="none"
                stroke={ink(v.id)}
                strokeWidth={picked(v.id) ? 1.25 : 0.75}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {v.marks && v.marks.segments.length > 0 && (
              <path
                d={segmentPath(v.marks.segments)}
                fill="none"
                stroke="var(--foreground)"
                strokeWidth={0.6}
                // A dash pattern starts anew with every segment, as with separate lines.
                strokeDasharray={v.marks.dashed ? "6 4" : undefined}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        ))}
      </g>
      <g aria-label="Geschosse">
        {drawing.levels.map((level) => (
          <g key={level.storeyId}>
            <line
              x1={0}
              y1={-level.elevation}
              x2={drawing.width}
              y2={-level.elevation}
              stroke="var(--muted-foreground)"
              strokeWidth={0.75}
              strokeDasharray="8 4"
              vectorEffect="non-scaling-stroke"
            />
            <HeightMark
              x={-markGap}
              z={level.elevation}
              side="left"
              kind="shell"
              size={mark}
              name={level.name}
              reach={0}
            />
            <HeightMark
              x={drawing.width + markGap}
              z={level.elevation}
              side="right"
              kind="shell"
              size={mark}
              name={level.name}
              reach={drawing.width}
            />
          </g>
        ))}
      </g>
      <g aria-label="Geschnittene Bauteile">
        {drawing.cuts.map((cut) => (
          <g key={cut.id} data-element-id={cut.id} data-selected={picked(cut.id) || undefined}>
            {cut.layers && cut.loops.length > 0 && (
              <SectionLayerGraphic
                clip={loopPath(cut.loops)}
                layers={cut.layers}
                bottom={Math.min(...cut.loops.flat().map((p) => p.y))}
                top={Math.max(...cut.loops.flat().map((p) => p.y))}
                hatch={HATCH_PAPER * denominator}
              />
            )}
            {cut.loops.length > 0 && (
              <path
                d={loopPath(cut.loops)}
                fillRule="evenodd"
                // Building parts in the cut fill; window and door frames and glass are
                // outlines over the background (docs/FENSTER_TUEREN.md, FT2).
                // Walls with a build-up show their layers below (docs/WANDAUFBAU.md, SA3).
                fill={cut.layers ? "none" : cut.kind === "part" ? paint.fill : "var(--background)"}
                fillOpacity={cut.kind === "part" ? paint.fillOpacity : 1}
                stroke={ink(cut.id)}
                strokeWidth={stroke[cut.kind]}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {picked(cut.id) && cut.loops.length > 0 && (
              <path
                d={loopPath(cut.loops)}
                fillRule="evenodd"
                fill={CAD_TURQUOISE}
                fillOpacity={0.55}
              />
            )}
            {cut.open.map((piece, i) => (
              <polyline
                key={i}
                points={svgPoints(piece)}
                fill="none"
                stroke={ink(cut.id)}
                strokeWidth={stroke[cut.kind]}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        ))}
      </g>
      <g aria-label="Rand">
        {[0, drawing.width].map((x) => (
          <line
            key={x}
            x1={x}
            y1={-extent.maxY + 0.5}
            x2={x}
            y2={-extent.minY - 0.5}
            stroke="var(--foreground)"
            strokeWidth={0.75}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {marks && (
        <g aria-label="Höhenkoten">
          {marks.map((set) => (
            <g key={set.id}>
              {set.points.map((p, i) => (
                <HeightMark
                  key={i}
                  x={set.x}
                  z={p.z}
                  side={p.x <= set.x ? "right" : "left"}
                  kind={set.kind}
                  size={mark}
                  reach={p.x}
                />
              ))}
            </g>
          ))}
        </g>
      )}
    </>
  );
});
