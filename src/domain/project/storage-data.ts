import type { Project } from "./schema.ts";

/** Portable model omits the disposable numeric height of bound walls. Shared by file/recovery. */
export function projectStorageData(project: Project) {
  return {
    ...project,
    storeys: project.storeys.map((s) => ({
      ...s,
      walls: s.walls.map((w) => {
        if (!w.topBinding) return w;
        const { height: _derived, ...stored } = w;
        return stored;
      }),
    })),
  };
}
export type StoredProject = ReturnType<typeof projectStorageData>;
