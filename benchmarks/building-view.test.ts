import test from "node:test";
import assert from "node:assert/strict";
import { buildingViewFixture } from "./building-view-fixture.ts";
import { buildBuildingSolid, buildPreviewSolid } from "../src/lib/bim/geometry.ts";
import { selectWorkingStorey } from "../src/application/storeys/working-storey.ts";
import { workingStoreyElevation } from "../src/domain/storeys/elevation.ts";
import { validateProject } from "../src/domain/project/schema.ts";

test("working storey and visibility preserve shared scene but invalidate editing context", () => {
  const p = buildingViewFixture(2),
    scene = buildBuildingSolid(p);
  const next = selectWorkingStorey(p, p, "s1");
  assert.notEqual(next, p);
  assert.equal(buildBuildingSolid(next), scene);
  assert.throws(() => selectWorkingStorey(p, next, "s2"));
  const hidden = validateProject({
    ...next,
    bimVisibility: { hiddenLayerIds: [p.defaultLayerIds.wall] },
  });
  assert.equal(buildBuildingSolid(hidden), scene);
  assert.throws(() => scene.faces.push(scene.faces[0]!));
  assert.throws(() => {
    scene.faces[0]!.vertices[0]![0] = 99;
  });
  const scoped = buildPreviewSolid(
    { storey: next.storeys[1]!, assets: next.assets },
    workingStoreyElevation(next),
  );
  assert.deepEqual(
    scene.faces.filter((f) => f.wallId.startsWith("s1-")),
    scoped.faces,
  );
});

test("new snapshots validate and rebuild for walls, windows, heights and datum; invalid input cannot reuse", () => {
  for (const mutate of [
    (p: ReturnType<typeof buildingViewFixture>) => {
      p.storeys[0]!.walls[0]!.height = 3;
    },
    (p: ReturnType<typeof buildingViewFixture>) => {
      p.storeys[0]!.windows[0]!.width = 1.5;
    },
    (p: ReturnType<typeof buildingViewFixture>) => {
      p.storeys[0]!.height = 4;
    },
    (p: ReturnType<typeof buildingViewFixture>) => {
      p.groundDatum = 10;
    },
  ]) {
    const p = buildingViewFixture(1),
      scene = buildBuildingSolid(p),
      changed = structuredClone(p);
    mutate(changed);
    assert.notEqual(buildBuildingSolid(changed), scene);
  }
  const p = buildingViewFixture(1);
  buildBuildingSolid(p);
  assert.throws(() => buildBuildingSolid({ ...p, workingStoreyId: "missing" }));
  const bad = structuredClone(p);
  bad.storeys[0]!.walls[0]!.height = -1;
  assert.throws(() => buildBuildingSolid(bad));
});
