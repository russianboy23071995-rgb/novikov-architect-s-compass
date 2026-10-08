import { capacityFixture, tick } from "./capacity";
import {
  beginWallChain,
  appendWallChain,
  finishWallChain,
  previewWallChain,
} from "../src/application/drawing/wall-chain";
import { drawingInteraction } from "../src/application/tools/adapters";
import { createShiftSnapLock } from "../src/application/tools/shift-lock";
import { createToolSourceQuery } from "../src/application/tools/snapping";
import { getLocalSnapSources } from "../src/application/snapping/local-sources";
import { createHistory, commitProject, undoProject, redoProject } from "../src/lib/bim/history";
const button = document.querySelector<HTMLButtonElement>("#run")!;
const output = document.querySelector<HTMLPreElement>("#report")!;
const stats = (v: number[]) => {
  const a = [...v].sort((a, b) => a - b);
  return { median: (a[9]! + a[10]!) / 2, p95: a[18] };
};
button.onclick = async () => {
  button.disabled = true;
  try {
    const results = [];
    for (const count of [100, 1000])
      for (const segments of [0, 1])
        for (const shift of [false, true]) {
          output.textContent = `${count} elements, ${segments} placed segments, Shift ${shift}`;
          await tick();
          const history = createHistory(capacityFixture(count)),
            base = history.present;
          let t = performance.now();
          let chain = beginWallChain(base, { x: -20, y: -20 });
          if (segments) chain = appendWallChain(chain, base, "placed", { x: -20, y: -16 });
          const beginMs = performance.now() - t,
            origin = chain.points.at(-1)!;
          t = performance.now();
          const tool = drawingInteraction(
            base,
            base,
            origin,
            () => {},
            () => {},
            chain.points,
            chain,
          );
          const query = createToolSourceQuery(getLocalSnapSources(chain.preview), tool.snapping);
          const prepareSnapMs = performance.now() - t;
          const lock = createShiftSnapLock(),
            context = {
              enabled: true,
              pixelsPerMetre: 100,
              endpointRadiusPx: 8,
              gridSpacing: null,
              references: [],
              sourceQuery: query,
              activeReferences: [tool.snapping.origin],
            };
          const options = { ortho: false, shift, featureSnap: true };
          lock.resolve(tool.snapping, { x: origin.x + 2, y: origin.y }, context, options);
          const snapTimes: number[] = [],
            previewTimes: number[] = [],
            validationTimes: number[] = [];
          let last = origin,
            preview = base;
          for (let i = 0; i < 20; i++) {
            t = performance.now();
            const snap = lock.resolve(
              tool.snapping,
              { x: origin.x + 2 + i * 0.05, y: origin.y + (shift ? 0.5 : 0) },
              context,
              options,
            );
            snapTimes.push(performance.now() - t);
            last = snap.point;
            if (shift && Math.abs(last.y - origin.y) > 1e-8) throw Error("Shift changed angle");
            t = performance.now();
            preview = previewWallChain(chain, base, last, snap.candidate);
            previewTimes.push(performance.now() - t);
            t = performance.now();
            tool.validate(last, snap.candidate);
            validationTimes.push(performance.now() - t);
            const placed = appendWallChain(chain, base, "@wall-preview", last, snap.candidate);
            if (JSON.stringify(placed.preview) !== JSON.stringify(preview))
              throw Error("Preview differs from placement");
          }
          t = performance.now();
          const finalChain = appendWallChain(chain, base, "@wall-preview", last);
          const committed = commitProject(history, finishWallChain(finalChain, base));
          const confirmMs = performance.now() - t;
          if (
            committed.past.length !== 1 ||
            JSON.stringify(committed.present) !== JSON.stringify(preview) ||
            JSON.stringify(undoProject(committed).present) !== JSON.stringify(base) ||
            JSON.stringify(redoProject(undoProject(committed)).present) !== JSON.stringify(preview)
          )
            throw Error("History mismatch");
          results.push({
            count,
            segments,
            shift,
            beginMs,
            prepareSnapMs,
            snap: stats(snapTimes),
            preview: stats(previewTimes),
            validation: stats(validationTimes),
            confirmMs,
            verified: true,
            snapTimes,
            previewTimes,
            validationTimes,
          });
        }
    output.textContent = JSON.stringify(
      {
        scope:
          "Application and shared snap APIs; 20 targets per case. Validation and preview measured separately, not asserted as frame total. No DOM/render/frame timing. Disjoint T groups, all layers visible, no images. New wall away from existing geometry; second segment creates a corner.",
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
