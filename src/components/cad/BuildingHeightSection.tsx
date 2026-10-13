import type { ReactNode } from "react";

export type BuildingSectionStorey = {
  id: string;
  name: string;
  aboveControl?: ReactNode;
  belowControl?: ReactNode;
  nameInput?: ReactNode;
  heightInput: ReactNode;
  elevationInput: ReactNode;
};

/** Read-only presentation of bottom-to-top storeys. No second building model.
 * Repeated fixed-height rows keep inputs readable regardless of storey count.
 */
export function BuildingHeightSection({
  storeys,
  topInput,
}: {
  storeys: readonly BuildingSectionStorey[];
  topInput: ReactNode;
}) {
  return (
    <figure className="space-y-3" aria-label="Gebäudeschnitt mit Rohdecken-Höhenbezügen">
      <div className="overflow-x-auto rounded-lg border bg-background/40 p-4">
        <div className="min-w-[390px]">
          <div className="grid grid-cols-[58%_42%] items-end">
            <div />
            <label className="block space-y-1 pb-2 pl-4">
              <span className="block text-[11px] text-muted-foreground">OK Rohdecke darüber</span>
              {topInput}
            </label>
          </div>
          {[...storeys].reverse().map((storey, index) => (
            <section
              key={storey.id}
              aria-label={`Geschoss ${storey.name}`}
              className="relative grid h-[180px] grid-cols-[58%_42%]"
            >
              <div
                style={{ borderColor: "black" }}
                className={`ml-8 mr-3 flex items-center border-x-[12px] border-b-[14px] border-black px-4 ${index === 0 ? "border-t-[14px]" : ""}`}
              >
                <div className="block w-full space-y-1">
                  {storey.aboveControl}
                  <span className="block truncate text-[11px] font-medium" title={storey.name}>
                    {storey.nameInput ?? storey.name}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">Geschosshöhe</span>
                  {storey.heightInput}
                  {storey.belowControl}
                </div>
              </div>
              <div className="relative">
                {index === 0 && (
                  <ElevationMarker className="absolute -top-[10px] left-0 h-3 w-full" />
                )}
                <label className="absolute bottom-6 left-4 right-0 block space-y-1">
                  <span className="block text-[11px] text-muted-foreground">
                    {storey.name} · OK Rohdecke
                  </span>
                  {storey.elevationInput}
                </label>
                <ElevationMarker className="absolute bottom-[13px] left-0 h-3 w-full" />
              </div>
            </section>
          ))}
          <p className="mt-4 text-[11px] text-muted-foreground">Bezug: Oberkante Rohdecke</p>
        </div>
      </div>
      <figcaption className="text-muted-foreground">
        Schematische Darstellung. Geschosshöhe = obere Höhenkote − untere Höhenkote.
      </figcaption>
    </figure>
  );
}

function ElevationMarker({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 190 12" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M0 11 H190 M14 1 L24 11 L34 1 Z" fill="none" stroke="black" strokeWidth="1.25" />
    </svg>
  );
}
