import type { Project } from "./schema.ts";

/** Disposable calculation scope, deliberately not a persistable Project. */
export type WallGeometry = {
  storey: Pick<Project["storey"], "walls" | "windows" | "wallJoins" | "wallTJunctions">;
};
export type ModelGeometry = {
  storey: Omit<Project["storey"], "id">;
  assets: Project["assets"];
};
export type GeometryPreview = {
  geometry: ModelGeometry;
  replacedIds: readonly string[];
};
