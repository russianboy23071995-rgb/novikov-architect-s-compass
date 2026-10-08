import { prepareTranslation } from "../src/domain/project/prepared-translation";
import { connectedFixture } from "./connected-fixture";
import { fullSelectionMove } from "./selection-move-oracle";
import { capacityFixture, tick } from "./capacity";
import { prepareChainMove } from "./prepared-chain-move";
import { validateProject } from "../src/lib/bim/model";
import { commitProject, createHistory, undoProject, redoProject } from "../src/lib/bim/history";
const button = document.querySelector<HTMLButtonElement>("#run")!,
  output = document.querySelector<HTMLPreElement>("#report")!;
button.onclick = async () => {
  button.disabled = true;
  try {
    const results = [];
    for (const count of [25, 100]) {
      output.textContent = `${count} Elemente`;
      await tick();
      const p = connectedFixture("chain", count),
        id = "wall-0",
        baseline = prepareTranslation(p, [id]);
      let t = performance.now();
      const pilot = prepareChainMove(p, id),
        prepareMs = performance.now() - t;
      const fullTimes = [],
        localTimes = [];
      for (let i = 0; i < 30; i++) {
        const point = { x: -2 - i * 0.05, y: -2 };
        let full, local;
        if (i % 2) {
          t = performance.now();
          full = baseline.evaluate(point);
          fullTimes.push(performance.now() - t);
          t = performance.now();
          local = pilot.evaluate(point);
          localTimes.push(performance.now() - t);
        } else {
          t = performance.now();
          local = pilot.evaluate(point);
          localTimes.push(performance.now() - t);
          t = performance.now();
          full = baseline.evaluate(point);
          fullTimes.push(performance.now() - t);
        }
        if (
          local.path !== "local" ||
          JSON.stringify(full.geometry.storey.walls) !==
            JSON.stringify(local.project.storey.walls) ||
          JSON.stringify(validateProject(local.project)) !==
            JSON.stringify(fullSelectionMove(p, [{ kind: "wall", id }], point))
        )
          throw Error("Preview mismatch");
      }
      const h = createHistory(p);
      t = performance.now();
      const confirmed = commitProject(h, pilot.confirm({ x: -3, y: -2 }));
      const confirmMs = performance.now() - t;
      if (
        confirmed.past.length !== 1 ||
        JSON.stringify(undoProject(confirmed).present) !== JSON.stringify(p) ||
        JSON.stringify(redoProject(undoProject(confirmed))) !== JSON.stringify(confirmed)
      )
        throw Error("History mismatch");
      const stats = (v: number[]) => {
        const a = [...v].sort((a, b) => a - b);
        return { median: (a[14]! + a[15]!) / 2, p95: a[28] };
      };
      results.push({
        count,
        prepareMs,

        full: stats(fullTimes),
        local: stats(localTimes),
        confirmMs,
        equivalent: true,
        fullTimes,
        localTimes,
      });
    }
    output.textContent = JSON.stringify(
      {
        userAgent: navigator.userAgent,
        scope: "Isolated API pilot, alternating order, no UI integration or render timings",
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
