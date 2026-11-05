import { workspacePhases, profileReducer } from "./workspace-load-trace";
// Phases of every recovery read and save, for the browser console (diagnostic builds only).
(globalThis as { recoveryPhases?: object[] }).recoveryPhases = workspacePhases;
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
/** Full recovery checks by caller, with start time and duration (diagnostic builds only). */
export const recoveryChecks: {
  caller: string;
  start: number;
  ms: number;
  ok: boolean;
  stack?: string | undefined;
}[] = [];
(globalThis as { recoveryChecks?: typeof recoveryChecks }).recoveryChecks = recoveryChecks;
export async function recoveryCheck<T>(caller: string, action: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const stack = new Error().stack;
  let ok = false;
  try {
    const result = await action();
    ok = true;
    return result;
  } finally {
    recoveryChecks.push({ caller, start, ms: performance.now() - start, ok, stack });
  }
}
/** Autosave lease decisions next to the checks (diagnostic builds only). */
export function recoveryEvent(caller: string, detail: string) {
  recoveryChecks.push({ caller, start: performance.now(), ms: 0, ok: true, stack: detail });
}
