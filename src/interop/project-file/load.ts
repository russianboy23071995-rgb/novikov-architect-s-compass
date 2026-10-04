import { validateLegacyProject, validateProject } from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
import { createStandardLayers } from "../../domain/layers/model.ts";

/** Migration is only a file-boundary operation; runtime snapshots stay schema 2. */
export function loadProjectData(value: unknown): Project {
  if (typeof value !== "object" || value === null || !("schemaVersion" in value))
    throw new Error("Missing project version");
  if (value.schemaVersion === 2) return validateProject(value);
  if (value.schemaVersion !== 1) throw new Error("Unsupported project version");
  const old = validateLegacyProject(value);
  const defaults = createStandardLayers([
    old.id,
    old.storey.id,
    ...old.storey.walls.map((e) => e.id),
    ...old.storey.windows.map((e) => e.id),
    ...(old.storey.lines ?? []).map((e) => e.id),
  ]);
  return validateProject({
    ...old,
    schemaVersion: 2,
    ...defaults,
    storey: {
      ...old.storey,
      walls: old.storey.walls.map((w) => ({ ...w, layerId: defaults.defaultLayerIds.wall })),
      windows: old.storey.windows.map((w) => ({ ...w, layerId: defaults.defaultLayerIds.window })),
      ...(old.storey.lines === undefined
        ? {}
        : {
            lines: old.storey.lines.map((l) => ({ ...l, layerId: defaults.defaultLayerIds.line })),
          }),
    },
  });
}

export function deserializeProject(json: string): Project {
  return loadProjectData(JSON.parse(json));
}
