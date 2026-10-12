import { buildWorldPicking } from "./world-picking.ts";
import { pickSolidElement } from "./window-selection.ts";
import type { WindowSelectionSurface } from "./window-selection.ts";
import type { DisplaySurfaces } from "./layer-display.ts";
import type { ProjectionState } from "./projection-state.ts";
export type PickingScheduler = { schedule: (run: () => void) => () => void; now: () => number };
const scheduler: PickingScheduler = {
  schedule(run) {
    const id = setTimeout(run, 0);
    return () => clearTimeout(id);
  },
  now: () => performance.now(),
};
/** Per stable display snapshot. Until complete (or on mismatch) use the full picker. */
export function createSolidPickingService(
  solid: DisplaySurfaces,
  windows: readonly WindowSelectionSurface[],
  clock: PickingScheduler = scheduler,
) {
  let builder: ReturnType<typeof buildWorldPicking> | null = buildWorldPicking(solid, windows),
    index: ReturnType<typeof import("./world-picking.ts").prepareWorldPicking> | null = null,
    disposed = false,
    cancel = () => {};
  let slices = 0,
    maxSliceMs = 0;
  const run = () => {
    if (disposed || !builder) return;
    const start = clock.now();
    slices++;
    try {
      do {
        for (let i = 0; i < 128; i++) {
          const step = builder.next();
          if (step.done) {
            index = step.value;
            builder = null;
            break;
          }
        }
      } while (builder && clock.now() - start < 4);
    } catch {
      builder = null;
      index = null;
    }
    maxSliceMs = Math.max(maxSliceMs, clock.now() - start);
    if (builder) cancel = clock.schedule(run);
  };
  cancel = clock.schedule(run);
  return {
    get diagnostics() {
      return { ready: !!index, slices, maxSliceMs };
    },
    pick(
      current: DisplaySurfaces,
      currentWindows: readonly WindowSelectionSurface[],
      projection: ProjectionState,
      x: number,
      y: number,
    ) {
      return !disposed && index && current === solid && currentWindows === windows
        ? index.query(current, currentWindows, projection, x, y).target
        : pickSolidElement(current, currentWindows, projection.project, x, y);
    },
    dispose() {
      disposed = true;
      cancel();
      builder = null;
      index = null;
    },
  };
}
