import { diagnosticRenderer } from "./legacy-solid-renderer";
import { buildSolid } from "../src/lib/bim/geometry";
import { connectedFixture } from "./connected-fixture";
import { createProjectionFrame } from "../src/geometry/projections/orthographic";
import { createProjectionState } from "../src/rendering/viewport/projection-state";
import {
  pickSolidElement,
  windowSelectionSurfaces,
} from "../src/rendering/viewport/window-selection";
import { startMovementSample, finishMovementSample } from "./movement-trace";
import type { DisplaySurfaces } from "../src/rendering/viewport/layer-display";
import type { ProjectionState } from "../src/rendering/viewport/projection-state";
const makeRenderer = diagnosticRenderer as (canvas: HTMLCanvasElement) => {
  draw(
    solid: DisplaySurfaces,
    projection: ProjectionState,
    selected: Set<string>,
    edges: [],
    windows: [],
  ): void;
  dispose(): void;
};
const button = document.querySelector<HTMLButtonElement>("#run")!,
  output = document.querySelector<HTMLPreElement>("#report")!,
  views = document.querySelector<HTMLDivElement>("#views")!;
const tick = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const stats = (v: number[]) => {
  const a = [...v].sort((a, b) => a - b);
  return { median: (a[4]! + a[5]!) / 2, max: a[9], samples: v };
};
button.onclick = async () => {
  button.disabled = true;
  const results = [];
  try {
    for (const count of [25, 100, 500]) {
      output.textContent = `Vorbereitung ${count} Waende`;
      await tick();
      const project = connectedFixture("chain", count),
        before = JSON.stringify(project);
      let t = performance.now();
      const solid = buildSolid(project),
        buildMs = performance.now() - t;
      const originalSolid = JSON.stringify(solid),
        ids = new Set(project.storey.walls.map((w) => w.id));
      if (solid.faces.some((f) => !ids.has(f.wallId))) throw Error("Unknown geometry ID");
      const windows = windowSelectionSurfaces(project, () => true),
        frame = createProjectionFrame(solid);
      let checks = 0;
      for (const viewCount of [1, 2, 4]) {
        views.replaceChildren();
        const canvases = Array.from({ length: viewCount }, () => {
          const c = document.createElement("canvas");
          views.append(c);
          return c;
        });
        const renderers = canvases.map(makeRenderer),
          draws: number[] = [],
          packs: number[] = [],
          buffers: number[] = [],
          picks: number[] = [],
          calls: number[] = [],
          projected: number[] = [];
        try {
          for (let i = -2; i < 10; i++) {
            await tick();
            const projections = canvases.map((_, j) =>
              createProjectionState(
                frame,
                { yaw: 0.4 + i * 0.04 + j * 0.3, pitch: 0.6, zoom: 1, panX: 0, panY: 0 },
                { left: 0, top: 0, width: 400, height: 300 },
                { width: 400, height: 300 },
              )!,
            );
            startMovementSample();
            t = performance.now();
            renderers.forEach((r, j) => r.draw(solid, projections[j]!, new Set(), [], []));
            const drawMs = performance.now() - t,
              sample = finishMovementSample();
            let projectCalls = 0;
            t = performance.now();
            const hits = projections.map((pr) =>
              pickSolidElement(
                solid,
                windows,
                (p) => {
                  projectCalls++;
                  return pr.project(p);
                },
                0,
                0,
              ),
            );
            const pickMs = performance.now() - t;
            // Compare to the same projection from an independent solid derivation outside timing.
            if (i === 0) {
              const again = buildSolid(project);
              if (JSON.stringify(again) !== originalSolid) throw Error("Solid changed");
              projections.forEach((pr, j) => {
                const reference = pickSolidElement(again, windows, pr.project, 0, 0);
                if (JSON.stringify(reference) !== JSON.stringify(hits[j]))
                  throw Error("Picking mismatch");
                checks++;
              });
            }
            if (i >= 0) {
              draws.push(drawMs);
              packs.push(sample.phases["solid-projection-pack"]?.ms ?? 0);
              buffers.push(sample.phases["solid-buffer-submit"]?.ms ?? 0);
              calls.push(sample.phases["solid-buffer-submit"]?.calls ?? 0);
              picks.push(pickMs);
              projected.push(projectCalls);
            }
          }
          results.push({
            count,
            viewCount,
            faces: solid.faces.length,
            windows: windows.length,
            buildMs,
            drawMs: stats(draws),
            projectionPackMs: stats(packs),
            bufferSubmitMs: stats(buffers),
            pickMs: stats(picks),
            bufferCalls: calls,
            pickProjectionCalls: projected,
            checks,
          });
        } finally {
          renderers.forEach((r) => r.dispose());
        }
      }
      if (JSON.stringify(project) !== before || JSON.stringify(solid) !== originalSolid)
        throw Error("Source mutated");
    }
    const table = document.createElement("table");
    table.style.cssText = "border-collapse:collapse;margin:16px 0";
    for (const values of [
      ["Waende", "Ansichten", "Draw ms", "Projektion ms", "Puffer ms", "Picking ms"],
      ...results.map((r) => [
        r.count,
        r.viewCount,
        r.drawMs.median.toFixed(2),
        r.projectionPackMs.median.toFixed(2),
        r.bufferSubmitMs.median.toFixed(2),
        r.pickMs.median.toFixed(2),
      ]),
    ]) {
      const row = table.insertRow();
      for (const value of values) {
        const cell = row.insertCell();
        cell.textContent = String(value);
        cell.style.cssText = "padding:6px 16px;border-bottom:1px solid #ccd";
      }
    }
    document.querySelector("#summary")!.replaceChildren(table);
    output.textContent = JSON.stringify(
      {
        status: "PASS",
        scope: "CPU submission, not GPU completion or React frame latency",
        userAgent: navigator.userAgent,
        dpr: devicePixelRatio,
        viewport: [400, 300],
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
