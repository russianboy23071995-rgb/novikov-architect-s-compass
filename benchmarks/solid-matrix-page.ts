import { diagnosticRenderer } from "./legacy-solid-renderer";
import { createMatrixRenderer } from "./solid-matrix-renderer";
import { cameraMatrix, projectWithMatrix } from "./solid-matrix";
import { connectedFixture } from "./connected-fixture";
import { buildSolid } from "../src/lib/bim/geometry";
import { createProjectionFrame } from "../src/geometry/projections/orthographic";
import { createProjectionState } from "../src/rendering/viewport/projection-state";
import type { ProjectionState } from "../src/rendering/viewport/projection-state";
import type { DisplaySurfaces } from "../src/rendering/viewport/layer-display";
const baseline = diagnosticRenderer as (canvas: HTMLCanvasElement) => {
  draw(s: DisplaySurfaces, p: ProjectionState, selected: Set<string>, a: [], b: []): void;
  dispose(): void;
};
const run = document.querySelector<HTMLButtonElement>("#run")!,
  report = document.querySelector<HTMLPreElement>("#report")!,
  views = document.querySelector<HTMLDivElement>("#views")!;
const tick = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const stats = (v: number[]) => {
  const a = [...v].sort((a, b) => a - b);
  return { median: (a[4]! + a[5]!) / 2, max: a[9], samples: v };
};
const pixels = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!,
    data = new Uint8Array(canvas.width * canvas.height * 4);
  gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  if (gl.getError() !== gl.NO_ERROR) throw Error("WebGL error");
  return data;
};
run.onclick = async () => {
  run.disabled = true;
  const results = [];
  try {
    for (const count of [3, 100, 500]) {
      report.textContent = `Vergleich ${count} Waende`;
      await tick();
      const project = connectedFixture("chain", count),
        solid = buildSolid(project),
        before = JSON.stringify(solid),
        frame = createProjectionFrame(solid),
        origin = frame.center;
      for (const n of [1, 4]) {
        views.replaceChildren();
        const pairs = Array.from({ length: n }, () => {
          const a = document.createElement("canvas"),
            b = document.createElement("canvas");
          views.append(a, b);
          return { a, b };
        });
        let t = performance.now();
        const old = pairs.map((p) => baseline(p.a));
        const baselinePrepare = performance.now() - t;
        t = performance.now();
        const pilot = pairs.map((p) => createMatrixRenderer(p.b, solid, origin));
        const pilotPrepare = performance.now() - t;
        const oldMs: number[] = [],
          newMs: number[] = [];
        let maxNdcError = 0,
          maxPixelMismatch = 0,
          pixelChecks = 0;
        try {
          for (let i = -2; i < 10; i++) {
            await tick();
            const states = pairs.map((_, j) =>
              createProjectionState(
                frame,
                {
                  yaw: 0.4 + i * 0.09 + j * 0.3,
                  pitch: 0.3 + i * 0.05,
                  zoom: 1,
                  panX: 0.05,
                  panY: -0.03,
                },
                { left: 0, top: 0, width: 400, height: 300 },
                { width: i === 8 ? 800 : 400, height: i === 9 ? 600 : 300 },
              )!,
            );
            const drawOld = () =>
              old.forEach((r, j) => r.draw(solid, states[j]!, new Set(), [], []));
            const drawNew = () => pilot.forEach((r, j) => r.draw(states[j]!));
            // Alternate order; readback and correctness work are outside timing.
            let a = 0,
              b = 0;
            for (const phase of i % 2 === 0 ? [0, 1] : [1, 0]) {
              t = performance.now();
              if (phase === 0) drawOld();
              else drawNew();
              if (phase === 0) a = performance.now() - t;
              else b = performance.now() - t;
            }
            if (i >= 0) {
              oldMs.push(a);
              newMs.push(b);
            }
            for (let j = 0; j < n; j++) {
              const p = states[j]!,
                m = cameraMatrix(p.frame, p.camera, p.aspect, origin);
              for (const f of solid.faces)
                for (const v of f.vertices) {
                  const actual = projectWithMatrix(v, origin, m),
                    expected = p.project(v);
                  actual.forEach((x, k) => {
                    maxNdcError = Math.max(maxNdcError, Math.abs(x - expected[k]!));
                  });
                }
              if (maxNdcError > 2e-6) throw Error("Projection or depth mismatch");
              const left = pixels(pairs[j]!.a),
                right = pixels(pairs[j]!.b);
              let mismatched = 0,
                painted = 0;
              for (let k = 0; k < left.length; k += 4) {
                if (left[k + 3]) painted++;
                if ([0, 1, 2, 3].some((c) => Math.abs(left[k + c]! - right[k + c]!) > 8))
                  mismatched++;
              }
              if (!painted) throw Error("Empty reference image");
              maxPixelMismatch = Math.max(maxPixelMismatch, mismatched);
              pixelChecks++;
              if (mismatched > Math.max(16, (left.length / 4) * 0.001))
                throw Error(`Pixel mismatch ${mismatched}`);
            }
          }
          results.push({
            count,
            views: n,
            faces: solid.faces.length,
            baselinePrepare,
            pilotPrepare,
            baselineMs: stats(oldMs),
            pilotMs: stats(newMs),
            maxNdcError,
            maxPixelMismatch,
            pixelChecks,
          });
        } finally {
          old.forEach((r) => r.dispose());
          pilot.forEach((r) => r.dispose());
        }
      }
      if (JSON.stringify(solid) !== before) throw Error("Geometry/IDs mutated");
    }
    const table = document.createElement("table");
    for (const values of [
      ["Waende", "Ansichten", "Bisher ms", "Pilot ms", "Pixelabweichung max"],
      ...results.map((r) => [
        r.count,
        r.views,
        r.baselineMs.median.toFixed(2),
        r.pilotMs.median.toFixed(2),
        r.maxPixelMismatch,
      ]),
    ]) {
      const row = table.insertRow();
      for (const v of values) row.insertCell().textContent = String(v);
    }
    document.querySelector("#summary")!.replaceChildren(table);
    report.textContent = JSON.stringify(
      {
        status: "PASS",
        userAgent: navigator.userAgent,
        scope: "Camera only, no selection/visibility/model mutation; CPU submission not GPU/React",
        results,
      },
      null,
      2,
    );
  } catch (e) {
    report.textContent = String(e);
  } finally {
    run.disabled = false;
  }
};
