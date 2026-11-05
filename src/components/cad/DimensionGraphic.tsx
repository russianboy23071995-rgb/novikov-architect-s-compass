import {
  DIMENSION_STYLE_DEFAULTS,
  dimensionFigure,
  dimensionLayout,
  type DimensionOrientation,
  type DimensionTerminator,
  type DimensionUnits,
} from "@/domain/elements/dimension/model";

/** Paper sizes after building drawing practice (docs/MASSKETTE.md, Darstellung). */
const TICK_MM = 2;
const TEXT_GAP_MM = 0.8;
/** Extension lines run a little past the dimension line. */
const OVERSHOOT_MM = 1.5;

/**
 * One dimension chain in plan coordinates (y up, drawn into the y-flipped plan group): line,
 * extension lines with overshoot, the chosen terminator at every station and the figure of
 * every segment above the line (read from below or from the right), half centimetres as a
 * superscript 5. Paper sizes follow the output scale; lines stay thin on screen.
 */
export function DimensionGraphic({
  orientation,
  offset,
  points,
  denominator,
  pixelsPerMetre,
  color,
  terminator = DIMENSION_STYLE_DEFAULTS.terminator,
  units = DIMENSION_STYLE_DEFAULTS.units,
  textSize = DIMENSION_STYLE_DEFAULTS.textSize,
}: {
  orientation: DimensionOrientation;
  offset: number;
  points: readonly { x: number; y: number }[];
  denominator: number;
  pixelsPerMetre: number;
  color: string;
  terminator?: DimensionTerminator | undefined;
  units?: DimensionUnits | undefined;
  textSize?: number | undefined;
}) {
  if (points.length < 2) return null;
  const layout = dimensionLayout({ orientation, offset, points });
  if (!layout.segments.length) return null;
  const paper = (mm: number) => (mm / 1000) * denominator;
  const stroke = 1 / pixelsPerMetre;
  const tick = paper(TICK_MM);
  const text = paper(textSize);
  const gap = paper(TEXT_GAP_MM);
  const over = paper(OVERSHOOT_MM);
  const horizontal = orientation === "horizontal";
  // Unit vector along the chain and across it, in SVG coordinates (y down).
  const along = horizontal ? { x: 1, y: 0 } : { x: 0, y: -1 };
  const svg = (p: { x: number; y: number }) => ({ x: p.x, y: -p.y });
  const mark = (t: { x: number; y: number }, i: number, last: boolean) => {
    const p = svg(t);
    const h = tick / 2;
    if (terminator === "dot")
      return <circle key={i} cx={p.x} cy={p.y} r={tick * 0.18} stroke="none" />;
    if (terminator === "circle")
      return <circle key={i} cx={p.x} cy={p.y} r={tick * 0.25} fill="none" strokeWidth={stroke} />;
    if (terminator === "cross")
      return (
        <g key={i} strokeWidth={stroke}>
          <line x1={p.x - h} y1={p.y - h} x2={p.x + h} y2={p.y + h} />
          <line x1={p.x - h} y1={p.y + h} x2={p.x + h} y2={p.y - h} />
        </g>
      );
    if (terminator === "arrow") {
      // Arrows point outwards at both chain ends and both ways at inner stations.
      const tip = (dir: 1 | -1) => {
        const bx = p.x - along.x * dir * tick,
          by = p.y - along.y * dir * tick;
        const nx = -along.y * tick * 0.25,
          ny = along.x * tick * 0.25;
        return `${p.x},${p.y} ${bx + nx},${by + ny} ${bx - nx},${by - ny}`;
      };
      const dirs: (1 | -1)[] = i === 0 ? [-1] : last ? [1] : [1, -1];
      return (
        <g key={i} stroke="none">
          {dirs.map((d) => (
            <polygon key={d} points={tip(d)} />
          ))}
        </g>
      );
    }
    // Oblique stroke at 45°, rising to the right like a comma direction.
    return (
      <line key={i} x1={p.x - h} y1={p.y + h} x2={p.x + h} y2={p.y - h} strokeWidth={stroke * 2} />
    );
  };
  return (
    <g pointerEvents="none" stroke={color} fill={color}>
      <line
        x1={layout.line.start.x}
        y1={-layout.line.start.y}
        x2={layout.line.end.x}
        y2={-layout.line.end.y}
        strokeWidth={stroke}
      />
      {layout.extensions.map((e, i) => {
        // Past the dimension line by the overshoot, away from the measured point.
        const dx = Math.sign(e.end.x - e.start.x),
          dy = Math.sign(e.end.y - e.start.y);
        return (
          <line
            key={`e${i}`}
            x1={e.start.x}
            y1={-e.start.y}
            x2={e.end.x + dx * over}
            y2={-(e.end.y + dy * over)}
            strokeWidth={stroke}
            strokeOpacity={0.6}
          />
        );
      })}
      {layout.ticks.map((t, i) => mark(t, i, i === layout.ticks.length - 1))}
      {layout.segments.map((s, i) => {
        const p = svg(s.centre);
        const figure = dimensionFigure(s.value, units);
        const x = horizontal ? p.x : p.x - gap;
        const y = horizontal ? p.y - gap : p.y;
        return (
          <text
            key={`s${i}`}
            x={x}
            y={y}
            fontSize={text}
            stroke="none"
            textAnchor="middle"
            transform={horizontal ? undefined : `rotate(-90 ${x} ${y})`}
            className="select-none"
          >
            {figure.main}
            {figure.sup && (
              <tspan fontSize={text * 0.6} dy={-text * 0.4}>
                {figure.sup}
              </tspan>
            )}
          </text>
        );
      })}
    </g>
  );
}
