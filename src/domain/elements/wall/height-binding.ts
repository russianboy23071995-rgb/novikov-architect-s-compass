import { z } from "zod";
import { resolveStoreyLevels } from "../../storeys/heights.ts";
import { resolveWallHeightRule } from "./heights.ts";

export const wallTopBindingSchema = z
  .object({
    kind: z.literal("slab-underside"),
    storeyId: z.string().trim().min(1),
    slabThickness: z.number().finite().positive(),
    topOffset: z.number().finite(),
  })
  .strict();
export type WallTopBinding = z.infer<typeof wallTopBindingSchema>;

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
  const levels = new Map(
    resolveStoreyLevels(project.storeys, project.groundStoreyId).map((level) => [
      level.storeyId,
      level.elevation,
    ]),
  );
  return {
    ...project,
    storeys: project.storeys.map((storey, index) => ({
      ...storey,
      walls: storey.walls.map((wall) => {
        const binding = wall.topBinding;
        if (!binding) return wall;
        if (project.storeys[index + 1]?.id !== binding.storeyId)
          throw new Error(
            "Der Rohdeckenbezug muss das unmittelbar darüberliegende Geschoss sein. Bindung zuerst ändern.",
          );
        const bottom = levels.get(storey.id),
          top = levels.get(binding.storeyId);
        if (bottom == null || top == null)
          throw new Error("Der Rohdeckenbezug ist nicht aufgelöst.");
        const resolved = resolveWallHeightRule(
          wall,
          bottom,
          { kind: "slab-underside", topOffset: binding.topOffset },
          { topElevation: top, thickness: binding.slabThickness },
        );
        return { ...wall, height: resolved.height };
      }),
    })),
  };
}
