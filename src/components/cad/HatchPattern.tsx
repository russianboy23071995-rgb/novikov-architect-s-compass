import { useId } from "react";
import {
  hatchPatternTile,
  hatchPatternStroke,
  type HatchPatternSizing,
} from "@/rendering/viewport/hatch-pattern";
import type { Hatch } from "@/domain/elements/hatch/model";
import type { HatchPatternDefinition } from "@/domain/elements/hatch/pattern";
/** SVG tiling clips to the contour; no geometry allocated per repetition. */
export function HatchPattern({
  hatch,
  definition,
  pixelsPerMetre,
  sizing,
}: {
  hatch: Pick<Hatch, "points" | "fill" | "pattern">;
  definition: HatchPatternDefinition;
  pixelsPerMetre: number;
  sizing?: HatchPatternSizing;
}) {
  const id = useId();
  if (!hatch.pattern) return null;
  const tile = hatchPatternTile(definition, hatch.pattern, sizing);
  if (!tile) return null;
  const strokeWidth = hatchPatternStroke(pixelsPerMetre, tile.factor);
  return (
    <g pointerEvents="none">
      <defs>
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          x={tile.x}
          y={tile.y}
          width={tile.width}
          height={tile.height}
          viewBox={tile.viewBox}
          patternTransform={tile.patternTransform}
          preserveAspectRatio="none"
        >
          {tile.lines.map((s, i) => (
            <line
              key={i}
              x1={s.start.x}
              y1={s.start.y}
              x2={s.end.x}
              y2={s.end.y}
              stroke={hatch.fill.color}
              strokeWidth={strokeWidth}
            />
          ))}
        </pattern>
      </defs>
      <polygon
        points={hatch.points.map((p) => `${p.x},${-p.y}`).join(" ")}
        fill={`url(#${id})`}
        fillOpacity={hatch.fill.opacity}
      />
    </g>
  );
}
