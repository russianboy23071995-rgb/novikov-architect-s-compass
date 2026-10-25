import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import { createStandardLayers } from "../../domain/layers/model.ts";

/** New empty project, moved unchanged from lib/bim/model.ts (25.10.2026). */
export function createProject(projectId: string, storeyId: string): Project {
  return validateProject({
    schemaVersion: PROJECT_SCHEMA_VERSION,
    groundStoreyId: storeyId,
    groundDatum: 0,
    hatchPatterns: [],
    assets: [],
    bimVisibility: { hiddenLayerIds: [] },
    ...createStandardLayers([projectId.trim(), storeyId.trim()]),
    unit: "m",
    id: projectId,
    storeys: [
      {
        id: storeyId,
        name: "Level 01",
        height: null,
        references: [],
        walls: [],
        windows: [],
        hatches: [],
        wallJoins: [],
        wallTJunctions: [],
      },
    ],
  });
}
