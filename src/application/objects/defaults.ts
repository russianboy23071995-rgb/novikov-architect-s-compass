import { objectDefaults, type PlacedObject } from "../../domain/elements/object/model.ts";
import { objectDefinition, type ObjectCatalogId } from "../../domain/elements/object/catalog.ts";
import type { WallRenovation } from "../../domain/elements/wall/renovation.ts";

/**
 * Settings of a library object as the tool bar, the library window and the element properties
 * edit them (docs/OBJEKTBIBLIOTHEK.md, M1).
 */
export type ObjectToolDefaults = {
  catalogId: ObjectCatalogId;
  width: number;
  depth: number;
  height: number;
  rotation: number;
  mirrored: boolean;
  baseOffset: number;
  renovation: WallRenovation;
  layerId: string;
};

/** Tool defaults: a table at its catalogue size, Neubau like new walls. */
export function objectToolDefaults(
  layerId: string,
  catalogId: ObjectCatalogId = "table",
): ObjectToolDefaults {
  const { width, depth, height, rotation, baseOffset } = objectDefaults(catalogId);
  return {
    catalogId,
    width,
    depth,
    height,
    rotation,
    mirrored: false,
    baseOffset,
    renovation: "new",
    layerId,
  };
}

/** Another catalogue entry: its own size; turn, height above floor, status and layer stay. */
export function chooseObject(
  value: ObjectToolDefaults,
  catalogId: ObjectCatalogId,
): ObjectToolDefaults {
  return value.catalogId === catalogId
    ? value
    : { ...value, catalogId, ...objectDefinition(catalogId).size };
}

/** The stored object values of the settings. */
export function objectValues(d: ObjectToolDefaults): Omit<PlacedObject, "id" | "position"> {
  const { mirrored, ...values } = d;
  return { ...values, ...(mirrored ? { mirrored: true } : {}) };
}

/** Settings view of an existing object. */
export function objectSettings(o: PlacedObject): ObjectToolDefaults {
  return {
    catalogId: o.catalogId,
    width: o.width,
    depth: o.depth,
    height: o.height,
    rotation: o.rotation,
    mirrored: !!o.mirrored,
    baseOffset: o.baseOffset,
    renovation: o.renovation ?? "existing",
    layerId: o.layerId,
  };
}
