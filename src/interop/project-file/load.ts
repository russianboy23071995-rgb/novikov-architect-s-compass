import { defaultHatchAppearance } from "../../domain/elements/hatch/model.ts";
import {
  validateLegacyProject,
  validateProject,
  validateProjectV2,
  validateProjectV3,
  validateProjectV4,
  validateProjectV5,
  validateProjectV6,
  validateProjectV7,
} from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
import { createStandardLayers } from "../../domain/layers/model.ts";

/** Migration is only a file-boundary operation; runtime snapshots stay schema 8. */
export function loadProjectData(value: unknown): Project {
  if (typeof value !== "object" || value === null || !("schemaVersion" in value))
    throw new Error("Missing project version");
  if (value.schemaVersion === 8) return validateProject(value);
  if (value.schemaVersion === 7) {
    const old = validateProjectV7(value);
    return validateProject({
      ...old,
      schemaVersion: 8,
      storey: { ...old.storey, wallTJunctions: [] },
    });
  }
  if (value.schemaVersion === 6) {
    const old = validateProjectV6(value);
    return loadProjectData({
      ...old,
      schemaVersion: 7,
      storey: {
        ...old.storey,
        hatches: old.storey.hatches.map((h) => ({ ...h, ...defaultHatchAppearance })),
      },
    });
  }
  if (value.schemaVersion === 5) {
    const old = validateProjectV5(value);
    return loadProjectData({ ...old, schemaVersion: 6, storey: { ...old.storey, wallJoins: [] } });
  }
  if (value.schemaVersion === 4) {
    const old = validateProjectV4(value);
    return loadProjectData({
      ...old,
      schemaVersion: 5,
      storey: { ...old.storey, walls: old.storey.walls.map((w) => ({ ...w, bodyOffset: 0 })) },
    });
  }
  if (value.schemaVersion === 3) {
    const old = validateProjectV3(value);
    return loadProjectData({ ...old, schemaVersion: 4, storey: { ...old.storey, hatches: [] } });
  }
  if (value.schemaVersion === 2)
    return loadProjectData({
      ...validateProjectV2(value),
      schemaVersion: 3,
      bimVisibility: { hiddenLayerIds: [] },
    });
  if (value.schemaVersion !== 1) throw new Error("Unsupported project version");
  const old = validateLegacyProject(value);
  const defaults = createStandardLayers([
    old.id,
    old.storey.id,
    ...old.storey.walls.map((e) => e.id),
    ...old.storey.windows.map((e) => e.id),
    ...(old.storey.lines ?? []).map((e) => e.id),
  ]);
  return loadProjectData({
    ...old,
    schemaVersion: 3,
    bimVisibility: { hiddenLayerIds: [] },
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
