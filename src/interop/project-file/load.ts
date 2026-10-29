import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
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
  projectV20Schema,
  projectV21Schema,
  projectV22Schema,
  projectV23Schema,
  projectV24Schema,
  projectV25Schema,
  projectV26Schema,
  projectV27Schema,
  projectV28Schema,
  projectV29Schema,
} from "../../domain/project/schema.ts";
import { withOpeningMarks } from "../../domain/elements/wall/opening-marks.ts";
import { withStoreyBindings } from "../../domain/elements/wall/height-binding.ts";
import type { Project } from "../../domain/project/schema.ts";
import { createStandardLayers } from "../../domain/layers/model.ts";

/** Own and fully storage-validate incoming assets once, before versioned project validation.
 * File inputs acquire handles here; recovery supplies its independently checked handles.
 * Handles are identity capabilities, never caller-supplied IDs or flags.
 */
export function loadProjectData(value: unknown): Project {
  if (
    typeof value === "object" &&
    value !== null &&
    "schemaVersion" in value &&
    typeof value.schemaVersion === "number" &&
    value.schemaVersion >= 9 &&
    value.schemaVersion <= PROJECT_SCHEMA_VERSION &&
    "assets" in value &&
    Array.isArray(value.assets)
  ) {
    value = { ...value, assets: value.assets.map(createImageAssetHandle) };
  }
  return migrateProjectData(value);
}

/** Parsing resolves a bound wall height to a placeholder 0; a chained step parses again, so the
 * disposable height is dropped as in stored files (gap found 29.10.2026 for schema 26/27).
 */
function withoutBoundHeights<
  T extends { storeys: { walls: { height: number; topBinding?: unknown }[] }[] },
>(project: T) {
  return {
    ...project,
    storeys: project.storeys.map((s) => ({
      ...s,
      walls: s.walls.map(({ height, ...w }) => (w.topBinding ? w : { ...w, height })),
    })),
  };
}

/** Fully validating version migration for file/recovery boundaries; runtime edits stay schema 30. */
export function migrateProjectData(value: unknown): Project {
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
    const old = projectV20Schema.parse(value);
    return migrateProjectData({
      ...old,
      schemaVersion: 21,
      storey: { ...old.storey, name: "Level 01" },
    });
  }
  if (value.schemaVersion === 21) {
    const old = projectV21Schema.parse(value);
    return migrateProjectData({
      ...old,
      schemaVersion: 22,
      storey: { ...old.storey, height: null },
    });
  }
  if (value.schemaVersion === 22)
    return migrateProjectData({
      ...projectV22Schema.parse(value),
      schemaVersion: 23,
      groundDatum: 0,
    });
  if (value.schemaVersion === 23) {
    const { storey, ...old } = projectV23Schema.parse(value);
    return migrateProjectData({
      ...old,
      schemaVersion: 24,
      groundStoreyId: storey.id,
      storeys: [storey],
    });
  }
  if (value.schemaVersion === 24) {
    const old = projectV24Schema.parse(value);
    return migrateProjectData({ ...old, schemaVersion: 25, storeys: old.storeys });
  }
  if (value.schemaVersion === 25)
    return migrateProjectData({ ...projectV25Schema.parse(value), schemaVersion: 26 });
  if (value.schemaVersion === 26)
    return migrateProjectData(
      withoutBoundHeights({ ...projectV26Schema.parse(value), schemaVersion: 27 }),
    );
  // Existing windows and doors receive position numbers in stored order (user decision 25.10.2026).
  if (value.schemaVersion === 27)
    return migrateProjectData(
      withoutBoundHeights(
        withOpeningMarks({ ...projectV27Schema.parse(value), schemaVersion: 28 }),
      ),
    );
  // Schema 28 files carry no slabs; the strict v28 schema rejects smuggled slab lists.
  if (value.schemaVersion === 28)
    return migrateProjectData(
      withoutBoundHeights({ ...projectV28Schema.parse(value), schemaVersion: 29 }),
    );
  // Walls bound to an assumed raw slab keep their top as storey binding (29.10.2026).
  if (value.schemaVersion === 29)
    return validateProject(
      withStoreyBindings({ ...projectV29Schema.parse(value), schemaVersion: 30 }),
    );
  if (value.schemaVersion === PROJECT_SCHEMA_VERSION) return validateProject(value);
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
