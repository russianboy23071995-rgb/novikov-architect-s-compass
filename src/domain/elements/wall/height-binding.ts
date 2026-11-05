import { z } from "zod";
import { resolveStoreyLevels } from "../../storeys/heights.ts";
import { resolveWallHeightRule } from "./heights.ts";

/** Storey binding (user decision 29.10.2026): the wall top follows OK raw floor of the storey
 * above its own storey (own elevation + own storey height), plus an extra height such as a
 * parapet. Slabs are no input; only the own storey height is read (A08).
 */
export const wallTopBindingSchema = z
  .object({ kind: z.literal("storey"), topOffset: z.number().finite() })
  .strict();
export type WallTopBinding = z.infer<typeof wallTopBindingSchema>;

/** Schema 26–29: underside of an assumed raw slab of the storey directly above. */
export const legacyWallTopBindingSchema = z
  .object({
    kind: z.literal("slab-underside"),
    storeyId: z.string().trim().min(1),
    slabThickness: z.number().finite().positive(),
    topOffset: z.number().finite(),
  })
  .strict();
type LegacyWallTopBinding = z.infer<typeof legacyWallTopBindingSchema>;

/** Schema 29 → 30: the assumed slab thickness becomes part of the extra height, so every
 * migrated wall keeps its top: (upper − thickness) + offset = upper + (offset − thickness).
 * The bound numeric height is dropped and resolved again by validation.
 */
export function withStoreyBindings<
  T extends {
    storeys: {
      id: string;
      walls: { height: number; topBinding?: LegacyWallTopBinding | undefined }[];
    }[];
  },
>(project: T) {
  return {
    ...project,
    storeys: project.storeys.map((storey, index) => ({
      ...storey,
      walls: storey.walls.map(({ topBinding: binding, ...wall }) => {
        if (!binding) return wall;
        if (project.storeys[index + 1]?.id !== binding.storeyId)
          throw new Error(
            "Der Rohdeckenbezug muss das unmittelbar darüberliegende Geschoss sein. Bindung zuerst ändern.",
          );
        const { height: _derived, ...stored } = wall;
        return {
          ...stored,
          topBinding: {
            kind: "storey" as const,
            topOffset: binding.topOffset - binding.slabThickness,
          },
        };
      }),
    })),
  };
}

/** Resolve once at the model boundary; rendering and prepared geometry read numeric height.
 * The numeric height of a bound wall is disposable, never an independent editable input.
 */
export function resolveBoundWallHeights<
  T extends {
    groundStoreyId: string;
    storeys: {
      id: string;
      height: number | null;
      walls: {
        height: number;
        baseOffset?: number | undefined;
        topBinding?: WallTopBinding | undefined;
      }[];
    }[];
  },
>(project: T): T {
  const levels = resolveStoreyLevels(project.storeys, project.groundStoreyId);
  return {
    ...project,
    storeys: project.storeys.map((storey, index) => ({
      ...storey,
      walls: storey.walls.map((wall) => {
        const binding = wall.topBinding;
        if (!binding) return wall;
        const { elevation, upperElevation } = levels[index]!;
        if (elevation == null || upperElevation == null)
          throw new Error("Für die Geschossbindung zuerst die Geschosshöhe festlegen.");
        return {
          ...wall,
          height: resolveWallHeightRule(wall, elevation, binding, upperElevation).height,
        };
      }),
    })),
  };
}
