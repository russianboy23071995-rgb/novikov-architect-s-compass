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
  other: "Sonstiges",
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
  media: "Technik",
  vehicles: "Fahrzeuge",
} as const;
export type ObjectGenre = keyof typeof OBJECT_GENRES;

/** How an object is handed to IFC: entity and predefined type (IFC4). */
export type ObjectIfcClass =
  | { entity: "IFCFURNITURE"; type: "BED" | "TABLE" | "CHAIR" | "SOFA" | "SHELF" | "USERDEFINED" }
  | {
      entity: "IFCSANITARYTERMINAL";
      type: "TOILETPAN" | "WASHHANDBASIN" | "SHOWER" | "BATH" | "SINK";
    }
  | { entity: "IFCELECTRICAPPLIANCE"; type: "ELECTRICCOOKER" | "FRIDGE_FREEZER" }
  | { entity: "IFCAUDIOVISUALAPPLIANCE"; type: "DISPLAY" }
  | { entity: "IFCBUILDINGELEMENTPROXY"; type: "USERDEFINED" };

export type ObjectDefinition = {
  name: string;
  category: ObjectCategory;
  genre: ObjectGenre;
  /** Other words the library search finds this entry by. */
  terms: readonly string[];
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
    terms: ["Bett", "Liege", "Schlafen", "Schlafzimmer"],
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
    terms: ["Bett", "Ehebett", "Schlafen", "Schlafzimmer"],
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
    name: "Esstisch",
    terms: ["Tisch", "Essen", "Esszimmer", "Küchentisch"],
    category: "furniture",
    genre: "tables",
    size: { width: 1.6, depth: 0.9, height: 0.75 },
    symbol: [outline],
    boxes: [[-0.5, 0.5, -0.5, 0.5, 0.95, 1], ...legs(0.95, 0.04, 0.07)],
    ifc: { entity: "IFCFURNITURE", type: "TABLE" },
  },
  chair: {
    name: "Stuhl",
    terms: ["Sitz", "Esszimmer", "Küchenstuhl"],
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
    terms: ["Couch", "Polster", "Sitzgruppe", "Wohnzimmer"],
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
  "coffee-table": {
    name: "Couchtisch",
    category: "furniture",
    genre: "tables",
    terms: ["Tisch", "Beistelltisch", "Wohnzimmer"],
    size: { width: 1.1, depth: 0.6, height: 0.45 },
    symbol: [outline],
    boxes: [full],
    ifc: { entity: "IFCFURNITURE", type: "TABLE" },
  },
  desk: {
    name: "Schreibtisch",
    category: "furniture",
    genre: "tables",
    terms: ["Tisch", "Büro", "Arbeitsplatz", "Arbeitstisch"],
    size: { width: 1.6, depth: 0.8, height: 0.75 },
    symbol: [outline],
    boxes: [full],
    ifc: { entity: "IFCFURNITURE", type: "TABLE" },
  },
  armchair: {
    name: "Sessel",
    category: "furniture",
    genre: "seating",
    terms: ["Polster", "Fauteuil", "Wohnzimmer", "Lehnstuhl"],
    size: { width: 0.9, depth: 0.9, height: 0.8 },
    symbol: [outline],
    boxes: [full],
    ifc: { entity: "IFCFURNITURE", type: "CHAIR" },
  },
  nightstand: {
    name: "Nachttisch",
    category: "furniture",
    genre: "storage",
    terms: ["Nachtkonsole", "Nachtschrank", "Schlafzimmer", "Bett"],
    size: { width: 0.5, depth: 0.4, height: 0.55 },
    symbol: [outline],
    boxes: [full],
    ifc: { entity: "IFCFURNITURE", type: "USERDEFINED" },
  },
  sideboard: {
    name: "Sideboard",
    category: "furniture",
    genre: "storage",
    terms: ["Kommode", "Anrichte", "Lowboard", "Wohnzimmer"],
    size: { width: 1.8, depth: 0.45, height: 0.8 },
    symbol: [outline],
    boxes: [full],
    ifc: { entity: "IFCFURNITURE", type: "USERDEFINED" },
  },
  wardrobe: {
    name: "Schrank",
    terms: ["Kleiderschrank", "Garderobe", "Schlafzimmer"],
    category: "furniture",
    genre: "storage",
    size: { width: 1.2, depth: 0.6, height: 2.1 },
    symbol: [outline, line(-0.5, -0.5, 0.5, 0.5), line(-0.5, -0.4, 0.5, -0.4)],
    boxes: [full],
    ifc: { entity: "IFCFURNITURE", type: "USERDEFINED" },
  },
  shelf: {
    name: "Regal",
    terms: ["Bücherregal", "Ablage"],
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
    terms: ["Arbeitsplatte", "Unterschrank", "Einbauküche"],
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
    terms: ["Kochfeld", "Backofen", "Ofen", "Kochen"],
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
    terms: ["Spülbecken", "Becken", "Abwasch"],
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
    terms: ["Gefrierschrank", "Kühlen"],
    category: "kitchen",
    genre: "kitchen",
    size: { width: 0.6, depth: 0.65, height: 1.8 },
    symbol: [outline, line(-0.5, -0.5, 0.5, 0.5), line(-0.5, 0.5, 0.5, -0.5)],
    boxes: [full],
    ifc: { entity: "IFCELECTRICAPPLIANCE", type: "FRIDGE_FREEZER" },
  },
  wc: {
    name: "WC",
    terms: ["Toilette", "Klo", "Klosett", "Bad"],
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
    terms: ["Waschbecken", "Handwaschbecken", "Lavabo", "Bad"],
    category: "sanitary",
    genre: "sanitary",
    size: { width: 0.6, depth: 0.45, height: 0.85 },
    symbol: [outline, circle(0, -0.06, 0.38, 0.34), circle(0, 0.38, 0.05)],
    boxes: [[-0.5, 0.5, -0.5, 0.5, 0.8, 1]],
    ifc: { entity: "IFCSANITARYTERMINAL", type: "WASHHANDBASIN" },
  },
  shower: {
    name: "Dusche",
    terms: ["Duschtasse", "Brause", "Bad"],
    category: "sanitary",
    genre: "sanitary",
    size: { width: 0.9, depth: 0.9, height: 0.05 },
    symbol: [outline, line(-0.5, -0.5, 0.5, 0.5), line(-0.5, 0.5, 0.5, -0.5), circle(0, 0, 0.05)],
    boxes: [full],
    ifc: { entity: "IFCSANITARYTERMINAL", type: "SHOWER" },
  },
  bathtub: {
    name: "Badewanne",
    terms: ["Wanne", "Bad"],
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
  television: {
    name: "Fernseher",
    category: "other",
    genre: "media",
    terms: ["TV", "Bildschirm", "Monitor", "Flachbild", "Wohnzimmer"],
    size: { width: 1.45, depth: 0.1, height: 0.9 },
    symbol: [outline],
    boxes: [full],
    ifc: { entity: "IFCAUDIOVISUALAPPLIANCE", type: "DISPLAY" },
  },
  car: {
    name: "Pkw",
    category: "other",
    genre: "vehicles",
    terms: ["Auto", "Fahrzeug", "Wagen", "Kfz", "Garage", "Stellplatz", "Parkplatz"],
    size: { width: 4.7, depth: 1.85, height: 1.5 },
    symbol: [outline],
    boxes: [full],
    ifc: { entity: "IFCBUILDINGELEMENTPROXY", type: "USERDEFINED" },
  },
} as const satisfies Record<string, ObjectDefinition>;

export type ObjectCatalogId = keyof typeof OBJECT_CATALOG;
export const OBJECT_CATALOG_IDS = Object.keys(OBJECT_CATALOG) as [
  ObjectCatalogId,
  ...ObjectCatalogId[],
];

type NewInV61 = "coffee-table" | "desk" | "armchair" | "nightstand" | "sideboard";
const NEW_IN_V61: readonly string[] = [
  "coffee-table",
  "desk",
  "armchair",
  "nightstand",
  "sideboard",
] satisfies NewInV61[];
/** Entries a file of format 60 can hold; five more came with format 61. */
export const OBJECT_CATALOG_IDS_V60 = OBJECT_CATALOG_IDS.filter(
  (id) => !NEW_IN_V61.includes(id),
) as [Exclude<ObjectCatalogId, NewInV61>, ...Exclude<ObjectCatalogId, NewInV61>[]];
/** Entries a file of format 59 or older can hold; car and television came with format 60. */
export const OBJECT_CATALOG_IDS_V59 = OBJECT_CATALOG_IDS_V60.filter(
  (id) => id !== "television" && id !== "car",
) as [
  Exclude<ObjectCatalogId, NewInV61 | "television" | "car">,
  ...Exclude<ObjectCatalogId, NewInV61 | "television" | "car">[],
];

/** Search form of a text: case and the spellings of umlauts do not matter. */
const searchForm = (text: string) =>
  text
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä|ae/g, "a")
    .replace(/ö|oe/g, "o")
    .replace(/ü|ue/g, "u");

/**
 * Entries the library search finds (docs/OBJEKTBIBLIOTHEK.md, M3): every word of the query has
 * to appear in the name, the genre, the category or the search words. Names that start with the
 * query come first, then names holding it, then the rest, each in catalogue order.
 */
export function searchObjects(query: string): ObjectCatalogId[] {
  const words = searchForm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const rank = (id: ObjectCatalogId) => {
    const name = searchForm(OBJECT_CATALOG[id].name);
    return name.startsWith(words[0]!) ? 0 : name.includes(words[0]!) ? 1 : 2;
  };
  return OBJECT_CATALOG_IDS.filter((id) => {
    const d: ObjectDefinition = OBJECT_CATALOG[id];
    const text = searchForm(
      [d.name, OBJECT_GENRES[d.genre], OBJECT_CATEGORIES[d.category], ...d.terms].join(" "),
    );
    return words.every((word) => text.includes(word));
  }).sort((a, b) => rank(a) - rank(b));
}

/** The definition of a catalogue object. */
export function objectDefinition(id: ObjectCatalogId): ObjectDefinition {
  return OBJECT_CATALOG[id];
}
