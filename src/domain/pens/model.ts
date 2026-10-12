import { z } from "zod";
const id = z.string().min(1).max(128);
export const penSchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(80),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  })
  .strict();
export const penSetSchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(80),
    pens: z.array(penSchema).max(256),
    inventory: z.array(id).max(10),
  })
  .strict()
  .superRefine((set, ctx) => {
    const ids = new Set(set.pens.map((p) => p.id));
    if (
      ids.size !== set.pens.length ||
      new Set(set.inventory).size !== set.inventory.length ||
      set.inventory.some((id) => !ids.has(id))
    )
      ctx.addIssue({
        code: "custom",
        message: "Stift-IDs und Inventar müssen eindeutig und vorhanden sein.",
      });
  });
export type PenSet = z.infer<typeof penSetSchema>;
export const defaultPenSet: PenSet = {
  id: "novikov-standard",
  name: "NOVIKOV Standard",
  pens: [
    { id: "graphite", name: "Graphit", color: "#334155" },
    { id: "black", name: "Schwarz", color: "#000000" },
    { id: "white", name: "Weiß", color: "#ffffff" },
    { id: "turquoise", name: "Türkis", color: "#40c4c4" },
    { id: "red", name: "Rot", color: "#dc2626" },
    { id: "blue", name: "Blau", color: "#2563eb" },
  ],
  inventory: ["graphite", "black", "white", "turquoise", "red", "blue"],
};
export const penLibrarySchema = z
  .object({ version: z.literal(1), sets: z.array(penSetSchema).min(1).max(64) })
  .strict()
  .refine((v) => new Set(v.sets.map((s) => s.id)).size === v.sets.length, "Doppelte Stifteset-ID");
export type PenLibrary = z.infer<typeof penLibrarySchema>;
