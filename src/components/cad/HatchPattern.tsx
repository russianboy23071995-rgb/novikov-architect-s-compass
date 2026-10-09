import type { ScaleContext } from "@/domain/views/scale";
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
  context,
}: {
  hatch: Pick<Hatch, "points" | "fill" | "pattern">;
  definition: HatchPatternDefinition;
  pixelsPerMetre: number;
  sizing?: HatchPatternSizing;
  context?: ScaleContext;
}) {
  const id = useId();
  if (!hatch.pattern) return null;
  let tile: ReturnType<typeof hatchPatternTile>;
  let strokeWidth: number;
  try {
    tile = hatchPatternTile(definition, hatch.pattern, sizing, context);
    if (!tile) return null;
    strokeWidth = hatchPatternStroke(pixelsPerMetre, tile.factor);
  } catch {
    // Incomplete tool-default input must not crash the canvas. Commit still validates.
    return (
      <g role="img" aria-label="Ungültige Mustergröße">
        <title>Ungültige Mustergröße</title>
      </g>
    );
  }
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
