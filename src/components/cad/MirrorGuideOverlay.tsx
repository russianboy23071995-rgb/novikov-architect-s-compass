import { mirrorAxisAngle } from "@/application/selection/mirror";
import type { Point2 } from "@/geometry/primitives/point";
import { CAD_TURQUOISE } from "@/rendering/viewport/highlight";

export type MirrorGuide = {
  /** First point of the axis. */
  origin: Point2;
};

const deg = (value: number) =>
  `${value.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}°`;

/**
 * Spiegeln (docs/TASTENKUERZEL.md, B3): the axis through its first point towards the pointer,
 * dashed across the whole view, with its angle (0–180°) beside the pointer.
 */
export function MirrorGuideOverlay({
  guide,
  aim,
  pixelsPerMetre,
}: {
  guide: MirrorGuide;
  aim: Point2 | null;
  pixelsPerMetre: number;
}) {
  const { origin } = guide;
  const has = aim && (aim.x !== origin.x || aim.y !== origin.y);
  const axis = has
    ? mirrorAxisAngle((Math.atan2(aim.y - origin.y, aim.x - origin.x) * 180) / Math.PI)
    : null;
  // Far enough beyond any screen: 20 000 px each way.
  const reach = 20000 / pixelsPerMetre;
  const a = ((axis ?? 0) * Math.PI) / 180;
  const ux = Math.cos(a),
    uy = Math.sin(a);
  const label = axis === null ? "Achsrichtung wählen" : `Achse ${deg(axis)}`;
  const labelAt = has
    ? { x: aim.x + 14 / pixelsPerMetre, y: aim.y + 14 / pixelsPerMetre }
    : { x: origin.x + 14 / pixelsPerMetre, y: origin.y + 14 / pixelsPerMetre };
  return (
    <g pointerEvents="none" aria-label={`Spiegeln ${label}`}>
      {axis !== null && (
        <line
          x1={origin.x - ux * reach}
          y1={-(origin.y - uy * reach)}
          x2={origin.x + ux * reach}
          y2={-(origin.y + uy * reach)}
          stroke={CAD_TURQUOISE}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          // Screen pixels: a non-scaling stroke measures its dashes on screen.
          strokeDasharray="10 4 2 4"
        />
      )}
      <circle
        cx={origin.x}
        cy={-origin.y}
        r={3 / pixelsPerMetre}
        fill="var(--background)"
        stroke={CAD_TURQUOISE}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={labelAt.x}
        y={-labelAt.y}
        fontSize={13 / pixelsPerMetre}
        fill="var(--foreground)"
        stroke="var(--background)"
        strokeWidth={3 / pixelsPerMetre}
        paintOrder="stroke"
      >
        {label}
      </text>
    </g>
  );
}
