import { rotationAngle } from "@/application/selection/rotate";
import type { Point2 } from "@/geometry/primitives/point";
import { CAD_TURQUOISE } from "@/rendering/viewport/highlight";

export type RotationGuide = {
  pivot: Point2;
  /** Reference direction in degrees once clicked; the circle's 0° then lies on it. */
  reference: number | null;
};

const at = (p: Point2, degrees: number, r: number) => {
  const a = (degrees * Math.PI) / 180;
  return { x: p.x + r * Math.cos(a), y: p.y + r * Math.sin(a) };
};
const deg = (value: number) =>
  `${value.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}°`;

/**
 * Drehen (docs/TASTENKUERZEL.md, B2): a circle from 0 to 360° around the pivot, ticks every
 * 15°. Before the reference click 0° points along +x; after it along the reference. Rays to
 * the reference and to the pointer, the arc between them and the turn as a label.
 */
export function RotationGuideOverlay({
  guide,
  aim,
  pixelsPerMetre,
}: {
  guide: RotationGuide;
  aim: Point2 | null;
  pixelsPerMetre: number;
}) {
  const r = 70 / pixelsPerMetre;
  const { pivot, reference } = guide;
  const zero = reference ?? 0;
  const aimDegrees =
    aim && (aim.x !== pivot.x || aim.y !== pivot.y)
      ? (Math.atan2(aim.y - pivot.y, aim.x - pivot.x) * 180) / Math.PI
      : null;
  const turn = aimDegrees === null ? null : rotationAngle(zero, aimDegrees);
  const ticks = Array.from({ length: 24 }, (_, i) => i * 15);
  const flip = (p: Point2) => `${p.x},${-p.y}`;
  const arc =
    turn !== null && turn !== 0 && reference !== null
      ? (() => {
          const from = at(pivot, zero, r * 0.55),
            to = at(pivot, zero + turn, r * 0.55);
          // Plan y points up, SVG y down: a counterclockwise turn is sweep 0 on screen.
          return `M ${flip(from)} A ${r * 0.55} ${r * 0.55} 0 ${Math.abs(turn) > 180 ? 1 : 0} ${turn > 0 ? 0 : 1} ${flip(to)}`;
        })()
      : null;
  const label =
    reference === null
      ? aimDegrees === null
        ? "Bezugsrichtung wählen"
        : `Bezug ${deg(((aimDegrees % 360) + 360) % 360 || 0)}`
      : turn === null
        ? "Zielrichtung wählen"
        : `${turn > 0 ? "+" : ""}${deg(turn)}`;
  const labelAt = at(pivot, zero + (turn ?? 0) / 2, r + 18 / pixelsPerMetre);
  return (
    <g pointerEvents="none" aria-label={`Drehen ${label}`}>
      <circle
        cx={pivot.x}
        cy={-pivot.y}
        r={r}
        fill="none"
        stroke={CAD_TURQUOISE}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {ticks.map((t) => {
        const long = t % 90 === 0;
        const a = at(pivot, zero + t, r),
          b = at(pivot, zero + t, r - (long ? 10 : 5) / pixelsPerMetre);
        return (
          <line
            key={t}
            x1={a.x}
            y1={-a.y}
            x2={b.x}
            y2={-b.y}
            stroke={CAD_TURQUOISE}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {[0, 90, 180, 270].map((t) => {
        const p = at(pivot, zero + t, r - 20 / pixelsPerMetre);
        return (
          <text
            key={t}
            x={p.x}
            y={-p.y}
            fontSize={10 / pixelsPerMetre}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--muted-foreground)"
          >
            {t}°
          </text>
        );
      })}
      {reference !== null && (
        <line
          x1={pivot.x}
          y1={-pivot.y}
          x2={at(pivot, zero, r).x}
          y2={-at(pivot, zero, r).y}
          stroke={CAD_TURQUOISE}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          strokeDasharray="6 3"
        />
      )}
      {aim && aimDegrees !== null && (
        <line
          x1={pivot.x}
          y1={-pivot.y}
          x2={aim.x}
          y2={-aim.y}
          stroke={CAD_TURQUOISE}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {arc && (
        <path
          d={arc}
          fill="none"
          stroke={CAD_TURQUOISE}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
      <circle
        cx={pivot.x}
        cy={-pivot.y}
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
        textAnchor="middle"
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
