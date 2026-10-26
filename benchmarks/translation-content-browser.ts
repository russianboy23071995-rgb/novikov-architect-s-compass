import { translationFixture } from "./translation-content-fixture.ts";
import { prepareSelectionTranslation } from "../src/application/selection/storey-translation.ts";
import { prepareZTranslation } from "../src/application/selection/z-translation.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
} from "../src/application/history/project-history.ts";
import { sameProjectContent } from "../src/domain/project/model-equality.ts";
const output = document.querySelector("#result")!;
document.querySelector("#run")!.addEventListener("click", () => {
  try {
    const results = [];
    for (const count of [1, 2, 5]) {
      const h = createHistory(translationFixture(count, 32 * 1024 * 1024));
      const p = h.present,
        ids = count === 1 ? ["w0"] : ["w0", `w${count - 1}`];
      const targets = ids.map((id) => ({ kind: "wall" as const, id }));
      const runs = [];
      for (let i = 0; i < 6; i++) {
        const t = performance.now(),
          action = prepareSelectionTranslation(p, ids),
          ready = performance.now();
        for (let n = 0; n < 30; n++) action.evaluate({ x: n / 100, y: 0 });
        const pointed = performance.now(),
          next = action.materialize(p, { x: 0.3, y: 0 }),
          done = performance.now();
        const history = commitProject(h, next);
        if (
          history.past.length !== 1 ||
          !sameProjectContent(undoProject(history).present, p) ||
          !sameProjectContent(redoProject(undoProject(history)).present, next)
        )
          throw Error("History mismatch");
        const z = prepareZTranslation(p, targets);
        z.evaluate(p, targets, 0.3);
        z.materialize(p, targets, 0.3);
        runs.push({ prepare: ready - t, pointer: (pointed - ready) / 30, commit: done - pointed });
      }
      results.push({ count, cold: runs[0], warm: runs.slice(1) });
    }
    output.textContent = JSON.stringify(
      { status: "PASS", userAgent: navigator.userAgent, results },
      null,
      2,
    );
  } catch (error) {
    output.textContent = `FAIL: ${error}`;
  }
});
