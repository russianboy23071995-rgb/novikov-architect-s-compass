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
  edges = false,
}: {
  profile: readonly { x: number; y: number }[];
  bands: readonly WallLayerBand[];
  pixelsPerMetre: number;
  lineWidth: number;
  /** Also draw the outer faces of the bands: a core carried through other layers (L09 U2). */
  edges?: boolean;
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
      {/* Outer faces lie on the clip edge; drawn unclipped along the profile's own edge. */}
      {edges &&
        bands.length > 0 &&
        [bands[0]!.from, bands.at(-1)!.to].map((y, i) => {
          const on = profile.filter((p) => Math.abs(p.y - y) < 1e-9).map((p) => p.x);
          return on.length < 2 ? null : (
            <line
              key={i}
              x1={Math.min(...on)}
              x2={Math.max(...on)}
              y1={-y}
              y2={-y}
              stroke="var(--primary)"
              strokeWidth={lineWidth * 0.5}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
    </g>
  );
}
