import type { ReactNode } from "react";

/** Schematic reference diagram, not a second building model or a scaled section. */
export function BuildingHeightSection({
  groundInput,
  elevationInput,
  heightInput,
}: {
  groundInput: ReactNode;
  elevationInput: ReactNode;
  heightInput: ReactNode;
}) {
  return (
    <figure className="space-y-3" aria-label="Gebäudeschnitt mit Rohdecken-Höhenbezügen">
      <div className="relative h-[340px] min-w-[390px] rounded-lg border bg-background/40">
        <svg
          viewBox="0 0 520 340"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {/* Both elevation markers terminate at the upper slab edge. */}
          <g fill="black" stroke="black" strokeWidth="1.3">
            <path d="M58 95 H302 V112 H58 Z M58 260 H302 V277 H58 Z" />
            <path d="M72 112 H85 V260 H72 Z M275 112 H288 V260 H275 Z" />
          </g>
          <g fill="none" stroke="black" strokeWidth="1.25">
            <path d="M300 95 H490 M300 260 H490" />
            <path d="M322 84 L331 95 L340 84 Z M322 249 L331 260 L340 249 Z" />
          </g>
        </svg>
        <div className="absolute left-[65%] right-3 top-[27px]">
          <label className="block space-y-1">
            <span className="block text-[11px] text-muted-foreground">OK Rohdecke darüber</span>
            {elevationInput}
          </label>
        </div>
        <div className="absolute left-[21%] top-[155px] w-[30%]">
          <label className="block space-y-1">
            <span className="block text-[11px] text-muted-foreground">Geschosshöhe</span>
            {heightInput}
          </label>
        </div>
        <div className="absolute left-[65%] right-3 top-[207px]">
          <label className="block space-y-1">
            <span className="block text-[11px] text-muted-foreground">EG · OK Rohdecke</span>
            {groundInput}
          </label>
        </div>
        <span className="absolute bottom-4 left-4 text-[11px] text-muted-foreground">
          Bezug: Oberkante Rohdecke
        </span>
      </div>
      <figcaption className="text-muted-foreground">
        Schematische Darstellung. Geschosshöhe = obere Höhenkote − EG-Bezug.
      </figcaption>
    </figure>
  );
}
