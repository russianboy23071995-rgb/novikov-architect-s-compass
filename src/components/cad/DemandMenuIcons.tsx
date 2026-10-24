// Presentation-only pictograms for the On-Demand menu (NOVIKOV Plan & Maß style).
// Black = currentColor, secondary lines use the muted foreground token.
import type { ReactNode } from "react";

const muted = "var(--muted-foreground)";

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Dot({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={2.2} stroke={muted} strokeWidth={0.9} />
      <circle cx={x} cy={y} r={1.2} fill="currentColor" stroke="none" />
    </>
  );
}

export const PointMoveIcon = () => (
  <Svg>
    <path d="M7 17 L19 5 M13.5 5 H19 V10.5" />
    <Dot x={5} y={19} />
  </Svg>
);

export const ElementMoveIcon = () => (
  <Svg>
    <rect x={6.5} y={8.5} width={11} height={7} fill={muted} fillOpacity={0.25} />
    <path d="M12 6.5 V2.5 M10.3 4.2 L12 2.5 L13.7 4.2" />
    <path d="M12 17.5 V21.5 M10.3 19.8 L12 21.5 L13.7 19.8" />
    <path d="M4.5 12 H2.5 M3.8 10.5 L2.3 12 L3.8 13.5" />
    <path d="M19.5 12 H21.5 M20.2 10.5 L21.7 12 L20.2 13.5" />
  </Svg>
);

export const OffsetIcon = () => (
  <Svg>
    <path d="M10.5 2.5 L21 8 L18.5 20.5 L7 20 L3 11.5Z" stroke={muted} />
    <path d="M11 6 L17.5 9.5 L16 17 L9 16.5 L6.5 11.5Z" />
  </Svg>
);

export const KinkIcon = () => (
  <Svg>
    <path d="M3 20 L12 5.5 L21 15.5" />
    <Dot x={12} y={5.5} />
  </Svg>
);

export const EdgeStretchIcon = () => (
  <Svg>
    <path d="M13 5 H4 V19 H13" stroke={muted} />
    <path d="M13 5 V19" strokeWidth={1.7} />
    <path d="M15.5 12 H21.5 M19.5 10 L21.5 12 L19.5 14" />
  </Svg>
);

export const PointStretchIcon = () => (
  <Svg>
    <path d="M3 21 L21 3" stroke={muted} strokeDasharray="2 2.2" />
    <path d="M10 14 L18 6 M13.5 6 H18 V10.5" />
    <Dot x={7.5} y={16.5} />
  </Svg>
);

export const AlongAxisIcon = ({ window }: { window?: boolean }) => (
  <Svg>
    {window ? (
      <>
        <path d="M2 9 H22 M2 15 H22" stroke={muted} />
        <rect x={9} y={9} width={6} height={6} fill={muted} fillOpacity={0.25} />
      </>
    ) : (
      <>
        <path d="M2 12 H22" stroke={muted} strokeDasharray="2 2.2" />
        <rect x={9} y={9.5} width={6} height={5} fill={muted} fillOpacity={0.25} />
      </>
    )}
    <path d="M3 19.5 H21 M5 17.5 L3 19.5 L5 21.5 M19 17.5 L21 19.5 L19 21.5" />
  </Svg>
);

export const AxisIcon = ({ axis }: { axis: "x" | "y" | "z" }) => {
  const line = (a: "x" | "y" | "z", d: string, head: string) => (
    <g stroke={axis === a ? "currentColor" : muted} strokeWidth={axis === a ? 1.5 : 1}>
      <path d={d} />
      <path d={head} />
    </g>
  );
  const letter = (a: "x" | "y" | "z", x: number, y: number) => (
    <text
      x={x}
      y={y}
      fontSize={6.5}
      fontWeight={700}
      textAnchor="middle"
      stroke="none"
      fill={axis === a ? "currentColor" : muted}
    >
      {a.toUpperCase()}
    </text>
  );
  return (
    <Svg>
      {line("z", "M4.5 19.5 V5", "M2.8 6.8 L4.5 5 L6.2 6.8")}
      {line("y", "M4.5 19.5 L15.5 9", "M12.8 9 H15.5 V11.7")}
      {line("x", "M4.5 19.5 H19", "M17.2 17.8 L19 19.5 L17.2 21.2")}
      {letter("z", 9, 6.5)}
      {letter("y", 19.5, 9.5)}
      {letter("x", 21.5, 16)}
    </Svg>
  );
};

export const ReferencesIcon = () => (
  <Svg>
    <path d="M2.5 12 H21.5 M12 2.5 V21.5" stroke={muted} strokeDasharray="2 2.2" />
    <Dot x={12} y={12} />
  </Svg>
);

export const PropertiesIcon = () => (
  <Svg>
    <path d="M3 6 H21 M3 12 H21 M3 18 H21" stroke={muted} />
    <circle cx={15} cy={6} r={2} fill="currentColor" stroke="none" />
    <circle cx={8} cy={12} r={2} fill="currentColor" stroke="none" />
    <circle cx={17} cy={18} r={2} fill="currentColor" stroke="none" />
  </Svg>
);
