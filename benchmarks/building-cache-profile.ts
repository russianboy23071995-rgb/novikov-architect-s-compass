import { buildingViewFixture } from "./building-view-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";
const mutable = buildingViewFixture(100);
const start = performance.now();
const owned = createProjectSnapshot(mutable);
console.log(JSON.stringify({ snapshotCreationMs: performance.now() - start }));
for (const [kind, project] of [
  ["mutable", mutable],
  ["owned", owned],
] as const) {
  const initial = performance.now();
  const scene = buildBuildingSolid(project);
  const firstMs = performance.now() - initial;
  const warm = Array.from({ length: 6 }, () => {
    const t = performance.now();
    const reused = buildBuildingSolid(project) === scene;
    return { ms: performance.now() - t, reused };
  });
  console.log(JSON.stringify({ kind, firstMs, warm }));
}
