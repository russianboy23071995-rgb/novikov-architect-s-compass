import { createImageAssetHandle } from "../../domain/elements/reference/model.ts";
import { assertProjectFileSize } from "./size.ts";
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
  validateProjectV8,
  validateProjectV9,
  validateProjectV10,
  validateProjectV11,
  validateProjectV12,
  validateProjectV13,
  validateProjectV14,
  validateProjectV15,
  validateProjectV16,
  validateProjectV17,
  validateProjectV18,
  projectV19Schema,
} from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
import { createStandardLayers } from "../../domain/layers/model.ts";

/** Own and fully storage-validate incoming assets once, before versioned project validation.
 * Migration remains private so every public entry crosses this boundary.
 * Handles are identity capabilities, never caller-supplied IDs or flags.
 */
export function loadProjectData(value: unknown): Project {
  if (
    typeof value === "object" &&
    value !== null &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion >= 9 &&
    value.schemaVersion <= 20 &&
    "assets" in value &&
    Array.isArray(value.assets)
  ) {
    value = { ...value, assets: value.assets.map(createImageAssetHandle) };
  }
  return migrateProjectData(value);
}

/** Migration is only a file-boundary operation; runtime snapshots stay schema 20. */
function migrateProjectData(value: unknown): Project {
  if (typeof value !== "object" || value === null || !("schemaVersion" in value))
    throw new Error("Missing project version");
  if (value.schemaVersion === 10) {
    const old = validateProjectV10(value);
    return migrateProjectData({ ...old, schemaVersion: 11, hatchPatterns: [] });
  }
  if (value.schemaVersion === 9) {
    const old = validateProjectV9(value);
    return migrateProjectData({ ...old, schemaVersion: 10 });
  }
  if (value.schemaVersion === 11)
    return migrateProjectData({ ...validateProjectV11(value), schemaVersion: 12 });
  if (value.schemaVersion === 12)
    return migrateProjectData({ ...validateProjectV12(value), schemaVersion: 13 });
  if (value.schemaVersion === 13)
    return migrateProjectData({ ...validateProjectV13(value), schemaVersion: 14 });
  if (value.schemaVersion === 14)
    return migrateProjectData({ ...validateProjectV14(value), schemaVersion: 15 });
  if (value.schemaVersion === 15)
    return migrateProjectData({ ...validateProjectV15(value), schemaVersion: 16 });
  if (value.schemaVersion === 16)
    return migrateProjectData({ ...validateProjectV16(value), schemaVersion: 17 });
  if (value.schemaVersion === 17)
    return migrateProjectData({ ...validateProjectV17(value), schemaVersion: 18 });
  if (value.schemaVersion === 18)
    return migrateProjectData({ ...validateProjectV18(value), schemaVersion: 19 });
  if (value.schemaVersion === 19) {
    const old = projectV19Schema.parse(value);
    const documents = new Set((old.drawingDocuments ?? []).map((d) => d.id));
    const share = <T extends { documentId?: string | undefined }>(element: T) => {
      if (element.documentId && !documents.has(element.documentId))
        throw new Error("Unbekanntes Abbild für 2D-Zeichnung.");
      const { documentId: _owner, ...shared } = element;
      return shared;
    };
    return migrateProjectData({
      ...old,
      schemaVersion: 20,
      storey: {
        ...old.storey,
        ...(old.storey.lines ? { lines: old.storey.lines.map(share) } : {}),
        hatches: old.storey.hatches.map(share),
      },
    });
  }
  if (value.schemaVersion === 20) {
    return validateProject(value);
  }
  if (value.schemaVersion === 8) {
    const old = validateProjectV8(value);
    return migrateProjectData({
      ...old,
      schemaVersion: 11,
      hatchPatterns: [],
      assets: [],
      storey: { ...old.storey, references: [] },
    });
  }
  if (value.schemaVersion === 7) {
    const old = validateProjectV7(value);
    return migrateProjectData({
      ...old,
      schemaVersion: 8,
      storey: { ...old.storey, wallTJunctions: [] },
    });
  }
  if (value.schemaVersion === 6) {
    const old = validateProjectV6(value);
    return migrateProjectData({
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
    return migrateProjectData({
      ...old,
      schemaVersion: 6,
      storey: { ...old.storey, wallJoins: [] },
    });
  }
  if (value.schemaVersion === 4) {
    const old = validateProjectV4(value);
    return migrateProjectData({
      ...old,
      schemaVersion: 5,
      storey: { ...old.storey, walls: old.storey.walls.map((w) => ({ ...w, bodyOffset: 0 })) },
    });
  }
  if (value.schemaVersion === 3) {
    const old = validateProjectV3(value);
    return migrateProjectData({ ...old, schemaVersion: 4, storey: { ...old.storey, hatches: [] } });
  }
  if (value.schemaVersion === 2)
    return migrateProjectData({
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
  return migrateProjectData({
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
  assertProjectFileSize(json);
  return loadProjectData(JSON.parse(json));
}
