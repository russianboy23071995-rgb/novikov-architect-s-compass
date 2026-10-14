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
      storey: Omit<Project["storeys"][number], "id" | "name" | "height">;
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
