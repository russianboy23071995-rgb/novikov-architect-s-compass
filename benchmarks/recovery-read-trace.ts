import { workspacePhases, profileReducer } from "./workspace-load-trace";
export function recoveryMeasure(phase: string, duration: number) {
  workspacePhases.push({
    kind: "application",
    event: `recovery:${phase}`,
    start: performance.now() - duration,
    duration,
  });
}
export function recoverySync<T>(phase: string, action: () => T): T {
  return profileReducer(`recovery:${phase}`, action);
}
export async function recoveryAsync<T>(phase: string, action: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await action();
  } finally {
    recoveryMeasure(phase, performance.now() - start);
  }
}
