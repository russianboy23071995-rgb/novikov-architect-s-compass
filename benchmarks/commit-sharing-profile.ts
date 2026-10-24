import { schoolFixture, schoolElementCount } from "./school-fixture.ts";
import { operations, paths, type OperationName } from "./commit-sharing.ts";
import type { ProjectHistory } from "../src/lib/bim/history.ts";

const stats = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)]!;
  return { median: +at(0.5).toFixed(2), p95: +at(0.95).toFixed(2), n: values.length };
};

/** Same base history per sample; legacy/current order alternates. The action that produces the
 * input (itself a full validation) is timed separately and is identical for both paths.
 */
export async function profileCommitSharing(options: {
  sizes: number[];
  samples: (size: number) => number;
  now: () => number;
  pause?: () => Promise<void>;
  progress?: (text: string) => void;
}) {
  const results = [];
  for (const size of options.sizes) {
    const base = schoolFixture(size);
    const histories = {
      legacy: paths.legacy.create(base),
      current: paths.current.create(base),
    } satisfies Record<keyof typeof paths, ProjectHistory>;
    for (const op of ["wallReshape", "windowPlace"] as OperationName[]) {
      const times = { action: [] as number[], legacy: [] as number[], current: [] as number[] };
      let equivalent = true;
      const count = options.samples(size);
      for (let i = -1; i < count; i++) {
        options.progress?.(`${size} ${op} ${i + 1}/${count}`);
        await options.pause?.();
        const order: (keyof typeof paths)[] = i % 2 ? ["legacy", "current"] : ["current", "legacy"];
        const out: Partial<Record<keyof typeof paths, string>> = {};
        for (const path of order) {
          let t = options.now();
          const input = operations[op](histories[path].present, i + 2);
          const action = options.now() - t;
          t = options.now();
          const next = paths[path].commit(histories[path], input);
          const commit = options.now() - t;
          if (i >= 0) {
            times[path].push(commit);
            if (path === "current") times.action.push(action);
          }
          out[path] = JSON.stringify(next.present) + next.past.length;
        }
        equivalent &&= out.legacy === out.current;
      }
      results.push({
        size,
        elements: schoolElementCount(base),
        storeys: base.storeys.length,
        operation: op,
        equivalent,
        actionMs: stats(times.action),
        legacyCommitMs: stats(times.legacy),
        currentCommitMs: stats(times.current),
      });
    }
  }
  return results;
}
