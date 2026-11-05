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

/** Default storey height of a new project (user decision 29.10.2026). */
export const STANDARD_STOREY_HEIGHT = 3;

/**
 * Start structure of a new project: Erdgeschoss and 1. Obergeschoss, each 3,00 m high, so
 * every storey has a known height and slabs appear in 3D from the start.
 */
export function createStandardProject(
  projectId: string,
  groundStoreyId: string,
  upperStoreyId: string,
): Project {
  const base = createProject(projectId, groundStoreyId);
  const ground = {
    ...base.storeys[0]!,
    name: "Erdgeschoss",
    height: STANDARD_STOREY_HEIGHT,
  };
  const upper = {
    ...ground,
    id: upperStoreyId,
    name: "1. Obergeschoss",
  };
  return validateProject({ ...base, storeys: [ground, upper] });
}
