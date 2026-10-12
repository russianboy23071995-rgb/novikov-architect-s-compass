import type { ProfilerOnRenderCallback } from "react";
export const workspacePhases: object[] = [];
export const profileWorkspace: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) => {
  workspacePhases.push({
    kind: "react-render",
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  });
};
export function profileReducer<T>(event: string, action: () => T): T {
  const start = performance.now();
  try {
    return action();
  } finally {
    workspacePhases.push({
      kind: "application",
      event,
      start,
      duration: performance.now() - start,
    });
  }
}
