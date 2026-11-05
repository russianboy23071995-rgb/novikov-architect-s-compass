import { measuredTextWidth } from "./text-measure";
import {
  TEXT_FONT_CSS,
  TEXT_LINE_HEIGHT,
  textBlock,
  textHeight,
  textLines,
  type PlanText,
} from "@/domain/elements/text/model";

/**
 * One plan text (docs/TEXT.md): lines from the insertion point, aligned and anchored as stored,
 * rotated counterclockwise; drawn into the y-flipped plan group. T2 adds bold/italic/underline,
 * a background box, a frame and a halo around the letters.
 */
export function TextGraphic({
  text,
  denominator,
  pixelsPerMetre,
  color,
}: {
  text: Omit<PlanText, "id" | "layerId">;
  denominator: number;
  /** Frame widths are paper millimetres; the screen needs the current zoom. */
  pixelsPerMetre?: number;
  /** Overrides the stored colour (preview). */
  color?: string;
}) {
  const h = textHeight(text, denominator);
  const lines = textLines(text);
  const block = h * (1 + (lines.length - 1) * TEXT_LINE_HEIGHT);
  // Baseline of the first line, measured downwards from the insertion point (SVG y down).
  const first = text.anchor === "top" ? h : text.anchor === "middle" ? h - block / 2 : h - block;
  const { x, y } = text.position;
  const width = measuredTextWidth(text) * h;
  const box = (padding: number) =>
    textBlock(text, denominator, width, padding)
      .map((p) => `${p.x},${-p.y}`)
      .join(" ");
  const padding = (text.background?.padding ?? 0) * h;
  return (
    <g pointerEvents="none">
      {text.background && <polygon points={box(padding)} fill={text.background.color} />}
      {text.frame && (
        <polygon
          points={box(padding || 0.2 * h)}
          fill="none"
          stroke={text.frame.color}
          // Paper millimetres at the output scale, at least one screen pixel.
          strokeWidth={Math.max(
            (text.frame.width / 1000) * denominator,
            pixelsPerMetre ? 1 / pixelsPerMetre : 0,
          )}
        />
      )}
      <text
        x={x}
        y={-y + first}
        fontSize={h}
        fontFamily={TEXT_FONT_CSS[text.font]}
        fontWeight={text.bold ? "bold" : undefined}
        fontStyle={text.italic ? "italic" : undefined}
        textDecoration={text.underline ? "underline" : undefined}
        fill={color ?? text.color}
        stroke={text.halo?.color}
        strokeWidth={text.halo ? text.halo.width * h * 2 : undefined}
        strokeLinejoin="round"
        paintOrder="stroke"
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
    </g>
  );
}
