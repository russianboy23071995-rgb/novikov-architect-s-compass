import type { Project, Wall } from "../../domain/project/schema.ts";
import {
  assemblyLibraryProblem,
  assemblyThickness,
  projectMaterials,
  projectWallAssemblies,
  type Material,
  type WallAssembly,
} from "../../domain/elements/wall/assembly.ts";
import { offsetAtThickness } from "../../domain/elements/wall/axis-position.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";

/** The wall at a new thickness; the axis keeps its relative place (outside, centre, inside). */
function atThickness(wall: Wall, thickness: number): Wall {
  return Math.abs(thickness - wall.thickness) < 1e-9
    ? wall
    : { ...wall, thickness, bodyOffset: offsetAtThickness(wall, thickness) };
}

function mapWalls(project: Project, change: (wall: Wall) => Wall): Project["storeys"] {
  return project.storeys.map((storey) => {
    let changed = false;
    const walls = storey.walls.map((w) => {
      const next = change(w);
      if (next !== w) changed = true;
      return next;
    });
    return changed ? { ...storey, walls } : storey;
  });
}

/**
 * Gives the walls a build-up (docs/WANDAUFBAU.md, SA1): their thickness becomes the sum of the
 * layers. null removes it; the thickness stays. One checked change, one undo step.
 */
export function setWallAssembly(
  project: Project,
  wallIds: readonly string[],
  assemblyId: string | null,
): Project {
  if (!wallIds.length) throw new Error("Bitte mindestens eine Wand auswählen.");
  const assembly =
    assemblyId === null ? null : projectWallAssemblies(project).find((a) => a.id === assemblyId);
  if (assembly === undefined) throw new Error("Unbekannter Wandaufbau.");
  const ids = new Set(wallIds);
  let found = 0;
  const storeys = mapWalls(project, (wall) => {
    if (!ids.has(wall.id)) return wall;
    found++;
    if (!assembly) {
      const { assemblyId: _a, assemblyFlipped: _f, ...rest } = wall;
      return rest;
    }
    return { ...atThickness(wall, assemblyThickness(assembly)), assemblyId: assembly.id };
  });
  if (found !== ids.size) throw new Error("Unbekannte Wand in der Auswahl.");
  return validateLike(project, { ...project, storeys });
}

/** Turns the layer order of the walls around (outside ↔ inside); walls keep their place. */
export function flipWallAssembly(project: Project, wallIds: readonly string[]): Project {
  const ids = new Set(wallIds);
  let found = 0;
  const storeys = mapWalls(project, (wall) => {
    if (!ids.has(wall.id)) return wall;
    if (!wall.assemblyId) throw new Error("Die Wand hat keinen Wandaufbau.");
    found++;
    const { assemblyFlipped, ...rest } = wall;
    return assemblyFlipped ? rest : { ...rest, assemblyFlipped: true };
  });
  if (!found || found !== ids.size) throw new Error("Unbekannte Wand in der Auswahl.");
  return validateLike(project, { ...project, storeys });
}

/** How many walls of the project use each assembly. */
export function assemblyUsage(project: Project): Map<string, number> {
  const usage = new Map<string, number>();
  for (const wall of project.storeys.flatMap((s) => s.walls))
    if (wall.assemblyId) usage.set(wall.assemblyId, (usage.get(wall.assemblyId) ?? 0) + 1);
  return usage;
}

/**
 * Stores the edited library. Every wall using a changed assembly takes its new thickness; an
 * assembly in use or a material used by an assembly cannot be removed. One undo step.
 */
export function saveAssemblyLibrary(
  project: Project,
  library: { materials: readonly Material[]; wallAssemblies: readonly WallAssembly[] },
): Project {
  const problem = assemblyLibraryProblem(library.materials, library.wallAssemblies);
  if (problem) throw new Error(problem);
  const byId = new Map(library.wallAssemblies.map((a) => [a.id, a]));
  for (const [id, count] of assemblyUsage(project))
    if (!byId.has(id)) {
      const name = projectWallAssemblies(project).find((a) => a.id === id)?.name ?? id;
      throw new Error(
        `Wandaufbau ${name} wird von ${count} ${count === 1 ? "Wand" : "Wänden"} verwendet.`,
      );
    }
  const storeys = mapWalls(project, (wall) =>
    wall.assemblyId ? atThickness(wall, assemblyThickness(byId.get(wall.assemblyId)!)) : wall,
  );
  return validateLike(project, {
    ...project,
    materials: library.materials.map((m) => ({ ...m })),
    wallAssemblies: library.wallAssemblies.map((a) => ({
      ...a,
      layers: a.layers.map((l) => ({ ...l })),
    })),
    storeys,
  });
}

/** The library as stored or, untouched, the defaults (for editing). */
export function assemblyLibrary(project: Project) {
  return {
    materials: [...projectMaterials(project)],
    wallAssemblies: [...projectWallAssemblies(project)],
  };
}
