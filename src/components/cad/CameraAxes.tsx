import type { Camera } from "@/lib/bim/geometry";
/** Rotation only: translation, model size and zoom must not change the orientation indicator. */
export function CameraAxes({ camera }: { camera: Camera }) {
  const c = Math.cos(camera.yaw),
    s = Math.sin(camera.yaw),
    cp = Math.cos(camera.pitch),
    sp = Math.sin(camera.pitch);
  const axes = [
    { name: "X", x: c, y: s * sp, color: "#c46a6a" },
    { name: "Y", x: s, y: -c * sp, color: "#62a687" },
    { name: "Z", x: 0, y: -cp, color: "#6b96cf" },
  ];
  return (
    <svg
      aria-label="Kameraorientierung X Y Z"
      className="pointer-events-none absolute bottom-[20px] left-2 z-20"
      width={88}
      height={88}
      viewBox="0 0 88 88"
    >
      {axes.map((a) => (
        <g key={a.name}>
          <line
            x1={44}
            y1={44}
            x2={44 + a.x * 27}
            y2={44 + a.y * 27}
            stroke={a.color}
            strokeWidth={1.5}
          />
          <text
            x={44 + a.x * 36}
            y={44 + a.y * 36}
            fill={a.color}
            fontSize={10}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {a.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
