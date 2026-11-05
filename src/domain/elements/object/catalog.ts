/**
 * Built-in object catalogue (docs/OBJEKTBIBLIOTHEK.md, L44 O1). Every object is drawn for this
 * project, no third-party model or licence: a plan symbol and a few boxes, both in unit
 * coordinates of the object's box. `u` runs across the width (−0.5 left … 0.5 right), `v`
 * across the depth (−0.5 front … 0.5 back, the side that stands against a wall), `z` in shares
 * of the height. The symbol and the boxes follow every width, depth and height.
 */

/** A plan symbol primitive: an open or closed polyline, or an ellipse. */
export type ObjectSymbolPart =
  | { kind: "poly"; points: readonly (readonly [number, number])[]; closed?: true }
  | { kind: "ellipse"; centre: readonly [number, number]; radius: readonly [number, number] };
/** A closed box [u0, u1, v0, v1, z0, z1] in unit coordinates. */
export type ObjectBox = readonly [number, number, number, number, number, number];

export const OBJECT_CATEGORIES = {
  furniture: "Möbel",
  kitchen: "Küche",
  sanitary: "Sanitär",
} as const;
export type ObjectCategory = keyof typeof OBJECT_CATEGORIES;

/** Genres of the library window, in display order (docs/OBJEKTBIBLIOTHEK.md, M1). */
export const OBJECT_GENRES = {
  seating: "Sitzmöbel",
  tables: "Tische",
  beds: "Betten",
  storage: "Schränke und Regale",
  kitchen: "Küche",
  sanitary: "Sanitär",
} as const;
export type ObjectGenre = keyof typeof OBJECT_GENRES;

/** How an object is handed to IFC: entity and predefined type (IFC4). */
export type ObjectIfcClass =
  | { entity: "IFCFURNITURE"; type: "BED" | "TABLE" | "CHAIR" | "SOFA" | "SHELF" | "USERDEFINED" }
  | {
      entity: "IFCSANITARYTERMINAL";
      type: "TOILETPAN" | "WASHHANDBASIN" | "SHOWER" | "BATH" | "SINK";
    }
  | { entity: "IFCELECTRICAPPLIANCE"; type: "ELECTRICCOOKER" | "FRIDGE_FREEZER" };

export type ObjectDefinition = {
  name: string;
  category: ObjectCategory;
  genre: ObjectGenre;
  /** Start size in metres. */
  size: { width: number; depth: number; height: number };
  symbol: readonly ObjectSymbolPart[];
  boxes: readonly ObjectBox[];
  ifc: ObjectIfcClass;
};

const outline: ObjectSymbolPart = {
  kind: "poly",
  points: [
    [-0.5, -0.5],
    [0.5, -0.5],
    [0.5, 0.5],
    [-0.5, 0.5],
  ],
  closed: true,
};
const rect = (u0: number, u1: number, v0: number, v1: number): ObjectSymbolPart => ({
  kind: "poly",
  points: [
    [u0, v0],
    [u1, v0],
    [u1, v1],
    [u0, v1],
  ],
  closed: true,
});
const line = (u0: number, v0: number, u1: number, v1: number): ObjectSymbolPart => ({
  kind: "poly",
  points: [
    [u0, v0],
    [u1, v1],
  ],
});
const circle = (u: number, v: number, ru: number, rv = ru): ObjectSymbolPart => ({
  kind: "ellipse",
  centre: [u, v],
  radius: [ru, rv],
});
const full: ObjectBox = [-0.5, 0.5, -0.5, 0.5, 0, 1];
/** Four legs of a table or chair below `z`, `w` wide in unit shares. */
const legs = (z: number, wu: number, wv: number, back = 0.5): ObjectBox[] => [
  [-0.5, -0.5 + wu, -0.5, -0.5 + wv, 0, z],
  [0.5 - wu, 0.5, -0.5, -0.5 + wv, 0, z],
  [0.5 - wu, 0.5, back - wv, back, 0, z],
  [-0.5, -0.5 + wu, back - wv, back, 0, z],
];

export const OBJECT_CATALOG = {
  "bed-single": {
    name: "Einzelbett",
    category: "furniture",
    genre: "beds",
    size: { width: 0.9, depth: 2, height: 0.45 },
    symbol: [outline, rect(-0.4, 0.4, 0.33, 0.46), line(-0.5, 0.22, 0.5, 0.22)],
    boxes: [
      [-0.5, 0.5, -0.5, 0.47, 0, 1],
      [-0.5, 0.5, 0.47, 0.5, 0, 1.9],
    ],
    ifc: { entity: "IFCFURNITURE", type: "BED" },
  },
  "bed-double": {
    name: "Doppelbett",
    category: "furniture",
    genre: "beds",
    size: { width: 1.8, depth: 2, height: 0.45 },
    symbol: [
      outline,
      rect(-0.45, -0.05, 0.33, 0.46),
      rect(0.05, 0.45, 0.33, 0.46),
      line(-0.5, 0.22, 0.5, 0.22),
      line(0, -0.5, 0, 0.22),
    ],
    boxes: [
      [-0.5, 0.5, -0.5, 0.47, 0, 1],
      [-0.5, 0.5, 0.47, 0.5, 0, 1.9],
    ],
    ifc: { entity: "IFCFURNITURE", type: "BED" },
  },
  table: {
    name: "Tisch",
    category: "furniture",
    genre: "tables",
    size: { width: 1.6, depth: 0.9, height: 0.75 },
    symbol: [outline],
    boxes: [[-0.5, 0.5, -0.5, 0.5, 0.95, 1], ...legs(0.95, 0.04, 0.07)],
    ifc: { entity: "IFCFURNITURE", type: "TABLE" },
  },
  chair: {
    name: "Stuhl",
    category: "furniture",
    genre: "seating",
    size: { width: 0.45, depth: 0.5, height: 0.9 },
    symbol: [outline, line(-0.5, 0.38, 0.5, 0.38)],
    boxes: [
      [-0.5, 0.5, -0.5, 0.38, 0.47, 0.52],
      [-0.5, 0.5, 0.38, 0.5, 0, 1],
      ...legs(0.47, 0.09, 0.08, 0.38),
    ],
    ifc: { entity: "IFCFURNITURE", type: "CHAIR" },
  },
  sofa: {
    name: "Sofa",
    category: "furniture",
    genre: "seating",
    size: { width: 2, depth: 0.9, height: 0.8 },
    symbol: [
      outline,
      line(-0.4, 0.25, 0.4, 0.25),
      line(-0.4, -0.5, -0.4, 0.5),
      line(0.4, -0.5, 0.4, 0.5),
      line(0, -0.5, 0, 0.25),
    ],
    boxes: [
      [-0.4, 0.4, -0.5, 0.25, 0, 0.55],
      [-0.5, 0.5, 0.25, 0.5, 0, 1],
      [-0.5, -0.4, -0.5, 0.25, 0, 0.75],
      [0.4, 0.5, -0.5, 0.25, 0, 0.75],
    ],
    ifc: { entity: "IFCFURNITURE", type: "SOFA" },
  },
  wardrobe: {
    name: "Schrank",
    category: "furniture",
    genre: "storage",
    size: { width: 1.2, depth: 0.6, height: 2.1 },
    symbol: [outline, line(-0.5, -0.5, 0.5, 0.5), line(-0.5, -0.4, 0.5, -0.4)],
    boxes: [full],
    ifc: { entity: "IFCFURNITURE", type: "USERDEFINED" },
  },
  shelf: {
    name: "Regal",
    category: "furniture",
    genre: "storage",
    size: { width: 1, depth: 0.35, height: 2 },
    symbol: [outline, line(-0.5, 0, 0.5, 0)],
    boxes: [
      [-0.5, -0.48, -0.5, 0.5, 0, 1],
      [0.48, 0.5, -0.5, 0.5, 0, 1],
      [-0.48, 0.48, 0.45, 0.5, 0, 1],
      ...[0, 0.25, 0.5, 0.75, 0.99].map(
        (z) => [-0.48, 0.48, -0.5, 0.45, z, z + 0.01] as const satisfies ObjectBox,
      ),
    ],
    ifc: { entity: "IFCFURNITURE", type: "SHELF" },
  },
  "kitchen-counter": {
    name: "Küchenzeile",
    category: "kitchen",
    genre: "kitchen",
    size: { width: 2.4, depth: 0.6, height: 0.9 },
    symbol: [outline, line(-0.5, -0.42, 0.5, -0.42)],
    boxes: [
      [-0.5, 0.5, -0.42, 0.5, 0, 0.95],
      [-0.5, 0.5, -0.5, 0.5, 0.95, 1],
    ],
    ifc: { entity: "IFCFURNITURE", type: "USERDEFINED" },
  },
  stove: {
    name: "Herd",
    category: "kitchen",
    genre: "kitchen",
    size: { width: 0.6, depth: 0.6, height: 0.9 },
    symbol: [
      outline,
      circle(-0.22, -0.2, 0.15),
      circle(0.22, -0.2, 0.15),
      circle(-0.22, 0.22, 0.12),
      circle(0.22, 0.22, 0.12),
    ],
    boxes: [full],
    ifc: { entity: "IFCELECTRICAPPLIANCE", type: "ELECTRICCOOKER" },
  },
  sink: {
    name: "Spüle",
    category: "kitchen",
    genre: "kitchen",
    size: { width: 0.8, depth: 0.6, height: 0.9 },
    symbol: [
      outline,
      rect(-0.38, 0.3, -0.35, 0.3),
      circle(-0.04, -0.03, 0.04),
      circle(0, 0.4, 0.04),
    ],
    boxes: [
      [-0.5, 0.5, -0.5, 0.5, 0, 0.8],
      [-0.5, -0.38, -0.5, 0.5, 0.8, 1],
      [0.3, 0.5, -0.5, 0.5, 0.8, 1],
      [-0.38, 0.3, -0.5, -0.35, 0.8, 1],
      [-0.38, 0.3, 0.3, 0.5, 0.8, 1],
    ],
    ifc: { entity: "IFCSANITARYTERMINAL", type: "SINK" },
  },
  fridge: {
    name: "Kühlschrank",
    category: "kitchen",
    genre: "kitchen",
    size: { width: 0.6, depth: 0.65, height: 1.8 },
    symbol: [outline, line(-0.5, -0.5, 0.5, 0.5), line(-0.5, 0.5, 0.5, -0.5)],
    boxes: [full],
    ifc: { entity: "IFCELECTRICAPPLIANCE", type: "FRIDGE_FREEZER" },
  },
  wc: {
    name: "WC",
    category: "sanitary",
    genre: "sanitary",
    size: { width: 0.4, depth: 0.65, height: 0.8 },
    symbol: [rect(-0.5, 0.5, 0.3, 0.5), circle(0, -0.08, 0.45, 0.4)],
    boxes: [
      [-0.5, 0.5, 0.3, 0.5, 0, 1],
      [-0.42, 0.42, -0.48, 0.3, 0, 0.5],
    ],
    ifc: { entity: "IFCSANITARYTERMINAL", type: "TOILETPAN" },
  },
  washbasin: {
    name: "Waschtisch",
    category: "sanitary",
    genre: "sanitary",
    size: { width: 0.6, depth: 0.45, height: 0.85 },
    symbol: [outline, circle(0, -0.06, 0.38, 0.34), circle(0, 0.38, 0.05)],
    boxes: [[-0.5, 0.5, -0.5, 0.5, 0.8, 1]],
    ifc: { entity: "IFCSANITARYTERMINAL", type: "WASHHANDBASIN" },
  },
  shower: {
    name: "Dusche",
    category: "sanitary",
    genre: "sanitary",
    size: { width: 0.9, depth: 0.9, height: 0.05 },
    symbol: [outline, line(-0.5, -0.5, 0.5, 0.5), line(-0.5, 0.5, 0.5, -0.5), circle(0, 0, 0.05)],
    boxes: [full],
    ifc: { entity: "IFCSANITARYTERMINAL", type: "SHOWER" },
  },
  bathtub: {
    name: "Badewanne",
    category: "sanitary",
    genre: "sanitary",
    size: { width: 1.7, depth: 0.75, height: 0.6 },
    symbol: [
      outline,
      {
        kind: "poly",
        points: [
          [-0.46, -0.4],
          [0.3, -0.4],
          [0.4, -0.3],
          [0.44, 0],
          [0.4, 0.3],
          [0.3, 0.4],
          [-0.46, 0.4],
        ],
        closed: true,
      },
      circle(-0.38, 0, 0.025, 0.055),
    ],
    boxes: [
      [-0.5, 0.5, -0.5, 0.5, 0, 0.3],
      [-0.5, -0.46, -0.5, 0.5, 0.3, 1],
      [0.44, 0.5, -0.5, 0.5, 0.3, 1],
      [-0.46, 0.44, -0.5, -0.4, 0.3, 1],
      [-0.46, 0.44, 0.4, 0.5, 0.3, 1],
    ],
    ifc: { entity: "IFCSANITARYTERMINAL", type: "BATH" },
  },
} as const satisfies Record<string, ObjectDefinition>;

export type ObjectCatalogId = keyof typeof OBJECT_CATALOG;
export const OBJECT_CATALOG_IDS = Object.keys(OBJECT_CATALOG) as [
  ObjectCatalogId,
  ...ObjectCatalogId[],
];

/** The definition of a catalogue object. */
export function objectDefinition(id: ObjectCatalogId): ObjectDefinition {
  return OBJECT_CATALOG[id];
}
