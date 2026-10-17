import { boundHeightFixture } from "./bound-height-fixture.ts";
import { validateProject } from "../src/lib/bim/model.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { prepareSelectionTranslation } from "../src/application/selection/storey-translation.ts";
import { selectionMoveSurfaces } from "../src/rendering/viewport/selection-move-preview.ts";
import { createSolidBufferCache } from "../src/rendering/viewport/solid-buffer.ts";
const summary = (xs: number[]) => {
  xs.sort((a, b) => a - b);
  return { median: xs[Math.floor(xs.length / 2)], p95: xs[Math.floor(xs.length * 0.95)] };
};
for (const count of [0, 100, 1000]) {
  const p = boundHeightFixture();
  const eg = p.storeys[0]!;
  const project = validateProject({
    ...p,
    storeys: [
      {
        ...eg,
        walls: [
          ...eg.walls,
          ...Array.from({ length: count }, (_, i) => ({
            ...eg.walls[0]!,
            id: `extra-${i}`,
            start: { x: 20 + i * 5, y: 10 },
            end: { x: 23 + i * 5, y: 10 },
          })),
        ],
      },
      ...p.storeys.slice(1),
    ],
  });
  const prepStart = performance.now();
  const action = prepareSelectionTranslation(project, ["eg-a", "eg-b"]);
  const solid = buildBuildingSolid(project);
  const cache = createSolidBufferCache();
  const selected = new Set(["eg-a", "eg-b"]);
  cache.update(solid, [0, 0, 0], selected);
  const preparationMs = performance.now() - prepStart;
  const evaluation: number[] = [],
    composition: number[] = [],
    grouping: number[] = [];
  let uploadBytes = 0;
  for (let i = 0; i < 400; i++) {
    const a = performance.now();
    const patch = action.evaluate({ x: i / 1000, y: 0.1 });
    const b = performance.now();
    const display = selectionMoveSurfaces(solid, project, patch);
    const c = performance.now();
    const packed = cache.update(display, [0, 0, 0], selected);
    const d = performance.now();
    if (i >= 100) {
      evaluation.push(b - a);
      composition.push(c - b);
      grouping.push(d - c);
    }
    uploadBytes =
      packed.full?.byteLength ?? packed.patches.reduce((n, p) => n + p.data.byteLength, 0);
  }
  console.log(
    JSON.stringify({
      walls: count + 4,
      samples: 300,
      preparationMs,
      evaluation: summary(evaluation),
      composition: summary(composition),
      grouping: summary(grouping),
      uploadBytes,
      scope: "Node CPU + planned upload bytes; no GPU/native/frame measurement",
    }),
  );
}
