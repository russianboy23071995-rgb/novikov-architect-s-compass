import type { Project } from "./schema.ts";

/** One storey as stored: bound walls omit their disposable numeric height. */
export function storeyStorageData(storey: Project["storeys"][number]) {
  return {
    ...storey,
    walls: storey.walls.map((w) => {
      if (!w.topBinding) return w;
      const { height: _derived, ...stored } = w;
      return stored;
    }),
  };
}

/** Portable model omits the disposable numeric height of bound walls. Shared by file/recovery. */
export function projectStorageData(project: Project) {
  return { ...project, storeys: project.storeys.map(storeyStorageData) };
}
export type StoredProject = ReturnType<typeof projectStorageData>;
