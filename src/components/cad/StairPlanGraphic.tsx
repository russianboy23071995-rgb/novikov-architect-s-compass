import type { stairPlan } from "@/domain/elements/stair/model";

type Plan = ReturnType<typeof stairPlan>;
type P = { x: number; y: number };

/**
 * Stair in plan after building drawing practice (docs/TREPPE.md, TR2): outline, one line per
 * riser, walking line from a circle at the first step to an arrow at the top, a break line at
 * the 1 m cut; everything above the cut dashed. Model coordinates, y flipped like the plan.
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
  const line = (a: P, b: P, key: string, dashed: boolean, strokeWidth = px(1)) => (
    <line
      key={key}
      x1={a.x}
      y1={-a.y}
      x2={b.x}
      y2={-b.y}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={dashed ? dash : undefined}
    />
  );
  const { below, above } = plan.walk;
  const tip = (above ?? below).end;
  const from = (above ?? below).start;
  const len = Math.hypot(tip.x - from.x, tip.y - from.y) || 1;
  const d = { x: (tip.x - from.x) / len, y: (tip.y - from.y) / len };
  const head = px(9);
  const back = { x: tip.x - d.x * head, y: tip.y - d.y * head };
  const side = { x: -d.y * head * 0.45, y: d.x * head * 0.45 };
  return (
    <g pointerEvents="none">
      <polygon
        points={plan.outline.map((p) => `${p.x},${-p.y}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={px(width)}
      />
      {plan.risers.map((r, i) => line(r.start, r.end, `r${i}`, r.above))}
      {line(below.start, below.end, "walk", false)}
      {above && line(above.start, above.end, "walk-above", true)}
      <circle
        cx={below.start.x}
        cy={-below.start.y}
        r={px(3)}
        fill="none"
        stroke={color}
        strokeWidth={px(1)}
      />
      <polygon
        points={[
          tip,
          { x: back.x + side.x, y: back.y + side.y },
          { x: back.x - side.x, y: back.y - side.y },
        ]
          .map((p) => `${p.x},${-p.y}`)
          .join(" ")}
        fill={color}
      />
      {plan.cut && line(plan.cut.start, plan.cut.end, "cut", false, px(width))}
    </g>
  );
}
