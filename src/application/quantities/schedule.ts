import type { Project, Wall } from "../../domain/project/schema.ts";
import { wallLength } from "../../domain/project/schema.ts";
import { WALL_RENOVATION_LABELS } from "../../domain/elements/wall/renovation.ts";
import {
  projectMaterials,
  projectWallAssemblies,
  wallLayers,
} from "../../domain/elements/wall/assembly.ts";
import { doorOpening } from "../../domain/elements/door/model.ts";
import { columnLevels, type Column } from "../../domain/elements/column/model.ts";
import { slabArea } from "../../domain/elements/slab/model.ts";
import { roofFaceRings } from "../../domain/elements/roof/geometry.ts";
import { roofBody } from "../../domain/elements/roof/body.ts";
import { STAIR_SHAPE_LABELS, stairGeometry } from "../../domain/elements/stair/model.ts";
import { stairBody } from "../../domain/elements/stair/body.ts";

/** Element lists of the quantity schedule (docs/MENGEN.md, ML1). */
export const QUANTITY_KINDS = [
  "walls",
  "windows",
  "doors",
  "columns",
  "slabs",
  "roofs",
  "stairs",
  "materials",
] as const;
export type QuantityKind = (typeof QUANTITY_KINDS)[number];

/** One column; numbers carry their unit and decimals, `sum` columns add up per storey. */
export type QuantityColumn = {
  key: string;
  label: string;
  unit?: string;
  digits?: number;
  sum?: boolean;
};
export type QuantityValue = string | number | null;
export type QuantityRow = {
  storeyId: string | null;
  /** The listed element; null for the material rows. */
  elementId: string | null;
  cells: Record<string, QuantityValue>;
};
export type QuantityGroup = {
  storeyId: string | null;
  name: string;
  rows: QuantityRow[];
  sums: Record<string, number>;
};
export type QuantityTable = {
  kind: QuantityKind;
  title: string;
  /** Short note on how the values are measured, shown above the list and in the CSV. */
  note: string;
  columns: QuantityColumn[];
  /** Per storey with rows; the material list is one group for the whole project. */
  groups: QuantityGroup[];
  sums: Record<string, number>;
};
export type QuantitySchedule = Record<QuantityKind, QuantityTable>;

type Storey = Project["storeys"][number];
type Built = { rows: QuantityRow[] };

const count: QuantityColumn = { key: "count", label: "Stück", digits: 0, sum: true };
const renovation = (status: keyof typeof WALL_RENOVATION_LABELS | undefined) =>
  WALL_RENOVATION_LABELS[status ?? "existing"];

/** Part of an opening inside the wall's height, both measured from the wall base. */
function openingArea(
  opening: { width: number; height: number; sillHeight: number },
  wall: Pick<Wall, "height">,
) {
  const bottom = Math.max(0, opening.sillHeight);
  const top = Math.min(wall.height, opening.sillHeight + opening.height);
  return opening.width * Math.max(0, top - bottom);
}

/** Wall quantities along the axis (decision 1): length × height minus openings; corners and
 * joins are not cut against each other, roof trims are not subtracted. */
export function wallQuantities(storey: Storey, wall: Wall) {
  const length = wallLength(wall);
  const gross = length * wall.height;
  const openings =
    storey.windows
      .filter((w) => w.wallId === wall.id)
      .reduce((sum, w) => sum + openingArea(w, wall), 0) +
    (storey.doors ?? [])
      .filter((d) => d.wallId === wall.id)
      .reduce((sum, d) => sum + openingArea(doorOpening(d, wall), wall), 0);
  const net = Math.max(0, gross - openings);
  return { length, gross, openings, net, volume: net * wall.thickness };
}

function columnArea(column: Column) {
  return column.shape.kind === "circle"
    ? (Math.PI * column.shape.diameter ** 2) / 4
    : column.shape.width * column.shape.depth;
}

const cm = (metres: number) =>
  (Math.round(metres * 1000) / 10).toLocaleString("de-DE", { maximumFractionDigits: 1 });

function table(
  project: Project,
  kind: QuantityKind,
  title: string,
  note: string,
  columns: QuantityColumn[],
  build: (storey: Storey) => Built,
): QuantityTable {
  const groups = project.storeys
    .map((storey) => ({ storeyId: storey.id, name: storey.name, ...build(storey) }))
    .filter((g) => g.rows.length > 0)
    .map((g) => ({ ...g, sums: sums(columns, g.rows) }));
  return {
    kind,
    title,
    note,
    columns,
    groups,
    sums: sums(
      columns,
      groups.flatMap((g) => g.rows),
    ),
  };
}

function sums(columns: QuantityColumn[], rows: QuantityRow[]) {
  const result: Record<string, number> = {};
  for (const column of columns)
    if (column.sum)
      result[column.key] = rows.reduce((total, row) => {
        const value = row.cells[column.key];
        return typeof value === "number" ? total + value : total;
      }, 0);
  return result;
}

/**
 * Quantity schedule of the whole project (docs/MENGEN.md, ML1): one list per element kind,
 * grouped by storey with sums per storey and project, plus the material list from the wall
 * build-ups. A query only; the model is never changed. Each element reads its own storey (A08).
 * Shared by the element list window, its CSV files and future text queries (L17).
 */
export function quantitySchedule(project: Project): QuantitySchedule {
  const assemblies = projectWallAssemblies(project);
  const materials = projectMaterials(project);
  const assemblyName = (wall: Wall) => assemblies.find((a) => a.id === wall.assemblyId)?.name ?? "";

  const walls = table(
    project,
    "walls",
    "Wände",
    "Über die Wandachse: Länge × Höhe abzüglich Öffnungen; Ecken und Anschlüsse nicht verschnitten, Dachtrimmung nicht abgezogen.",
    [
      { key: "assembly", label: "Aufbau" },
      { key: "renovation", label: "Bauzustand" },
      { key: "thickness", label: "Stärke", unit: "m", digits: 3 },
      { key: "length", label: "Länge", unit: "m", digits: 2, sum: true },
      { key: "height", label: "Höhe", unit: "m", digits: 2 },
      { key: "gross", label: "Fläche brutto", unit: "m²", digits: 2, sum: true },
      { key: "openings", label: "Öffnungen", unit: "m²", digits: 2, sum: true },
      { key: "net", label: "Fläche netto", unit: "m²", digits: 2, sum: true },
      { key: "volume", label: "Volumen", unit: "m³", digits: 3, sum: true },
    ],
    (storey) => ({
      rows: storey.walls.map((wall) => {
        const q = wallQuantities(storey, wall);
        return {
          storeyId: storey.id,
          elementId: wall.id,
          cells: {
            assembly: assemblyName(wall),
            renovation: renovation(wall.renovation),
            thickness: wall.thickness,
            length: q.length,
            height: wall.height,
            gross: q.gross,
            openings: q.openings,
            net: q.net,
            volume: q.volume,
          },
        };
      }),
    }),
  );

  const wallOf = (storey: Storey, wallId: string) => storey.walls.find((w) => w.id === wallId);
  const windows = table(
    project,
    "windows",
    "Fenster",
    "Rohbaumaße der Öffnung; Brüstung über dem Wandfuß. Eine Zeile je Fenster.",
    [
      { key: "mark", label: "Pos." },
      { key: "width", label: "Breite", unit: "m", digits: 3 },
      { key: "height", label: "Höhe", unit: "m", digits: 3 },
      { key: "sill", label: "Brüstung", unit: "m", digits: 3 },
      { key: "area", label: "Fläche", unit: "m²", digits: 2, sum: true },
      { key: "wall", label: "Wand" },
      count,
    ],
    (storey) => ({
      rows: storey.windows.map((w) => {
        const wall = wallOf(storey, w.wallId);
        return {
          storeyId: storey.id,
          elementId: w.id,
          cells: {
            mark: w.mark ?? "",
            width: w.width,
            height: w.height,
            sill: w.sillHeight,
            area: w.width * w.height,
            wall: wall ? assemblyName(wall) || `${cm(wall.thickness)} cm` : "",
            count: 1,
          },
        };
      }),
    }),
  );

  const doors = table(
    project,
    "doors",
    "Türen",
    "Rohbaumaße der Öffnung; Unterkante über dem Geschossboden. Eine Zeile je Tür.",
    [
      { key: "mark", label: "Pos." },
      { key: "width", label: "Breite", unit: "m", digits: 3 },
      { key: "height", label: "Höhe", unit: "m", digits: 3 },
      { key: "zOffset", label: "Unterkante", unit: "m", digits: 3 },
      { key: "area", label: "Fläche", unit: "m²", digits: 2, sum: true },
      { key: "wall", label: "Wand" },
      count,
    ],
    (storey) => ({
      rows: (storey.doors ?? []).map((d) => {
        const wall = wallOf(storey, d.wallId);
        return {
          storeyId: storey.id,
          elementId: d.id,
          cells: {
            mark: d.mark ?? "",
            width: d.width,
            height: d.height,
            zOffset: d.zOffset,
            area: d.width * d.height,
            wall: wall ? assemblyName(wall) || `${cm(wall.thickness)} cm` : "",
            count: 1,
          },
        };
      }),
    }),
  );

  const columns = table(
    project,
    "columns",
    "Stützen",
    "Querschnitt × Höhe vom Fuß bis zur Oberkante.",
    [
      { key: "section", label: "Querschnitt" },
      { key: "renovation", label: "Bauzustand" },
      { key: "height", label: "Höhe", unit: "m", digits: 2 },
      { key: "area", label: "Querschnittsfläche", unit: "m²", digits: 3 },
      { key: "volume", label: "Volumen", unit: "m³", digits: 3, sum: true },
      count,
    ],
    (storey) => ({
      rows: (storey.columns ?? []).map((c) => {
        const levels = columnLevels(c, storey.height);
        const height = levels ? levels.top - levels.bottom : null;
        const area = columnArea(c);
        return {
          storeyId: storey.id,
          elementId: c.id,
          cells: {
            section:
              c.shape.kind === "circle"
                ? `Ø ${cm(c.shape.diameter)} cm`
                : `${cm(c.shape.width)} × ${cm(c.shape.depth)} cm`,
            renovation: renovation(c.renovation),
            height,
            area,
            volume: height === null ? null : area * height,
            count: 1,
          },
        };
      }),
    }),
  );

  const slabs = table(
    project,
    "slabs",
    "Decken",
    "Grundfläche des Umrisses × Dicke; Öffnungen und Durchdringungen nicht abgezogen.",
    [
      { key: "area", label: "Fläche", unit: "m²", digits: 2, sum: true },
      { key: "thickness", label: "Dicke", unit: "m", digits: 3 },
      { key: "volume", label: "Volumen", unit: "m³", digits: 3, sum: true },
      count,
    ],
    (storey) => ({
      rows: (storey.slabs ?? []).map((s) => {
        const area = slabArea(s);
        return {
          storeyId: storey.id,
          elementId: s.id,
          cells: { area, thickness: s.thickness, volume: area * s.thickness, count: 1 },
        };
      }),
    }),
  );

  const roofs = table(
    project,
    "roofs",
    "Dächer",
    "Dachfläche geneigt (Oberseite), Grundfläche in der Draufsicht, Volumen des Dachkörpers.",
    [
      { key: "pitch", label: "Neigung", unit: "°", digits: 1 },
      { key: "thickness", label: "Stärke", unit: "m", digits: 3 },
      { key: "planArea", label: "Grundfläche", unit: "m²", digits: 2, sum: true },
      { key: "area", label: "Dachfläche", unit: "m²", digits: 2, sum: true },
      { key: "volume", label: "Volumen", unit: "m³", digits: 3, sum: true },
      count,
    ],
    (storey) => ({
      rows: (storey.roofs ?? []).map((r) => {
        const planArea = slabArea({ points: roofFaceRings(r).top });
        return {
          storeyId: storey.id,
          elementId: r.id,
          cells: {
            pitch: r.pitch,
            thickness: r.thickness,
            planArea,
            area: planArea / Math.cos((r.pitch * Math.PI) / 180),
            volume: roofBody(r, 0).volume,
            count: 1,
          },
        };
      }),
    }),
  );

  const stairs = table(
    project,
    "stairs",
    "Treppen",
    "Steigungen und Auftritt wie im Treppenwerkzeug; Volumen von Läufen und Podesten.",
    [
      { key: "shape", label: "Form" },
      { key: "width", label: "Laufbreite", unit: "m", digits: 2 },
      { key: "risers", label: "Steigungen", digits: 0 },
      { key: "riser", label: "Steigung", unit: "m", digits: 3 },
      { key: "tread", label: "Auftritt", unit: "m", digits: 3 },
      { key: "run", label: "Lauflänge", unit: "m", digits: 2 },
      { key: "volume", label: "Volumen", unit: "m³", digits: 3, sum: true },
      count,
    ],
    (storey) => ({
      rows: (storey.stairs ?? []).map((s) => {
        const g = stairGeometry(s, storey.height);
        return {
          storeyId: storey.id,
          elementId: s.id,
          cells: {
            shape: STAIR_SHAPE_LABELS[s.shape],
            width: s.width,
            risers: g?.riserCount ?? null,
            riser: g?.riser ?? null,
            tread: g?.tread ?? null,
            run: g?.run ?? null,
            volume: stairBody(s, 0, storey.height)?.volume ?? null,
            count: 1,
          },
        };
      }),
    }),
  );

  // Materials (ML3): every layer of a wall with a build-up over the wall's net area.
  const byMaterial = new Map<string, { area: number; volume: number }>();
  for (const storey of project.storeys)
    for (const wall of storey.walls) {
      const layers = wallLayers(wall, assemblies);
      if (!layers) continue;
      const { net } = wallQuantities(storey, wall);
      for (const layer of layers) {
        const entry = byMaterial.get(layer.materialId) ?? { area: 0, volume: 0 };
        entry.area += net;
        entry.volume += net * layer.thickness;
        byMaterial.set(layer.materialId, entry);
      }
    }
  const materialColumns: QuantityColumn[] = [
    { key: "material", label: "Material" },
    { key: "area", label: "Fläche", unit: "m²", digits: 2 },
    { key: "volume", label: "Volumen", unit: "m³", digits: 3 },
  ];
  const materialRows: QuantityRow[] = materials
    .filter((m) => byMaterial.has(m.id))
    .map((m) => ({
      storeyId: null,
      elementId: null,
      cells: {
        material: m.name,
        area: byMaterial.get(m.id)!.area,
        volume: byMaterial.get(m.id)!.volume,
      },
    }));
  const materialTable: QuantityTable = {
    kind: "materials",
    title: "Materialien",
    note: "Aus den Wandaufbauten: Nettofläche der Wand je Schicht, Volumen = Fläche × Schichtdicke. Gleiche Materialien mehrerer Schichten zusammengezählt.",
    columns: materialColumns,
    groups: materialRows.length
      ? [{ storeyId: null, name: "Projekt", rows: materialRows, sums: {} }]
      : [],
    sums: {},
  };

  return {
    walls,
    windows,
    doors,
    columns,
    slabs,
    roofs,
    stairs,
    materials: materialTable,
  };
}

/** Rounded half away from zero; the tiny nudge keeps products like 6,78 × 0,025 = 0,1695 from
 * rounding down because of binary floating point. */
const decimal = (value: number, digits: number) =>
  (value + Math.sign(value) * 1e-9).toLocaleString("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  });

/** A cell as text: numbers with their decimals and decimal comma, missing values empty. */
export function quantityText(column: QuantityColumn, value: QuantityValue | undefined): string {
  if (value === null || value === undefined) return "";
  return typeof value === "number" ? decimal(value, column.digits ?? 2) : value;
}

/** CSV for Excel like the room list: semicolons, decimal comma, UTF-8 with byte order mark,
 * the note as first line, one row per element plus a sum row per storey and for the project. */
export function quantityCsv(table: QuantityTable): string {
  const cell = (value: string) =>
    /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  const label = (c: QuantityColumn) => (c.unit ? `${c.label} ${c.unit}` : c.label);
  const grouped = table.groups.some((g) => g.storeyId !== null);
  const rows: string[][] = [
    [`${table.title}: ${table.note}`],
    [...(grouped ? ["Geschoss"] : []), ...table.columns.map(label)],
  ];
  const sumRow = (name: string, sums: Record<string, number>) => [
    name,
    ...table.columns.map((c) => (c.sum ? quantityText(c, sums[c.key] ?? 0) : "")),
  ];
  for (const group of table.groups) {
    for (const row of group.rows)
      rows.push([
        ...(grouped ? [group.name] : []),
        ...table.columns.map((c) => quantityText(c, row.cells[c.key])),
      ]);
    if (grouped) rows.push(sumRow(`Summe ${group.name}`, group.sums));
  }
  if (grouped) rows.push(sumRow("Summe Projekt", table.sums));
  return "﻿" + rows.map((row) => row.map(cell).join(";")).join("\r\n") + "\r\n";
}
