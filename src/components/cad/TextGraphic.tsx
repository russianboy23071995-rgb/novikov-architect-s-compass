import {
  TEXT_FONT_CSS,
  TEXT_LINE_HEIGHT,
  textHeight,
  textLines,
  type PlanText,
} from "@/domain/elements/text/model";

/**
 * One plan text (docs/TEXT.md, T1): lines from the insertion point, aligned and anchored as
 * stored, rotated counterclockwise; drawn into the y-flipped plan group.
 */
export function TextGraphic({
  text,
  denominator,
  color,
}: {
  text: Pick<
    PlanText,
    "position" | "content" | "font" | "size" | "align" | "anchor" | "rotation" | "color"
  >;
  denominator: number;
  /** Overrides the stored colour (preview). */
  color?: string;
}) {
  const h = textHeight(text, denominator);
  const lines = textLines(text);
  const block = h * (1 + (lines.length - 1) * TEXT_LINE_HEIGHT);
  // Baseline of the first line, measured downwards from the insertion point (SVG y down).
  const first = text.anchor === "top" ? h : text.anchor === "middle" ? h - block / 2 : h - block;
  const { x, y } = text.position;
  return (
    <text
      pointerEvents="none"
      x={x}
      y={-y + first}
      fontSize={h}
      fontFamily={TEXT_FONT_CSS[text.font]}
      fill={color ?? text.color}
      textAnchor={text.align === "left" ? "start" : text.align === "center" ? "middle" : "end"}
      transform={text.rotation ? `rotate(${-text.rotation} ${x} ${-y})` : undefined}
      className="select-none"
      style={{ whiteSpace: "pre" }}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : h * TEXT_LINE_HEIGHT}>
          {line || " "}
        </tspan>
      ))}
    </text>
  );
}
