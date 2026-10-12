import { capacityFixture, tick } from "./capacity";
import { prepareEndpoint } from "./prepared-endpoint";
import { updateWall, validateProject } from "../src/lib/bim/model";
import { commitProject, createHistory, undoProject, redoProject } from "../src/lib/bim/history";
const button = document.querySelector<HTMLButtonElement>("#run")!,
  output = document.querySelector<HTMLPreElement>("#report")!;
button.onclick = async () => {
  button.disabled = true;
  try {
    const results = [];
    for (const count of [100, 1000]) {
      output.textContent = `${count} Elemente`;
      await tick();
      const p = capacityFixture(count),
        id = p.storey.walls[0]!.id;
      let t = performance.now();
      const pilot = prepareEndpoint(p, id),
        prepareMs = performance.now() - t;
      const fullTimes = [],
        localTimes = [];
      for (let i = 0; i < 30; i++) {
        const point = { x: 7 + i * 0.05, y: 0 };
        let full, local;
        if (i % 2) {
          t = performance.now();
          full = updateWall(p, id, { end: point });
          fullTimes.push(performance.now() - t);
          t = performance.now();
          local = pilot.evaluate(point);
          localTimes.push(performance.now() - t);
        } else {
          t = performance.now();
          local = pilot.evaluate(point);
          localTimes.push(performance.now() - t);
          t = performance.now();
          full = updateWall(p, id, { end: point });
          fullTimes.push(performance.now() - t);
        }
        if (
          local.path !== "local" ||
          JSON.stringify(full) !== JSON.stringify(local.project) ||
          JSON.stringify(validateProject(local.project)) !== JSON.stringify(full)
        )
          throw Error("Preview mismatch");
      }
      const h = createHistory(p);
      t = performance.now();
      const confirmed = commitProject(h, pilot.confirm({ x: 9, y: 0 }));
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
        affectedWalls: pilot.affectedWalls,
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
