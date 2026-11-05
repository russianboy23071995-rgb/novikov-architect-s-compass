import type { Column, ColumnShape } from "../../domain/elements/column/model.ts";
import type { WallRenovation } from "../../domain/elements/wall/renovation.ts";

/**
 * Column settings as the tool bar, the settings window and the element properties edit them
 * (docs/STUETZEN.md, P2). Both section sizes are kept, so switching the form loses nothing.
 */
export type ColumnDefaults = {
  kind: ColumnShape["kind"];
  width: number;
  depth: number;
  diameter: number;
  rotation: number;
  baseOffset: number;
  heightMode: "storey" | "fixed";
  height: number;
  topOffset: number;
  renovation: WallRenovation;
  layerId: string;
};

/** Tool defaults: 30 × 30 cm or Ø 30 cm, bound to the storey, Neubau like new walls. */
export function columnToolDefaults(layerId: string): ColumnDefaults {
  return {
    kind: "rectangle",
    width: 0.3,
    depth: 0.3,
    diameter: 0.3,
    rotation: 0,
    baseOffset: 0,
    heightMode: "storey",
    height: 2.5,
    topOffset: 0,
    renovation: "new",
    layerId,
  };
}

/** The stored column values of the settings (shape, rotation, heights, status, layer). */
export function columnValues(d: ColumnDefaults): Omit<Column, "id" | "position"> {
  return {
    layerId: d.layerId,
    shape:
      d.kind === "circle"
        ? { kind: "circle", diameter: d.diameter }
        : { kind: "rectangle", width: d.width, depth: d.depth },
    rotation: d.rotation,
    baseOffset: d.baseOffset,
    ...(d.heightMode === "fixed"
      ? { height: d.height }
      : { topBinding: { kind: "storey" as const, topOffset: d.topOffset } }),
    renovation: d.renovation,
  };
}

/** Settings view of an existing column; sizes of the other form fall back to the column's. */
export function columnSettings(column: Column): ColumnDefaults {
  const size =
    column.shape.kind === "circle"
      ? { width: column.shape.diameter, depth: column.shape.diameter }
      : { width: column.shape.width, depth: column.shape.depth };
  return {
    kind: column.shape.kind,
    ...size,
    diameter: column.shape.kind === "circle" ? column.shape.diameter : column.shape.width,
    rotation: column.rotation,
    baseOffset: column.baseOffset,
    heightMode: column.topBinding ? "storey" : "fixed",
    height: column.height ?? 2.5,
    topOffset: column.topBinding?.topOffset ?? 0,
    renovation: column.renovation ?? "existing",
    layerId: column.layerId,
  };
}
