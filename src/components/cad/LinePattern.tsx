import { useId } from "react";
import type { DrawingLine } from "@/domain/project/schema";
import { linePatternLayout, linePatternStroke } from "@/rendering/viewport/line-pattern-layout";
/** Bounded SVG definition; repetition is rendering data, never editable geometry. */
export function LinePattern({
  line,
  pixelsPerMetre,
}: {
  line: DrawingLine;
  pixelsPerMetre: number;
}) {
  const id = useId();
  if (!line.pattern || !line.repeatLength) return null;
  const pattern = line.pattern;
  const layout = linePatternLayout(line.points, pattern.period, line.repeatLength);
  const half = 10 * layout.scale;
  return (
    <g pointerEvents="none">
      <defs>
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width={line.repeatLength}
          height={half * 2}
          y={-half}
          viewBox={`0 -10 ${pattern.period} 20`}
          preserveAspectRatio="none"
        >
          {pattern.segments.map((s, i) => (
            <line
              key={i}
              x1={s.start.x}
              y1={-s.start.y}
              x2={s.end.x}
              y2={-s.end.y}
              stroke={pattern.colorEditable === false ? pattern.color : line.color}
              strokeWidth={linePatternStroke(line.penWidth, pixelsPerMetre, layout.scale)}
            />
          ))}
        </pattern>
      </defs>
      {layout.segments.map((s, i) => (
        <g key={i} transform={`translate(${s.start.x} ${-s.start.y}) rotate(${s.rotation})`}>
          <rect
            x={s.phase}
            y={-half}
            width={s.length}
            height={half * 2}
            transform={`translate(${-s.phase} 0)`}
            fill={`url(#${id})`}
          />
        </g>
      ))}
    </g>
  );
}
