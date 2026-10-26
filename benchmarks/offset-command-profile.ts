// node --experimental-strip-types benchmarks/offset-command-profile.ts <s|l> [repoRoot] [out.json]
// Offset text command through the shared selection command path (docs/performance/OFFSET_COMMAND.md):
// median preview and apply time on the school model with five images of about 4.4 MB each, and
// the resulting projects for an equality check against another checkout (repoRoot as file URL).
import { writeFileSync } from "node:fs";
import { schoolPlanFixture } from "./school-plan-fixture.ts";

const size = (process.argv[2] ?? "s") as "s" | "l";
const root = process.argv[3] ?? new URL("../", import.meta.url).href;
const out = process.argv[4];
const load = (path: string) => import(new URL(path, root.endsWith("/") ? root : root + "/").href);
const { createHistory } = await load("src/application/history/project-history.ts");
const { createImageAssetHandle } = await load("src/domain/elements/reference/model.ts");
const { applySelectionCommand, previewSelectionCommand } = await load(
  "src/application/commands/selection-command.ts",
);
const { ALL_LAYERS_VISIBLE, createLayerVisibilityPolicy } = await load(
  "src/application/layers/visibility.ts",
);
const { serializeProject } = await load("src/lib/bim/model.ts");

/** A valid PNG header (1280 × 1000) followed by filler, as in the acceptance run. */
function largePng(seed: number) {
  const header = Buffer.from("89504e470d0a1a0a0000000d4948445200000500000003e80806000000", "hex");
  return Buffer.concat([header, Buffer.alloc(4), Buffer.alloc(3_300_000, seed)]).toString("base64");
}
const fixture =
  size === "l" ? schoolPlanFixture({ wings: 3, desksPerRoom: 50 }) : schoolPlanFixture();
const project = createHistory({
  ...fixture,
  assets: Array.from({ length: 5 }, (_, i) =>
    createImageAssetHandle({
      id: `img-${i}`,
      mimeType: "image/png",
      pixelWidth: 1280,
      pixelHeight: 1000,
      data: largePng(i + 1),
    }),
  ),
}).present;
const storey = project.storeys.find((s: { id: string }) => s.id === project.workingStoreyId);
const targets = [
  { kind: "line", id: storey.lines.find((l: { kind: string }) => l.kind === "polyline").id },
  { kind: "hatch", id: storey.hatches[0].id },
];
const visibility = createLayerVisibilityPolicy(project, ALL_LAYERS_VISIBLE);
const median = (values: number[]) => [...values].sort((a, b) => a - b)[values.length >> 1]!;
const rows: Record<string, unknown> = {};
const results: string[] = [];
for (const target of targets) {
  const preview: number[] = [],
    apply: number[] = [];
  let result;
  for (let i = 0; i < 7; i++) {
    const text = i % 2 ? "Offset um 5 cm" : "Offset um -2 cm";
    let t0 = performance.now();
    const p = previewSelectionCommand(project, [target], visibility, text);
    preview.push(performance.now() - t0);
    t0 = performance.now();
    result = applySelectionCommand(project, [target], visibility, p);
    apply.push(performance.now() - t0);
    if (i === 0) results.push(serializeProject(result));
  }
  rows[target.kind] = {
    previewMs: +median(preview.slice(1)).toFixed(1),
    applyMs: +median(apply.slice(1)).toFixed(1),
  };
}
const report = { size, root, ...rows };
process.stdout.write(JSON.stringify(report) + "\n");
if (out) writeFileSync(out, JSON.stringify({ report, results }));
