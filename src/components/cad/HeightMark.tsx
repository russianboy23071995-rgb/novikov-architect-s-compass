import { formatHeight, heightMarkGeometry, type HeightMarkKind } from "@/domain/views/height-mark";

/**
 * Height mark in a section or elevation drawing (docs/SCHNITT.md, BS1): triangle on
 * the line, height beside it, optional name below. SVG in drawing metres, z flipped like the
 * section view. `reach` extends the line to x (e.g. to the drawing border).
 */
export function HeightMark({
  x,
  z,
  side,
  kind,
  size,
  name,
  reach,
}: {
  x: number;
  z: number;
  side: "left" | "right";
  kind: HeightMarkKind;
  size: number;
  name?: string | undefined;
  reach?: number | undefined;
}) {
  const g = heightMarkGeometry(x, z, side, size);
  const from = Math.min(g.line.from, reach ?? g.line.from);
  const to = Math.max(g.line.to, reach ?? g.line.to);
  return (
    <g aria-label={`Höhenkote ${formatHeight(z)}`}>
      <line
        x1={from}
        y1={-z}
        x2={to}
        y2={-z}
        stroke="var(--foreground)"
        strokeWidth={0.6}
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        points={g.triangle.map((p) => `${p.x},${-p.z}`).join(" ")}
        fill={kind === "shell" ? "var(--foreground)" : "var(--background)"}
        stroke="var(--foreground)"
        strokeWidth={0.6}
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={g.text.x}
        y={-g.text.z}
        fontSize={size * 1.1}
        textAnchor={g.text.anchor}
        fill="var(--foreground)"
      >
        {formatHeight(z)}
      </text>
      {name && (
        <text
          x={g.text.x}
          y={-z + size * 1.1}
          fontSize={size * 0.85}
          textAnchor={g.text.anchor}
          fill="var(--muted-foreground)"
        >
          {name}
        </text>
      )}
    </g>
  );
}
