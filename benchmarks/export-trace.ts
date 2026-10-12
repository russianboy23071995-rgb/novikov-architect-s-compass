export const exportPhases: { phase: string; start: number; duration: number }[] = [];
export function measureExport<T>(phase: string, action: () => T): T {
  const start = performance.now();
  try {
    return action();
  } finally {
    exportPhases.push({ phase, start, duration: performance.now() - start });
  }
}
