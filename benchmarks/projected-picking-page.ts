import { preparePicking } from "./projected-picking";
import { connectedFixture } from "./connected-fixture";
import { buildSolid } from "../src/lib/bim/geometry";
import { createProjectionFrame } from "../src/geometry/projections/orthographic";
import { createProjectionState } from "../src/rendering/viewport/projection-state";
import {
  pickSolidElement,
  windowSelectionSurfaces,
} from "../src/rendering/viewport/window-selection";
const run = document.querySelector<HTMLButtonElement>("#run")!,
  report = document.querySelector<HTMLPreElement>("#report")!;
const tick = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const stats = (v: number[]) => {
  const a = [...v].sort((a, b) => a - b);
  return { median: a[Math.floor(a.length / 2)], max: a.at(-1), samples: v };
};
run.onclick = async () => {
  run.disabled = true;
  const results = [];
  try {
    for (const count of [25, 100, 500]) {
      report.textContent = `Vergleich ${count} Waende`;
      await tick();
      const p = connectedFixture("chain", count),
        solid = buildSolid(p),
        windows = windowSelectionSurfaces(p, () => true),
        frame = createProjectionFrame(solid);
      for (const yaw of [0.4, 1.4]) {
        const projection = createProjectionState(
          frame,
          { yaw, pitch: 0.6, zoom: 1, panX: 0, panY: 0 },
          { left: 0, top: 0, width: 400, height: 300 },
          { width: 400, height: 300 },
        )!;
        let t = performance.now();
        const prepared = preparePicking(solid, windows, projection),
          prepareMs = performance.now() - t;
        const points = Array.from({ length: 30 }, (_, i) => {
          const w = windows[Math.floor((i * windows.length) / 30)]!,
            v = w.vertices.map(projection.project);
          return {
            x: v.reduce((s, p) => s + p[0], 0) / 4 + (i % 3 === 0 ? 0.02 : 0),
            y: v.reduce((s, p) => s + p[1], 0) / 4,
          };
        });
        const old: number[] = [],
          fast: number[] = [],
          tested: number[] = [];
        let hits = 0;
        for (const q of points) {
          await tick();
          t = performance.now();
          const baseline = pickSolidElement(solid, windows, projection.project, q.x, q.y);
          old.push(performance.now() - t);
          t = performance.now();
          const result = prepared.query(solid, windows, projection, q.x, q.y);
          fast.push(performance.now() - t);
          tested.push(result.tested);
          if (JSON.stringify(baseline) !== JSON.stringify(result.target))
            throw Error("Target mismatch");
          if (result.target) hits++;
        }
        results.push({
          count,
          yaw,
          prepareMs,
          triangles: prepared.triangleCount,
          fullScanMs: stats(old),
          pilotMs: stats(fast),
          tested: stats(tested),
          checks: points.length,
          hits,
        });
      }
    }
    const table = document.createElement("table");
    for (const values of [
      ["Waende", "Winkel", "Vorbereitung ms", "Vollscan ms", "Pilot ms", "Dreiecke geprueft"],
      ...results.map((r) => [
        r.count,
        r.yaw,
        r.prepareMs.toFixed(2),
        r.fullScanMs.median!.toFixed(2),
        r.pilotMs.median!.toFixed(2),
        r.tested.median,
      ]),
    ]) {
      const row = table.insertRow();
      for (const v of values) row.insertCell().textContent = String(v);
    }
    document.querySelector("#summary")!.replaceChildren(table);
    report.textContent = JSON.stringify(
      { status: "PASS", userAgent: navigator.userAgent, results },
      null,
      2,
    );
  } catch (e) {
    report.textContent = String(e);
  } finally {
    run.disabled = false;
  }
};
