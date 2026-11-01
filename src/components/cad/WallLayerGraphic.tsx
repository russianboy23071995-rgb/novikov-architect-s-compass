import { useId } from "react";
import { insulationZigzag, type WallLayerBand } from "@/rendering/viewport/wall-layers";

/** Hatch spacing on screen in pixels; lines stay readable at every zoom. */
const HATCH_PX = 7;

/**
 * Cut wall with a build-up in plan (docs/WANDAUFBAU.md, SA2), drawn in the wall's local frame
 * (x along the wall, y = −local y). Each layer is filled in its material colour with its hatch
 * and clipped to the wall's profile, so layers end on the corner mitre; thin lines part the
 * layers. Not pickable; the wall polygon above it takes the clicks.
 */
export function WallLayerGraphic({
  profile,
  bands,
  pixelsPerMetre,
  lineWidth,
}: {
  profile: readonly { x: number; y: number }[];
  bands: readonly WallLayerBand[];
  pixelsPerMetre: number;
  lineWidth: number;
}) {
  const id = useId().replace(/:/g, "");
  const xs = profile.map((p) => p.x);
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs);
  const u = HATCH_PX / pixelsPerMetre;
  const hatch = { stroke: "var(--foreground)", strokeOpacity: 0.55, strokeWidth: 0.5 };
  return (
    <g pointerEvents="none" aria-hidden>
      <defs>
        <clipPath id={`${id}-clip`}>
          <polygon points={profile.map((p) => `${p.x},${-p.y}`).join(" ")} />
        </clipPath>
        <pattern id={`${id}-diagonal`} patternUnits="userSpaceOnUse" width={u} height={u}>
          <path d={`M0,${u} L${u},0`} {...hatch} vectorEffect="non-scaling-stroke" />
        </pattern>
        <pattern id={`${id}-cross`} patternUnits="userSpaceOnUse" width={u} height={u}>
          <path
            d={`M0,${u} L${u},0 M0,0 L${u},${u}`}
            {...hatch}
            vectorEffect="non-scaling-stroke"
          />
        </pattern>
        <pattern id={`${id}-dots`} patternUnits="userSpaceOnUse" width={u} height={u}>
          <circle
            cx={u / 2}
            cy={u / 2}
            r={0.7 / pixelsPerMetre}
            fill="var(--foreground)"
            fillOpacity={0.55}
          />
        </pattern>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        {bands.map((band, i) => (
          <g key={i} aria-label={`Schicht ${band.material.name}`}>
            <rect
              x={x0}
              y={-band.to}
              width={x1 - x0}
              height={band.to - band.from}
              fill={band.material.color}
            />
            {(band.material.pattern === "diagonal" ||
              band.material.pattern === "cross" ||
              band.material.pattern === "dots") && (
              <rect
                x={x0}
                y={-band.to}
                width={x1 - x0}
                height={band.to - band.from}
                fill={`url(#${id}-${band.material.pattern})`}
              />
            )}
            {band.material.pattern === "insulation" && (
              <polyline
                points={insulationZigzag(band, x0, x1)
                  .map((p) => `${p.x},${-p.y}`)
                  .join(" ")}
                fill="none"
                {...hatch}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        ))}
        {bands.slice(1).map((band, i) => (
          <line
            key={i}
            x1={x0}
            x2={x1}
            y1={-band.from}
            y2={-band.from}
            stroke="var(--primary)"
            strokeWidth={lineWidth * 0.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </g>
  );
}
