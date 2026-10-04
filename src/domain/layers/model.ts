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
