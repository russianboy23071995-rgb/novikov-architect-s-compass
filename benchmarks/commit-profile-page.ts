import { capacityFixture, sourceFile, tick } from "./capacity";
import { importImage } from "../src/interop/images/import";
import { validateProject, updateLine } from "../src/lib/bim/model";
import {
  createHistory,
  commitProject,
  HISTORY_LIMIT,
  type ProjectHistory,
} from "../src/lib/bim/history";
import { assertProjectFileSize } from "../src/interop/project-file/size";
import type { Project } from "../src/lib/bim/model";
// Diagnostic mirror of commitProject; checked against the public function on every sample.
function profile(history: ProjectHistory, project: Project) {
  const phases: Record<string, number> = {};
  const measure = <T>(key: string, fn: () => T): T => {
    const t = performance.now();
    const value = fn();
    phases[key] = performance.now() - t;
    return value;
  };
  const next = measure("nextValidation", () => validateProject(project));
  const nextJson = measure("nextSerialization", () => JSON.stringify(next));
  measure("nextSize", () => assertProjectFileSize(nextJson));
  const previous = measure("previousValidation", () => validateProject(history.present));
  const previousJson = measure("previousSerialization", () => JSON.stringify(previous));
  measure("previousSize", () => assertProjectFileSize(previousJson));
  const equal = measure("fullComparison", () => nextJson === previousJson);
  if (equal) return { history, phases };
  const { bimVisibility: _a, ...previousModel } = history.present;
  const { bimVisibility: _b, ...nextModel } = next;
  const a = measure("previousModelSerialization", () => JSON.stringify(previousModel));
  const b = measure("nextModelSerialization", () => JSON.stringify(nextModel));
  const modelEqual = measure("modelComparison", () => a === b);
  const result = measure("historyUpdate", () =>
    modelEqual
      ? { ...history, present: next }
      : {
          past: [...history.past, history.present].slice(-HISTORY_LIMIT),
          present: next,
          future: [],
        },
  );
  return { history: result, phases };
}
const button = document.querySelector<HTMLButtonElement>("#run")!,
  output = document.querySelector<HTMLPreElement>("#report")!;
button.onclick = async () => {
  button.disabled = true;
  try {
    output.textContent = "Bildimport …";
    const p = capacityFixture(1000);
    for (let i = 0; i < 3; i++) {
      const asset = await importImage(await sourceFile(i), `asset-${i}`);
      p.assets.push(asset);
      p.storey.references.push({
        id: `ref-${i}`,
        kind: "image-reference",
        assetId: asset.id,
        layerId: p.defaultLayerIds.line,
        origin: { x: i * 60, y: -20 },
        rotation: 0,
        metresPerPixel: 0.1,
      });
    }
    const results = [];
    for (const mode of ["model", "noop", "visibility"] as const) {
      let h = createHistory(p);
      const samples: Record<string, number>[] = [];
      for (let i = 0; i < 20; i++) {
        output.textContent = `${mode}: ${i + 1}/20`;
        await tick();
        const target =
          mode === "model"
            ? updateLine(h.present, "line-0", { color: i % 2 ? "#abcdef" : "#123456" })
            : mode === "visibility"
              ? {
                  ...h.present,
                  bimVisibility: { hiddenLayerIds: i % 2 ? [] : [h.present.defaultLayerIds.line] },
                }
              : h.present;
        // Alternate order to reduce systematic warm-cache/order bias.
        let actual: ProjectHistory, observed: ReturnType<typeof profile>, elapsed: number;
        if (i % 2) {
          const t = performance.now();
          actual = commitProject(h, target);
          elapsed = performance.now() - t;
          observed = profile(h, target);
        } else {
          observed = profile(h, target);
          const t = performance.now();
          actual = commitProject(h, target);
          elapsed = performance.now() - t;
        }
        if (
          JSON.stringify(actual) !== JSON.stringify(observed.history) ||
          (actual === h) !== (observed.history === h)
        )
          throw Error("Diagnostic mirror mismatch");
        samples.push({ ...observed.phases, actualCommit: elapsed });
        h = actual;
      }
      const keys = Object.keys(samples[0]!);
      const timings = Object.fromEntries(
        keys.map((key) => {
          const a = samples.map((s) => (s as Record<string, number>)[key]!).sort((a, b) => a - b);
          return [key, { median: (a[9]! + a[10]!) / 2, p95: a[18] }];
        }),
      );
      results.push({ mode, historyDepth: h.past.length, timings, samples });
    }
    output.textContent = JSON.stringify(
      {
        userAgent: navigator.userAgent,
        fixture: "K03 1000 elements and 3 PNG/JPEG imports",
        samplesPerMode: 20,
        equivalent: true,
        scope:
          "Diagnostic mirror, alternating measured order; equality checks outside timed sections. No peak memory/FPS claim.",
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
