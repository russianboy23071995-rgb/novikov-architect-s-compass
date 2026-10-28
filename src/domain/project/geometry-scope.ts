import type { Project } from "./schema.ts";

/** Disposable calculation scope, deliberately not a persistable Project. */
export type WallGeometry =
  | Project
  | {
      storey: Pick<
        Project["storeys"][number],
        "walls" | "windows" | "wallJoins" | "wallTJunctions"
      >;
    };
export type ModelGeometry =
  | Project
  | {
      // The height is optional here: ceiling slabs need it for their level (docs/SLAB_ELEMENT.md).
      storey: Omit<Project["storeys"][number], "id" | "name" | "height"> & {
        height?: number | null;
      };
      assets: Project["assets"];
    };
export type GeometryPreview = {
  storeyPatches?: readonly {
    storeyId: string;
    geometry: ModelGeometry;
    replacedIds: readonly string[];
  }[];
  geometry: ModelGeometry;
  replacedIds: readonly string[];
};
