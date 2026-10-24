import { z } from "zod";

const id = z.string().trim().min(1);
export const layerSchema = z.object({ id, name: z.string().trim().min(1) }).strict();
export const defaultLayerIdsSchema = z.object({ wall: id, window: id, line: id }).strict();
export type Layer = z.infer<typeof layerSchema>;

const standards = [
  ["exterior-wall", "Außenwand"],
  ["interior-wall", "Innenwand"],
  ["roof", "Dach"],
  ["slab", "Decke"],
  ["window", "Fenster"],
  ["door", "Tür"],
  ["furniture", "Möblierung"],
  ["railing", "Geländer"],
  ["terrain", "Gelände"],
  ["drawing", "2D-Zeichnungen"],
  ["neutral", "Neutrale Ebene"],
  ["dimension", "Bemaßung"],
  ["room", "Raum"],
  ["text", "Textelemente"],
] as const;

/** Reserved stable namespace, including deterministic collision suffixes from migration. */
export function isStandardLayerId(id: string): boolean {
  return standards.some(
    ([key]) =>
      id === `layer:${key}` ||
      (id.startsWith(`layer:${key}:`) && /^[1-9]\d*$/.test(id.slice(`layer:${key}:`.length))),
  );
}

/** The reserved standard layer of one key (stable ID namespace, never the editable name). */
export function standardLayerId(
  layers: readonly Layer[],
  key: (typeof standards)[number][0],
): string | undefined {
  return layers.find(
    (l) =>
      l.id === `layer:${key}` ||
      (l.id.startsWith(`layer:${key}:`) && /^[1-9]d*$/.test(l.id.slice(`layer:${key}:`.length))),
  )?.id;
}

/** Shared by new projects and migration. Never infer defaults from editable names. */
export function createStandardLayers(occupiedIds: Iterable<string>) {
  const occupied = new Set(occupiedIds);
  const byKey = new Map<string, string>();
  const layers: Layer[] = standards.map(([key, name]) => {
    const base = `layer:${key}`;
    let candidate = base,
      suffix = 1;
    while (occupied.has(candidate)) candidate = `${base}:${suffix++}`;
    occupied.add(candidate);
    byKey.set(key, candidate);
    return { id: candidate, name };
  });
  return {
    layers,
    defaultLayerIds: {
      wall: byKey.get("exterior-wall")!,
      window: byKey.get("window")!,
      line: byKey.get("drawing")!,
    },
  };
}
