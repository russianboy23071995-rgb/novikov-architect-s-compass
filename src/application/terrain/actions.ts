import { standardLayerId } from "../../domain/layers/model.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import {
  TERRAIN_DEFAULTS,
  type Terrain,
  type TerrainPoint,
} from "../../domain/elements/terrain/model.ts";

type TerrainCreation = Pick<Terrain, "id" | "outline"> & Partial<Omit<Terrain, "id" | "outline">>;

/** Values of the tool and the element window; `height` is that of the next points. */
export type TerrainDefaults = {
  height: number;
  depth: number;
  color: string;
  contourStep: number;
  layerId: string;
};
export function terrainToolDefaults(layerId: string): TerrainDefaults {
  return { height: 0, ...TERRAIN_DEFAULTS, layerId };
}
export function terrainSettings(terrain: Terrain): TerrainDefaults {
  return {
    height: 0,
    depth: terrain.depth,
    color: terrain.color ?? TERRAIN_DEFAULTS.color,
    contourStep: terrain.contourStep ?? TERRAIN_DEFAULTS.contourStep,
    layerId: terrain.layerId,
  };
}

/** The standard Gelände layer (docs/GELAENDE.md). */
export function defaultTerrainLayerId(project: Project): string {
  const id = standardLayerId(project.layers, "terrain");
  if (!id) throw new Error("Die Standardebene Gelände fehlt.");
  return id;
}

const groundStorey = (project: Project) => {
  const storey = project.storeys.find((s) => s.id === project.groundStoreyId);
  if (!storey) throw new Error("Das Erdgeschoss fehlt.");
  return storey;
};

/** The terrain of the project, held by its ground storey; there is at most one. */
export function projectTerrain(project: Project): Terrain | null {
  return groundStorey(project).terrains?.[0] ?? null;
}

function withTerrains(project: Project, terrains: Terrain[]): Project {
  const storey = groundStorey(project);
  return validateLike(project, {
    ...project,
    storeys: project.storeys.map((s) => (s === storey ? { ...s, terrains } : s)),
  });
}

/** The one terrain of a project; a second one is refused. */
export function addTerrain(project: Project, terrain: TerrainCreation): Project {
  if (projectTerrain(project)) throw new Error("Das Projekt hat schon ein Gelände.");
  return withTerrains(project, [
    {
      depth: TERRAIN_DEFAULTS.depth,
      points: [],
      ...terrain,
      layerId: terrain.layerId ?? defaultTerrainLayerId(project),
    },
  ]);
}

/** The tool adds a height point; outside the outline the model refuses it. */
export function addTerrainPoint(project: Project, point: TerrainPoint): Project {
  const terrain = projectTerrain(project);
  if (!terrain) throw new Error("Das Projekt hat kein Gelände.");
  return updateTerrain(project, { points: [...terrain.points, point] });
}

/** One checked change of the terrain. */
export function updateTerrain(project: Project, changes: Partial<Omit<Terrain, "id">>): Project {
  const terrain = projectTerrain(project);
  if (!terrain) throw new Error("Das Projekt hat kein Gelände.");
  return withTerrains(project, [{ ...terrain, ...changes, id: terrain.id }]);
}
