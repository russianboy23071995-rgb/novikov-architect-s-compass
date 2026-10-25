import { createProject } from "../src/application/projects/create.ts";
import { addWindow } from "../src/application/windows/actions.ts";
import { validateProject } from "../src/domain/project/schema.ts";
import { addWall } from "../src/application/walls/actions.ts";
import { setStoreyHeight, addStorey } from "../src/application/storeys/actions.ts";
import { setWallHeightRule } from "../src/application/walls/height-binding.ts";
import { prepareZTranslation } from "../src/application/selection/z-translation.ts";
let p = createProject("p", "eg");
p = setStoreyHeight(p, p, { projectId: "p", storeyId: "eg", height: 3 });
p = addStorey(p, p, { projectId: "p", storeyId: "eg", id: "og", side: "above", height: 3 });
p = addWall(p, {
  id: "a",
  start: { x: 0, y: 0 },
  end: { x: 3, y: 0 },
  thickness: 0.36,
  height: 2.8,
});
p = addWall(p, {
  id: "b",
  start: { x: 3, y: 0 },
  end: { x: 3, y: 3 },
  thickness: 0.36,
  height: 2.8,
});
p = addWindow(p, { id: "wa", wallId: "a", width: 1, height: 1, sillHeight: 0.9, position: 0.5 });
p = addWindow(p, { id: "wb", wallId: "b", width: 1, height: 1, sillHeight: 0.9, position: 0.5 });
p = setWallHeightRule(p, p, {
  projectId: "p",
  storeyId: "eg",
  wallIds: ["a", "b"],
  rule: { kind: "slab-underside", storeyId: "og", topOffset: 0 },
});
const targets = [
  { kind: "wall", id: "a" },
  { kind: "wall", id: "b" },
] as const;
for (const count of [0, 2000]) {
  const base = validateProject({
    ...p,
    storeys: p.storeys.map((s, i) =>
      i
        ? s
        : {
            ...s,
            walls: [
              ...s.walls,
              ...Array.from({ length: count }, (_, i) => ({
                ...s.walls[0],
                topBinding: undefined,
                id: "extra" + i,
                start: { x: 10 + i * 4, y: 10 },
                end: { x: 13 + i * 4, y: 10 },
              })),
            ],
          },
    ),
  });
  const action = prepareZTranslation(base, targets);
  for (let i = 0; i < 200; i++) action.evaluate(base, targets, i / 1000);
  const samples = [];
  for (let i = 0; i < 1000; i++) {
    const start = performance.now();
    action.evaluate(base, targets, i / 1000);
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  console.log(
    JSON.stringify({
      walls: count + 2,
      samples: 1000,
      medianMs: samples[500],
      p95Ms: samples[950],
      maxMs: samples[999],
    }),
  );
}
