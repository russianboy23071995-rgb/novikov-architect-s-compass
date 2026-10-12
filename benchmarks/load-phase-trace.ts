export type Phase = { name: string; start: number; ms: number };
export const phases: Phase[] = [];
export function trace<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    phases.push({ name, start, ms: performance.now() - start });
  }
}
