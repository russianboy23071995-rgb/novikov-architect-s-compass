import { sectionFrame, type Section } from "@/domain/views/sections";

type P = { x: number; y: number };

/**
 * Section line in plan (docs/SCHNITT.md, SC2): thin dash-dot line, heavy end strokes, at each
 * end an arrow towards the viewing side and the mark. Model coordinates, y flipped like the
 * plan. Arrows, end strokes and mark follow the letter height `height` in model metres (SC4:
 * paper or model size, never a screen size); line weights stay in screen pixels. `pick` adds a
 * wide transparent stroke for the double click.
 */
export function SectionPlanGraphic({
  section,
  pixelsPerMetre,
  height,
  color,
  pick = false,
}: {
  section: Pick<Section, "start" | "end" | "look" | "mark" | "kind"> & { id?: string };
  pixelsPerMetre: number;
  /** Letter height of the mark in model metres. */
  height: number;
  color: string;
  pick?: boolean;
}) {
  const px = (n: number) => n / pixelsPerMetre;
  const { d, view, length } = sectionFrame(section);
  const at = (p: P, s: number, t: number): P => ({
    x: p.x + d.x * s + view.x * t,
    y: p.y + d.y * s + view.y * t,
  });
  const h = height;
  const end = Math.min(1.1 * h, length / 3);
  const arrow = (p: P) => {
    const tip = at(p, 0, 1.25 * h);
    const back = at(p, 0, 0.6 * h);
    const side = { x: d.x * 0.3 * h, y: d.y * 0.3 * h };
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
    const q = at(p, outward * 1.1 * h, 0);
    return (
      <text
        x={q.x}
        y={-q.y}
        fill={color}
        fontSize={h}
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
  // Elevation (docs/ANSICHTEN.md, A1/S2): a thin solid line and, in the middle, a filled arrow
  // towards the viewing side with the mark behind the line; no end ticks.
  const elevation = section.kind === "elevation";
  const middle = {
    x: (section.start.x + section.end.x) / 2,
    y: (section.start.y + section.end.y) / 2,
  };
  const elevationMark = () => {
    const tip = at(middle, 0, 1.3 * h);
    const left = at(middle, -0.7 * h, 0),
      right = at(middle, 0.7 * h, 0);
    const text = at(middle, 0, -0.8 * h);
    return (
      <>
        <polygon points={[tip, left, right].map((q) => `${q.x},${-q.y}`).join(" ")} fill={color} />
        <text
          x={text.x}
          y={-text.y}
          fill={color}
          fontSize={h}
          fontWeight={600}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {section.mark}
        </text>
      </>
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
        strokeDasharray={elevation ? undefined : `${px(12)} ${px(3)} ${px(2)} ${px(3)}`}
      />
      {elevation ? (
        <>{elevationMark()}</>
      ) : (
        <>
          {stroke(section.start, end)}
          {stroke(section.end, -end)}
          {arrow(section.start)}
          {arrow(section.end)}
          {label(section.start, -1)}
          {label(section.end, 1)}
        </>
      )}
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
          <title>
            {elevation
              ? `Ansicht ${section.mark} · Doppelklick öffnet das Fenster`
              : `Schnitt ${section.mark}-${section.mark} · Doppelklick öffnet das Fenster`}
          </title>
        </line>
      )}
    </g>
  );
}
