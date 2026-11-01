import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { LengthDirection } from "@/application/lines/actions";

type P = { x: number; y: number };

/** Turquoise of the length arrows (user decision 01.11.2026). */
const ARROW = "#14b8a6";

const format = (m: number) => m.toFixed(3).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",");

/**
 * Length helper of a selected line or line segment (docs/LINIEN.md, S3): a dimension line beside
 * the segment shows its length; a click on the number edits it. Two turquoise arrows beside the
 * number choose which end moves – one arrow: that end, both: the middle stays. Model
 * coordinates, y flipped like the plan; sizes in screen pixels.
 */
export function LineLengthHelper({
  start,
  end,
  pixelsPerMetre,
  onLength,
}: {
  start: P;
  end: P;
  pixelsPerMetre: number;
  onLength: (length: number, direction: LengthDirection) => void;
}) {
  const px = (n: number) => n / pixelsPerMetre;
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  const d = { x: (end.x - start.x) / length, y: (end.y - start.y) / length };
  // Without a choice the end on the screen's right moves (user decision: "rechts").
  const rightIsEnd = d.x > 1e-9 || (Math.abs(d.x) <= 1e-9 && d.y > 0);
  const [arrows, setArrows] = useState({ start: !rightIsEnd, end: rightIsEnd });
  const [draft, setDraft] = useState<string | null>(null);
  const [field, setField] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  useEffect(() => setDraft(null), [start.x, start.y, end.x, end.y]);
  // Beside the segment on its left (screen: above a segment drawn to the right).
  const n = { x: -d.y, y: d.x };
  const at = (p: P, along: number, across: number): P => ({
    x: p.x + d.x * along + n.x * across,
    y: p.y + d.y * along + n.y * across,
  });
  const off = px(16);
  const a = at(start, 0, off),
    b = at(end, 0, off);
  const mid = at({ x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }, 0, off);
  const direction: LengthDirection =
    arrows.start && arrows.end ? "both" : arrows.start ? "start" : "end";
  const commit = () => {
    if (draft === null) return;
    const value = Number(draft.replace(",", "."));
    setDraft(null);
    if (Number.isFinite(value) && value > 0 && Math.abs(value - length) > 1e-9)
      onLength(value, direction);
  };
  const toggle = (side: "start" | "end") =>
    setArrows((now) => {
      const next = { ...now, [side]: !now[side] };
      return next.start || next.end ? next : now;
    });
  const arrow = (side: "start" | "end") => {
    const sign = side === "end" ? 1 : -1;
    const base = at(mid, sign * px(40), 0);
    const tip = at(base, sign * px(9), 0);
    const left = at(base, 0, px(5)),
      right = at(base, 0, -px(5));
    const active = arrows[side];
    return (
      <polygon
        role="button"
        aria-pressed={active}
        aria-label={
          side === "end" ? "Länge zum Linienende ändern" : "Länge zum Linienanfang ändern"
        }
        points={[tip, left, right].map((q) => `${q.x},${-q.y}`).join(" ")}
        fill={active ? ARROW : "white"}
        stroke={ARROW}
        strokeWidth={px(1.5)}
        className="cursor-pointer"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          toggle(side);
        }}
      >
        <title>Richtung der Längenänderung; beide gewählt: die Mitte bleibt.</title>
      </polygon>
    );
  };
  const box = { w: 58, h: 18 };
  return (
    <g aria-label="Längen-Hilfslinie">
      <line
        x1={a.x}
        y1={-a.y}
        x2={b.x}
        y2={-b.y}
        stroke={ARROW}
        strokeWidth={px(1)}
        strokeDasharray={`${px(4)} ${px(3)}`}
        pointerEvents="none"
      />
      {[start, end].map((p, i) => {
        const q = at(p, 0, off + px(4)),
          r = at(p, 0, px(3));
        return (
          <line
            key={i}
            x1={q.x}
            y1={-q.y}
            x2={r.x}
            y2={-r.y}
            stroke={ARROW}
            strokeWidth={px(1)}
            pointerEvents="none"
          />
        );
      })}
      {arrow("start")}
      {arrow("end")}
      {/* The number in screen pixels; a click opens an input placed over it on the page. */}
      <g
        role="button"
        aria-label={`Länge ${format(length)} m ändern`}
        className="cursor-text"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          const box = (event.currentTarget as SVGGElement).getBoundingClientRect();
          setField({ left: box.left, top: box.top, width: box.width, height: box.height });
          setDraft(format(length));
        }}
      >
        <rect
          x={mid.x - px(box.w / 2)}
          y={-mid.y - px(box.h / 2)}
          width={px(box.w)}
          height={px(box.h)}
          rx={px(3)}
          fill="white"
          stroke={ARROW}
          strokeWidth={px(1)}
        />
        <text
          x={mid.x}
          y={-mid.y}
          fontSize={px(12)}
          fill="#0f766e"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {format(length)}
        </text>
      </g>
      {draft !== null &&
        field &&
        createPortal(
          <input
            autoFocus
            aria-label="Neue Länge (m)"
            inputMode="decimal"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") commit();
              if (event.key === "Escape") setDraft(null);
            }}
            onBlur={commit}
            style={{ position: "fixed", ...field, zIndex: 60 }}
            className="rounded border border-teal-500 bg-white px-1 text-center text-xs"
          />,
          document.body,
        )}
    </g>
  );
}
