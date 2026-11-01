import { sectionFrame, type Section } from "@/domain/views/sections";

type P = { x: number; y: number };

/**
 * Section line in plan (docs/SCHNITT.md, SC2): thin dash-dot line, heavy end strokes, at each
 * end an arrow towards the viewing side and the mark. Model coordinates, y flipped like the
 * plan; sizes in screen pixels. `pick` adds a wide transparent stroke for the double click.
 */
export function SectionPlanGraphic({
  section,
  pixelsPerMetre,
  color,
  pick = false,
}: {
  section: Pick<Section, "start" | "end" | "look" | "mark"> & { id?: string };
  pixelsPerMetre: number;
  color: string;
  pick?: boolean;
}) {
  const px = (n: number) => n / pixelsPerMetre;
  const { d, view, length } = sectionFrame(section);
  const at = (p: P, s: number, t: number): P => ({
    x: p.x + d.x * s + view.x * t,
    y: p.y + d.y * s + view.y * t,
  });
  const end = Math.min(px(14), length / 3);
  const arrow = (p: P) => {
    const tip = at(p, 0, px(16));
    const back = at(p, 0, px(8));
    const side = { x: d.x * px(4), y: d.y * px(4) };
    return (
      <>
        <line x1={p.x} y1={-p.y} x2={back.x} y2={-back.y} stroke={color} strokeWidth={px(1.5)} />
        <polygon
          points={[
            tip,
            { x: back.x + side.x, y: back.y + side.y },
            { x: back.x - side.x, y: back.y - side.y },
          ]
            .map((q) => `${q.x},${-q.y}`)
            .join(" ")}
          fill={color}
        />
      </>
    );
  };
  const label = (p: P, outward: number) => {
    const q = at(p, outward * px(14), 0);
    return (
      <text
        x={q.x}
        y={-q.y}
        fill={color}
        fontSize={px(13)}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {section.mark}
      </text>
    );
  };
  const stroke = (from: P, s: number) => {
    const to = at(from, s, 0);
    return (
      <line x1={from.x} y1={-from.y} x2={to.x} y2={-to.y} stroke={color} strokeWidth={px(3)} />
    );
  };
  return (
    <g pointerEvents="none">
      <line
        x1={section.start.x}
        y1={-section.start.y}
        x2={section.end.x}
        y2={-section.end.y}
        stroke={color}
        strokeWidth={px(1)}
        strokeDasharray={`${px(12)} ${px(3)} ${px(2)} ${px(3)}`}
      />
      {stroke(section.start, end)}
      {stroke(section.end, -end)}
      {arrow(section.start)}
      {arrow(section.end)}
      {label(section.start, -1)}
      {label(section.end, 1)}
      {pick && section.id && (
        <line
          data-section-id={section.id}
          x1={section.start.x}
          y1={-section.start.y}
          x2={section.end.x}
          y2={-section.end.y}
          stroke="transparent"
          strokeWidth={px(10)}
          pointerEvents="stroke"
        >
          <title>{`Schnitt ${section.mark}-${section.mark} · Doppelklick öffnet das Fenster`}</title>
        </line>
      )}
    </g>
  );
}
