import type { stairPlan } from "@/domain/elements/stair/model";

type Plan = ReturnType<typeof stairPlan>;
type P = { x: number; y: number };

const svgPoints = (points: readonly P[]) => points.map((p) => `${p.x},${-p.y}`).join(" ");

/**
 * Stair in plan after building drawing practice (docs/TREPPE.md, TR2/TR3): footprint, one line
 * per riser, walking line from a circle at the first step across the landing to an arrow at the
 * top, a break line at the 1 m cut; everything above the cut dashed. Model coordinates, y
 * flipped like the plan.
 */
export function StairPlanGraphic({
  plan,
  pixelsPerMetre,
  color,
  width,
}: {
  plan: Plan;
  pixelsPerMetre: number;
  color: string;
  /** Outline pen in screen pixels. */
  width: number;
}) {
  const px = (n: number) => n / pixelsPerMetre;
  const dash = `${px(5)} ${px(3)}`;
  const { below, above } = plan.walk;
  const walk = above ?? below;
  const tip = walk.at(-1)!;
  const from = walk.at(-2) ?? walk[0]!;
  const len = Math.hypot(tip.x - from.x, tip.y - from.y) || 1;
  const d = { x: (tip.x - from.x) / len, y: (tip.y - from.y) / len };
  const head = px(9);
  const back = { x: tip.x - d.x * head, y: tip.y - d.y * head };
  const side = { x: -d.y * head * 0.45, y: d.x * head * 0.45 };
  const line = (points: readonly P[], dashed: boolean) => (
    <polyline
      points={svgPoints(points)}
      fill="none"
      stroke={color}
      strokeWidth={px(1)}
      strokeDasharray={dashed ? dash : undefined}
    />
  );
  return (
    <g pointerEvents="none">
      <polygon
        points={svgPoints(plan.outline)}
        fill="none"
        stroke={color}
        strokeWidth={px(width)}
      />
      {plan.risers.map((r, i) => (
        <line
          key={i}
          x1={r.start.x}
          y1={-r.start.y}
          x2={r.end.x}
          y2={-r.end.y}
          stroke={color}
          strokeWidth={px(1)}
          strokeDasharray={r.above ? dash : undefined}
        />
      ))}
      {line(below, false)}
      {above && line(above, true)}
      <circle
        cx={below[0]!.x}
        cy={-below[0]!.y}
        r={px(3)}
        fill="none"
        stroke={color}
        strokeWidth={px(1)}
      />
      <polygon
        points={svgPoints([
          tip,
          { x: back.x + side.x, y: back.y + side.y },
          { x: back.x - side.x, y: back.y - side.y },
        ])}
        fill={color}
      />
      {plan.cut && (
        <line
          x1={plan.cut.start.x}
          y1={-plan.cut.start.y}
          x2={plan.cut.end.x}
          y2={-plan.cut.end.y}
          stroke={color}
          strokeWidth={px(width)}
        />
      )}
    </g>
  );
}
