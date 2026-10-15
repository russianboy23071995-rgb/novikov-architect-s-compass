import { performance } from "node:perf_hooks";
import { translationFixture } from "./translation-content-fixture.ts";
import { prepareSelectionTranslation } from "../src/application/selection/storey-translation.ts";
import { prepareZTranslation } from "../src/application/selection/z-translation.ts";

if (process.argv[1]?.endsWith("translation-content-profile.ts")) {
  for (const count of [1, 2, 5])
    for (const bytes of [0, 32 * 1024 * 1024]) {
      const p = translationFixture(count, bytes);
      const ids = count === 1 ? ["w0"] : ["w0", `w${count - 1}`];
      const targets = ids.map((id) => ({ kind: "wall" as const, id }));
      for (const kind of ["XY", "Z"]) {
        const runs = [];
        for (let i = 0; i < 6; i++) {
          const start = performance.now();
          const action =
            kind === "XY" ? prepareSelectionTranslation(p, ids) : prepareZTranslation(p, targets);
          const prepared = performance.now();
          for (let n = 0; n < 30; n++) {
            if (kind === "XY")
              (action as ReturnType<typeof prepareSelectionTranslation>).evaluate({
                x: n / 100,
                y: 0,
              });
            else (action as ReturnType<typeof prepareZTranslation>).evaluate(p, targets, n / 100);
          }
          const pointed = performance.now();
          if (kind === "XY")
            (action as ReturnType<typeof prepareSelectionTranslation>).materialize(p, {
              x: 0.3,
              y: 0,
            });
          else (action as ReturnType<typeof prepareZTranslation>).materialize(p, targets, 0.3);
          runs.push({
            prepare: prepared - start,
            pointer: (pointed - prepared) / 30,
            commit: performance.now() - pointed,
          });
        }
        console.log(JSON.stringify({ count, bytes, kind, cold: runs[0], warm: runs.slice(1) }));
      }
    }
}
