import { useRef, useState } from "react";
import { hsvToHex, hexToHsv } from "@/application/pens/color";
/** Local preview while dragging; one chosen color when the pointer is released. */
export function ColorPalette({
  value,
  onChoose,
}: {
  value: string;
  onChoose: (value: string) => void;
}) {
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const pending = useRef(hsv);
  const active = useRef(false);
  return (
    <div className="space-y-2">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Sättigung und Helligkeit"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuetext={`Sättigung ${Math.round(hsv.s * 100)} %, Helligkeit ${Math.round(hsv.v * 100)} %`}
        className="relative h-28 touch-none rounded-lg border outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${hsvToHex(hsv.h, 1, 1)}`,
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          active.current = true;
          const r = e.currentTarget.getBoundingClientRect();
          pending.current = {
            ...hsv,
            s: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
            v: Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height)),
          };
          setHsv(pending.current);
        }}
        onPointerMove={(e) => {
          if (!active.current) return;
          const r = e.currentTarget.getBoundingClientRect();
          pending.current = {
            ...hsv,
            s: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
            v: Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height)),
          };
          setHsv(pending.current);
        }}
        onPointerUp={() => {
          if (active.current) {
            active.current = false;
            const p = pending.current;
            onChoose(hsvToHex(p.h, p.s, p.v));
          }
        }}
        onPointerCancel={() => {
          active.current = false;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onChoose(hsvToHex(hsv.h, hsv.s, hsv.v));
          } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
            e.preventDefault();
            setHsv({
              ...hsv,
              s: Math.max(
                0,
                Math.min(
                  1,
                  hsv.s + (e.key === "ArrowRight" ? 0.01 : e.key === "ArrowLeft" ? -0.01 : 0),
                ),
              ),
              v: Math.max(
                0,
                Math.min(
                  1,
                  hsv.v + (e.key === "ArrowUp" ? 0.01 : e.key === "ArrowDown" ? -0.01 : 0),
                ),
              ),
            });
          }
        }}
      >
        <span
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
        />
      </div>
      <label className="block">
        Farbton
        <input
          aria-label="Farbton"
          className="mt-1 block w-full accent-primary"
          type="range"
          min={0}
          max={360}
          value={hsv.h}
          onChange={(e) => setHsv({ ...hsv, h: Number(e.target.value) })}
        />
      </label>
      <p className="text-muted-foreground">
        Farbton wählen, dann in die Palette klicken. Pfeiltasten und Enter sind ebenfalls möglich.
      </p>
    </div>
  );
}
