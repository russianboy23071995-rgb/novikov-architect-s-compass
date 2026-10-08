import { capacityFixture, sourceFile, tick } from "./capacity";
import { importImage } from "../src/interop/images/import";
import { createImageAssetHandle } from "../src/domain/elements/reference/model";
import { updateLine, type Project } from "../src/lib/bim/model";
import { createHistory, commitProject, undoProject, redoProject } from "../src/lib/bim/history";
const output = document.querySelector<HTMLPreElement>("#report")!,
  button = document.querySelector<HTMLButtonElement>("#run")!;
button.onclick = async () => {
  button.disabled = true;
  try {
    output.textContent = "Importieren …";
    const project = capacityFixture(1000);
    for (let i = 0; i < 3; i++) {
      const asset = await importImage(await sourceFile(i), `asset-${i}`);
      project.assets.push(asset);
      project.storey.references.push({
        id: `ref-${i}`,
        kind: "image-reference",
        layerId: project.defaultLayerIds.line,
        assetId: asset.id,
        origin: { x: i * 60, y: -20 },
        rotation: 0,
        metresPerPixel: 0.1,
      });
    }
    const signatures = new Map<number, string>();
    async function run(p: Project, mode: string) {
      const start = performance.now();
      let h = createHistory(p);
      const createMs = performance.now() - start,
        actions: number[] = [],
        commits: number[] = [],
        checkpoints = [];
      for (let i = 1; i <= 100; i++) {
        if (i === 1 || i % 10 === 0) {
          output.textContent = `${mode}: ${i}/100`;
          await tick();
        }
        let t = performance.now();
        const next = updateLine(h.present, "line-0", { color: i % 2 ? "#112233" : "#334155" });
        actions.push(performance.now() - t);
        t = performance.now();
        h = commitProject(h, next);
        commits.push(performance.now() - t);
        if ([1, 10, 50, 100].includes(i)) {
          const signature = JSON.stringify(h.present);
          if (mode === "full") signatures.set(i, signature);
          else if (signatures.get(i) !== signature) throw new Error("Full path mismatch");
          t = performance.now();
          const undo = undoProject(h);
          const undoMs = performance.now() - t;
          t = performance.now();
          const redo = redoProject(undo);
          const redoMs = performance.now() - t;
          if (
            JSON.stringify(redo.present) !== signature ||
            h.past.length !== i ||
            undo.past.length !== i - 1
          )
            throw new Error("History mismatch");
          checkpoints.push({
            depth: i,
            undoMs,
            redoMs,
            sharedAsset: h.past[0]!.assets[0] === h.present.assets[0],
          });
        }
      }
      const stats = (values: number[]) => {
        const a = [...values].sort((a, b) => a - b);
        return { median: a[49], p95: a[94], total: values.reduce((a, b) => a + b, 0) };
      };
      return { createMs, actionMs: stats(actions), commitMs: stats(commits), checkpoints };
    }
    const full = await run(project, "full");
    const t = performance.now();
    const pinned = { ...project, assets: project.assets.map(createImageAssetHandle) };
    const pinMs = performance.now() - t;
    const handles = await run(pinned, "handles");
    output.textContent = JSON.stringify(
      {
        userAgent: navigator.userAgent,
        fixture: "K03 1000 elements + same 3 imported PNG/JPEG",
        scope:
          "One paired run, full then handles; identical existing updateLine/commitProject, no heap/FPS claim",
        pinMs,
        full,
        handles,
        equivalent: true,
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
