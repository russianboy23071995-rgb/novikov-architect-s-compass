import {
  dimensionLayout,
  formatDimension,
  type DimensionOrientation,
} from "@/domain/elements/dimension/model";

/** Paper sizes of the first, simple display (docs/MASSKETTE.md); refined later by the user. */
const TEXT_MM = 2.5;
const TICK_MM = 1.5;
const TEXT_GAP_MM = 1;

/**
 * One dimension chain in plan coordinates (y up, drawn into the y-flipped plan group): line,
 * extension lines, 45° ticks and the value of every segment. Text and ticks keep their paper
 * size at the current output scale; lines stay thin on screen.
 */
export function DimensionGraphic({
  orientation,
  offset,
  points,
  denominator,
  pixelsPerMetre,
  color,
}: {
  orientation: DimensionOrientation;
  offset: number;
  points: readonly { x: number; y: number }[];
  denominator: number;
  pixelsPerMetre: number;
  color: string;
}) {
  if (points.length < 2) return null;
  const layout = dimensionLayout({ orientation, offset, points });
  if (!layout.segments.length) return null;
  const paper = (mm: number) => (mm / 1000) * denominator;
  const stroke = 1 / pixelsPerMetre;
  const tick = paper(TICK_MM);
  const text = paper(TEXT_MM);
  const gap = paper(TEXT_GAP_MM);
  const svg = (p: { x: number; y: number }) => ({ x: p.x, y: -p.y });
  return (
    <g pointerEvents="none" stroke={color} fill={color}>
      <line
        x1={layout.line.start.x}
        y1={-layout.line.start.y}
        x2={layout.line.end.x}
        y2={-layout.line.end.y}
        strokeWidth={stroke}
      />
      {layout.extensions.map((e, i) => (
        <line
          key={`e${i}`}
          x1={e.start.x}
          y1={-e.start.y}
          x2={e.end.x}
          y2={-e.end.y}
          strokeWidth={stroke}
          strokeOpacity={0.6}
        />
      ))}
      {layout.ticks.map((t, i) => {
        const p = svg(t);
        return (
          <line
            key={`t${i}`}
            x1={p.x - tick / 2}
            y1={p.y + tick / 2}
            x2={p.x + tick / 2}
            y2={p.y - tick / 2}
            strokeWidth={stroke * 2}
          />
        );
      })}
      {layout.segments.map((s, i) => {
        const p = svg(s.centre);
        return (
          <text
            key={`s${i}`}
            x={orientation === "horizontal" ? p.x : p.x - gap}
            y={orientation === "horizontal" ? p.y - gap : p.y}
            fontSize={text}
            stroke="none"
            textAnchor="middle"
            transform={orientation === "vertical" ? `rotate(-90 ${p.x - gap} ${p.y})` : undefined}
            className="select-none"
          >
            {formatDimension(s.value)}
          </text>
        );
      })}
    </g>
  );
}
