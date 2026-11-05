import { objectSymbol, type PlacedObject } from "@/domain/elements/object/model";
import { CAD_TURQUOISE } from "@/rendering/viewport/highlight";

/** The chosen library object at the cursor before its click (docs/OBJEKTBIBLIOTHEK.md, M1). */
export function ObjectGhostOverlay({
  object,
}: {
  object: Pick<
    PlacedObject,
    "catalogId" | "position" | "rotation" | "mirrored" | "width" | "depth"
  >;
}) {
  return (
    <g pointerEvents="none" aria-label="Objekt am Cursor">
      {objectSymbol(object).map((line, i) => {
        const shared = {
          points: line.points.map((p) => `${p.x},${-p.y}`).join(" "),
          fill: "none",
          stroke: CAD_TURQUOISE,
          strokeWidth: 1,
          vectorEffect: "non-scaling-stroke" as const,
        };
        return line.closed ? <polygon key={i} {...shared} /> : <polyline key={i} {...shared} />;
      })}
    </g>
  );
}
