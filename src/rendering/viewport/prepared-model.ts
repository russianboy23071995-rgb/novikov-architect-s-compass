import type { Project } from "../../domain/project/schema.ts";
import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";

/** Stable read-only basis, shared by rendering and query adapters. No camera/filter state.
 * The viewport owns its lifetime and replaces it on committed project identity changes.
 * In-place edits to the original input do not change this captured basis; confirmation
 * remains responsible for validating the authoritative project.
 */
export type PreparedViewportModel = Readonly<{ model: Project }>;
const sources = new WeakMap<PreparedViewportModel, Project>();
export function prepareViewportModel(source: Project): PreparedViewportModel {
  const prepared = Object.freeze({ model: createProjectSnapshot(source) });
  sources.set(prepared, source);
  return prepared;
}
export function viewportModel(source: Project, prepared?: PreparedViewportModel): Project {
  if (!prepared) return createProjectSnapshot(source);
  if (sources.get(prepared) !== source)
    throw new Error("Der vorbereitete 3D-Modellkontext ist veraltet.");
  return prepared.model;
}
