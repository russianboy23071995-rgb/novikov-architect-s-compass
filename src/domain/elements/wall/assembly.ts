import { z } from "zod";

/**
 * Wall build-up (Wandaufbau, docs/WANDAUFBAU.md, SA1): materials and assemblies of the project,
 * like composite structures. An assembly lists its layers from the outside face to the inside
 * face; a wall referencing it takes the sum of the layer thicknesses as its thickness. The
 * outside face is the right-hand face in drawing direction (side −1 of wallBody, where the axis
 * lies for „Achslage Außen“); a flipped wall turns the order around.
 */
const id = z.string().trim().min(1);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/** Built-in fill patterns of cut materials (drawn in paper size, docs/WANDAUFBAU.md, SA2). */
export const MATERIAL_PATTERNS = ["none", "diagonal", "cross", "insulation", "dots"] as const;
export type MaterialPattern = (typeof MATERIAL_PATTERNS)[number];
export const MATERIAL_PATTERN_LABELS: Record<MaterialPattern, string> = {
  none: "Keine",
  diagonal: "Schräg (Mauerwerk)",
  cross: "Kreuz (Beton)",
  insulation: "Dämmung",
  dots: "Punkte (Putz, Mörtel)",
};

export const materialSchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(80),
    color,
    pattern: z.enum(MATERIAL_PATTERNS),
  })
  .strict();
export type Material = z.infer<typeof materialSchema>;

export const MIN_LAYER_THICKNESS = 0.001;
export const assemblyLayerSchema = z
  .object({
    materialId: id,
    thickness: z.number().finite().min(MIN_LAYER_THICKNESS).max(5),
    /** Load-bearing core (Tragschicht); informational, written to IFC. */
    core: z.boolean().optional(),
  })
  .strict();
export type AssemblyLayer = z.infer<typeof assemblyLayerSchema>;

export const wallAssemblySchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(80),
    layers: z.array(assemblyLayerSchema).min(1).max(20),
  })
  .strict();
export type WallAssembly = z.infer<typeof wallAssemblySchema>;

export const materialsSchema = z.array(materialSchema).max(500);
export const wallAssembliesSchema = z.array(wallAssemblySchema).max(500);

/** Thickness of an assembly, rounded to 0.1 mm against float sums. */
export function assemblyThickness(assembly: Pick<WallAssembly, "layers">): number {
  return Math.round(assembly.layers.reduce((sum, l) => sum + l.thickness, 0) * 10000) / 10000;
}

const material = (id: string, name: string, color: string, pattern: MaterialPattern) => ({
  id: `material-${id}`,
  name,
  color,
  pattern,
});
/** Materials a project starts with. */
export const DEFAULT_MATERIALS: readonly Material[] = [
  material("putz", "Putz", "#e7e2d8", "dots"),
  material("kalksandstein", "Kalksandstein", "#d9d9d9", "diagonal"),
  material("ziegel", "Mauerziegel", "#e8c7b3", "diagonal"),
  material("porenbeton", "Porenbeton", "#ece9e0", "dots"),
  material("stahlbeton", "Stahlbeton", "#c9ced4", "cross"),
  material("daemmung", "Wärmedämmung", "#f6eaa8", "insulation"),
  material("klinker", "Klinker", "#d9a48c", "diagonal"),
  material("luft", "Luftschicht", "#ffffff", "none"),
  material("gipskarton", "Gipskarton", "#f2f2ef", "none"),
  material("holz", "Holz", "#e5cfa5", "none"),
];

const layer = (materialId: string, thickness: number, core?: boolean): AssemblyLayer => ({
  materialId: `material-${materialId}`,
  thickness,
  ...(core ? { core } : {}),
});
const assembly = (id: string, name: string, layers: AssemblyLayer[]): WallAssembly => ({
  id: `assembly-${id}`,
  name,
  layers,
});
/** Assemblies a project starts with (outside → inside). */
export const DEFAULT_WALL_ASSEMBLIES: readonly WallAssembly[] = [
  assembly("ks175-wdvs160", "KS 17,5 + WDVS 16", [
    layer("putz", 0.01),
    layer("daemmung", 0.16),
    layer("kalksandstein", 0.175, true),
    layer("putz", 0.015),
  ]),
  assembly("mw365", "Mauerwerk 36,5 + Putz", [
    layer("putz", 0.02),
    layer("ziegel", 0.365, true),
    layer("putz", 0.015),
  ]),
  assembly("pb365", "Porenbeton 36,5 + Putz", [
    layer("putz", 0.02),
    layer("porenbeton", 0.365, true),
    layer("putz", 0.015),
  ]),
  assembly("stb25-wdvs200", "Stahlbeton 25 + WDVS 20", [
    layer("putz", 0.01),
    layer("daemmung", 0.2),
    layer("stahlbeton", 0.25, true),
    layer("putz", 0.015),
  ]),
  assembly("zweischalig", "Zweischalig Klinker + KS 17,5", [
    layer("klinker", 0.115),
    layer("luft", 0.04),
    layer("daemmung", 0.12),
    layer("kalksandstein", 0.175, true),
    layer("putz", 0.015),
  ]),
  assembly("ks240-innen", "KS 24 innen, beidseitig Putz", [
    layer("putz", 0.015),
    layer("kalksandstein", 0.24, true),
    layer("putz", 0.015),
  ]),
  assembly("ks115-innen", "KS 11,5 innen, beidseitig Putz", [
    layer("putz", 0.015),
    layer("kalksandstein", 0.115, true),
    layer("putz", 0.015),
  ]),
  assembly("stb20-innen", "Stahlbeton 20 innen", [layer("stahlbeton", 0.2, true)]),
  assembly("tb100", "Trockenbau 10", [
    layer("gipskarton", 0.0125),
    layer("daemmung", 0.075, true),
    layer("gipskarton", 0.0125),
  ]),
  assembly("tb125", "Trockenbau 12,5, doppelt beplankt", [
    layer("gipskarton", 0.025),
    layer("daemmung", 0.075, true),
    layer("gipskarton", 0.025),
  ]),
];

/** The project's materials; a project that never edited its library uses the defaults. */
export function projectMaterials(project: { materials?: readonly Material[] | undefined }) {
  return project.materials ?? DEFAULT_MATERIALS;
}
export function projectWallAssemblies(project: {
  wallAssemblies?: readonly WallAssembly[] | undefined;
}) {
  return project.wallAssemblies ?? DEFAULT_WALL_ASSEMBLIES;
}

/**
 * Library rules: unique ids and names, layers name existing materials. Returns the first problem
 * as readable German text, or null.
 */
export function assemblyLibraryProblem(
  materials: readonly Material[],
  assemblies: readonly WallAssembly[],
): string | null {
  const materialIds = new Set<string>();
  for (const m of materials) {
    if (materialIds.has(m.id)) return `Material ${m.name}: doppelte ID.`;
    materialIds.add(m.id);
  }
  const names = new Set<string>();
  const ids = new Set<string>();
  for (const a of assemblies) {
    if (ids.has(a.id)) return `Wandaufbau ${a.name}: doppelte ID.`;
    if (names.has(a.name)) return `Wandaufbau ${a.name}: Name schon vergeben.`;
    ids.add(a.id);
    names.add(a.name);
    for (const l of a.layers)
      if (!materialIds.has(l.materialId))
        return `Wandaufbau ${a.name}: unbekanntes Material ${l.materialId}.`;
  }
  return null;
}

/** Layers of a wall from its right face (side −1) to its left face (side +1). */
export function wallLayers(
  wall: { assemblyId?: string | undefined; assemblyFlipped?: boolean | undefined },
  assemblies: readonly WallAssembly[],
): AssemblyLayer[] | null {
  const found = wall.assemblyId ? assemblies.find((a) => a.id === wall.assemblyId) : undefined;
  if (!found) return null;
  return wall.assemblyFlipped ? [...found.layers].reverse() : [...found.layers];
}
