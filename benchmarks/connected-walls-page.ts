import { fullSelectionMove } from "./selection-move-oracle";
import { connectedFixture } from "./connected-fixture";
import {
  connectedWallContours,
  connectedWallSolids,
} from "../src/domain/elements/wall/connections";
import { wallContourSolid } from "../src/domain/elements/wall/contour-solid";
import { prepareTranslation } from "../src/domain/project/prepared-translation";
import { tick } from "./capacity";
const button = document.querySelector<HTMLButtonElement>("#run")!,
  output = document.querySelector<HTMLPreElement>("#report")!;
const stats = (values: number[]) => {
  const a = [...values].sort((a, b) => a - b);
  return { median: (a[4]! + a[5]!) / 2, p95: a[9], values };
};
button.onclick = async () => {
  button.disabled = true;
  try {
    const results = [];
    for (const kind of ["chain", "tees"] as const)
      for (const count of [25, 100]) {
        output.textContent = `${kind} ${count}`;
        await tick();
        const p = connectedFixture(kind, count);
        let t = performance.now();
        const prepared = prepareTranslation(p, ["wall-0"]);
        const prepareMs = performance.now() - t,
          affected = prepared.evaluate({ x: 0, y: 0 }).geometry.storey.walls.length;
        const contours: number[] = [],
          solids: number[] = [],
          extrusions: number[] = [],
          filters: number[] = [],
          pointer: number[] = [];
        for (let i = 0; i < 10; i++) {
          const fresh = { storey: p.storey };
          t = performance.now();
          const rings = connectedWallContours(fresh);
          contours.push(performance.now() - t);
          t = performance.now();
          const all = connectedWallSolids(fresh);
          solids.push(performance.now() - t);
          t = performance.now();
          const derived = p.storey.walls
            .filter((w) => rings.has(w.id))
            .map((w) =>
              wallContourSolid(
                w,
                rings.get(w.id)!,
                p.storey.windows,
                p.storey.wallTJunctions.some(
                  (j) => j.hostWallId === w.id || j.incoming.wallId === w.id,
                ),
              ),
            );
          extrusions.push(performance.now() - t);
          if (JSON.stringify(all) !== JSON.stringify(derived))
            throw Error("Solid derivation mismatch");
          t = performance.now();
          let total = 0;
          for (let r = 0; r < 100; r++)
            for (const w of p.storey.walls)
              total += p.storey.windows.filter((o) => o.wallId === w.id).length;
          filters.push((performance.now() - t) / 100);
          if (total !== 100 * p.storey.windows.length) throw Error("Window assignment mismatch");
        }
        for (let i = 0; i < 10; i++) {
          const delta = { x: -2 - i * 0.1, y: -2 };
          t = performance.now();
          const patch = prepared.evaluate(delta);
          pointer.push(performance.now() - t);
          const full = fullSelectionMove(p, [{ kind: "wall", id: "wall-0" }], delta);
          for (const name of ["walls", "windows", "wallJoins", "wallTJunctions"] as const)
            if (JSON.stringify(patch.geometry.storey[name]) !== JSON.stringify(full.storey[name]))
              throw Error("Prepared move mismatch: " + name);
        }
        results.push({
          kind,
          count,
          windows: p.storey.windows.length,
          selectedWalls: 1,
          affectedWalls: affected,
          prepareMs,
          contours: stats(contours),
          solidsIncludingContours: stats(solids),
          extrusionsWithExistingContours: stats(extrusions),
          windowFilters: stats(filters),
          preparedPointer: stats(pointer),
          verified: true,
        });
      }
    output.textContent = JSON.stringify(
      {
        scope:
          "Cold wrapper identity per sample. Solids includes contours; separate extrusion is not additive to solids. Window-filter microbenchmark repeats 100 times, not production instrumentation. Ten samples, no DOM/frame timing.",
        userAgent: navigator.userAgent,
        results,
      },
      null,
      2,
    );
  } catch (e) {
    output.textContent = String(e);
  } finally {
    button.disabled = false;
  }
};
