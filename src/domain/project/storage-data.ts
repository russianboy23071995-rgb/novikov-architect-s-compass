import type { Project } from "./schema.ts";

/** One storey as stored: bound walls omit their disposable numeric height. */
export function storeyStorageData(storey: Project["storeys"][number]) {
  return {
    ...storey,
    walls: storey.walls.map((w) => {
      // The roof trim plane is derived on every validation (L04b) and never stored.
      const { trimPlane: _plane, ...wall } = w;
      if (!wall.topBinding) return wall;
      const { height: _derived, ...stored } = wall;
      return stored;
    }),
  };
}

/** Portable model omits the disposable numeric height of bound walls. Shared by file/recovery. */
export function projectStorageData(project: Project) {
  return { ...project, storeys: project.storeys.map(storeyStorageData) };
}
export type StoredProject = ReturnType<typeof projectStorageData>;
