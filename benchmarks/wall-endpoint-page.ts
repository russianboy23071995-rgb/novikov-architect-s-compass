import { capacityFixture, tick } from "./capacity";
import {
  createEditingState,
  editingReducer,
  previewEdit,
} from "../src/application/direct-edit/controller";
import { editInteraction } from "../src/application/tools/adapters";
import { createShiftSnapLock } from "../src/application/tools/shift-lock";
import { createToolSourceQuery } from "../src/application/tools/snapping";
import { getLocalSnapSources } from "../src/application/snapping/local-sources";
import { validateProject } from "../src/lib/bim/model";
const button = document.querySelector<HTMLButtonElement>("#run")!,
  output = document.querySelector<HTMLPreElement>("#report")!;
button.onclick = async () => {
  button.disabled = true;
  try {
    const results = [];
    for (const count of [100, 1000])
      for (const connected of [false, true])
        for (const shift of [false, true]) {
          output.textContent = `${count} / ${connected ? "T-Hauptwand" : "freie Wand"} / Shift ${shift}`;
          await tick();
          const p = capacityFixture(count);
          if (!connected) p.storey.wallTJunctions = [];
          const wall = p.storey.walls[0]!,
            target = { kind: "wall" as const, id: wall.id };
          let state = createEditingState(p),
            t = performance.now();
          state = editingReducer(state, {
            type: "begin",
            target,
            action: "point",
            index: 1,
            anchor: wall.end,
          });
          const beginMs = performance.now() - t;
          if (state.error || !state.session) throw Error(state.error || "Missing session");
          const session = state.session,
            base = state.history.present;
          t = performance.now();
          const tool = editInteraction(
              session,
              base,
              target,
              () => {},
              () => {},
            ),
            query = createToolSourceQuery(getLocalSnapSources(base), tool.snapping);
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
          // Acquire horizontal direction, then move cursor away while Shift is held.
          lock.resolve(tool.snapping, { x: wall.end.x + 1, y: wall.end.y }, context, options);
          const snapTimes = [],
            previewTimes = [];
          let last: ReturnType<typeof lock.resolve> | null = null,
            lastPreview = base;
          for (let i = 0; i < 20; i++) {
            t = performance.now();
            last = lock.resolve(
              tool.snapping,
              { x: wall.end.x + 1 + i * 0.05, y: wall.end.y + (shift ? 0.5 : 0) },
              context,
              options,
            );
            snapTimes.push(performance.now() - t);
            if (shift && Math.abs(last.point.y - wall.end.y) > 1e-8)
              throw Error("Shift angle changed");
            t = performance.now();
            lastPreview = previewEdit(session, base, target, last.point, last.candidate);
            previewTimes.push(performance.now() - t);
          }
          validateProject(lastPreview);
          t = performance.now();
          const confirmed = editingReducer(state, {
            type: "confirm",
            session,
            selection: target,
            point: last!.point,
            candidate: last!.candidate,
          });
          const confirmMs = performance.now() - t;
          if (
            confirmed.error ||
            confirmed.history.past.length !== 1 ||
            JSON.stringify(confirmed.history.present) !== JSON.stringify(lastPreview)
          )
            throw Error(confirmed.error || "Confirmation mismatch");
          const undone = editingReducer(confirmed, { type: "undo" }),
            redone = editingReducer(undone, { type: "redo" });
          if (
            JSON.stringify(undone.history.present) !== JSON.stringify(base) ||
            JSON.stringify(redone.history.present) !== JSON.stringify(lastPreview)
          )
            throw Error("Undo mismatch");
          lock.release();
          const stats = (v: number[]) => {
            const a = [...v].sort((a, b) => a - b);
            return { median: (a[9]! + a[10]!) / 2, p95: a[18] };
          };
          results.push({
            count,
            connected,
            shift,
            beginMs,
            prepareSnapMs,
            snap: stats(snapTimes),
            preview: stats(previewTimes),
            confirmMs,
            tConnectionsBefore: base.storey.wallTJunctions.length,
            tConnectionsAfter: lastPreview.storey.wallTJunctions.length,
            verified: true,
            snapTimes,
            previewTimes,
          });
        }
    output.textContent = JSON.stringify(
      {
        userAgent: navigator.userAgent,
        scope:
          "Shared application and snap APIs, 20 targets per case. No DOM pointer dispatch, renderer or frame latency measurement. All layers visible, no images.",
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
