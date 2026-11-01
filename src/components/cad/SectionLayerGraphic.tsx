import { useId } from "react";
import type { SectionLayerStrip } from "@/rendering/viewport/section-drawing";
import { insulationZigzag } from "@/rendering/viewport/wall-layers";

/**
 * Layers of a cut wall in a section (docs/WANDAUFBAU.md, SA3): vertical strips in the material
 * colour with its hatch, clipped to the cut outline; thin lines part the layers. Drawing
 * coordinates in metres, height flipped like the section view. `hatch` is the hatch spacing in
 * metres (paper size times scale).
 */
export function SectionLayerGraphic({
  clip,
  layers,
  bottom,
  top,
  hatch,
}: {
  clip: string;
  layers: readonly SectionLayerStrip[];
  bottom: number;
  top: number;
  hatch: number;
}) {
  const id = useId().replace(/:/g, "");
  const u = hatch;
  const line = { stroke: "var(--foreground)", strokeOpacity: 0.55, strokeWidth: 0.5 };
  return (
    <g pointerEvents="none" aria-label="Schichten">
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={clip} clipRule="evenodd" />
        </clipPath>
        <pattern id={`${id}-diagonal`} patternUnits="userSpaceOnUse" width={u} height={u}>
          <path d={`M0,${u} L${u},0`} {...line} vectorEffect="non-scaling-stroke" />
        </pattern>
        <pattern id={`${id}-cross`} patternUnits="userSpaceOnUse" width={u} height={u}>
          <path d={`M0,${u} L${u},0 M0,0 L${u},${u}`} {...line} vectorEffect="non-scaling-stroke" />
        </pattern>
        <pattern id={`${id}-dots`} patternUnits="userSpaceOnUse" width={u} height={u}>
          <circle cx={u / 2} cy={u / 2} r={u / 10} fill="var(--foreground)" fillOpacity={0.55} />
        </pattern>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        {layers.map((layer, i) => (
          <g key={i} aria-label={`Schicht ${layer.material.name}`}>
            <rect
              x={layer.from}
              y={-top}
              width={layer.to - layer.from}
              height={top - bottom}
              fill={layer.material.color}
            />
            {layer.material.pattern !== "none" && layer.material.pattern !== "insulation" && (
              <rect
                x={layer.from}
                y={-top}
                width={layer.to - layer.from}
                height={top - bottom}
                fill={`url(#${id}-${layer.material.pattern})`}
              />
            )}
            {layer.material.pattern === "insulation" && (
              <polyline
                // The zigzag runs up the strip, one tooth per strip width.
                points={insulationZigzag({ from: layer.from, to: layer.to }, bottom, top)
                  .map((p) => `${p.y},${-p.x}`)
                  .join(" ")}
                fill="none"
                {...line}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        ))}
        {layers.slice(1).map((layer, i) => (
          <line
            key={i}
            x1={layer.from}
            x2={layer.from}
            y1={-top}
            y2={-bottom}
            stroke="var(--foreground)"
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </g>
  );
}
