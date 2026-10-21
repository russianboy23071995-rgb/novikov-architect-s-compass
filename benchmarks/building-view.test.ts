import {
  createProjectSnapshot,
  isOwnedProjectSnapshot,
} from "../src/domain/project/owned-snapshot.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { buildingViewFixture } from "./building-view-fixture.ts";
import { buildBuildingSolid, buildPreviewSolid } from "../src/lib/bim/geometry.ts";
import { selectWorkingStorey } from "../src/application/storeys/working-storey.ts";
import { workingStoreyElevation } from "../src/domain/storeys/elevation.ts";
import { validateProject } from "../src/domain/project/schema.ts";

test("host grouping preserves isolated wall results and refreshes after reassignment", () => {
  const p = structuredClone(buildingViewFixture(3));
  const storey = p.storeys[0]!;
  const first = storey.windows[0]!;
  storey.windows = [
    { ...first, id: "second", position: 0.7, width: 0.5 },
    { ...first, width: 0.5, position: 0.2 },
    { ...first, id: "overlapping", width: 0.4, position: 0.22 },
  ];
  for (const wall of storey.walls) wall.baseOffset = -0.2;
  for (const reassign of [false, true]) {
    if (reassign) storey.windows[0]!.wallId = storey.walls[1]!.id;
    const combined = buildPreviewSolid({ storey, assets: p.assets }, 3.5);
    let volume = 0;
    for (const wall of storey.walls) {
      const isolated = buildPreviewSolid(
        {
          storey: {
            ...storey,
            walls: [wall],
            windows: storey.windows.filter((w) => w.wallId === wall.id),
          },
          assets: p.assets,
        },
        3.5,
      );
      assert.deepEqual(
        combined.faces.filter((f) => f.wallId === wall.id),
        isolated.faces,
      );
      volume += isolated.volume;
    }
    assert.equal(combined.volume, volume);
  }
});

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

test("mutable identity cannot return stale geometry or bypass validation", () => {
  const p = buildingViewFixture(1);
  const before = buildBuildingSolid(p);
  p.storeys[0]!.walls[0]!.height = 3.5;
  const after = buildBuildingSolid(p);
  assert.notEqual(after, before);
  assert.deepEqual(after, buildBuildingSolid(structuredClone(p)));
  p.storeys[0]!.windows[0]!.width = 99;
  assert.throws(() => buildBuildingSolid(p));
});

test("owned snapshots detach caller data, are immutable and retain fast scene identity", () => {
  const source = buildingViewFixture(1);
  const snapshot = createProjectSnapshot(source);
  assert.ok(isOwnedProjectSnapshot(snapshot));
  assert.equal(createProjectSnapshot(snapshot), snapshot);
  assert.ok(!isOwnedProjectSnapshot(source));
  const scene = buildBuildingSolid(snapshot);
  source.storeys[0]!.walls[0]!.height = 4;
  assert.equal(snapshot.storeys[0]!.walls[0]!.height, 2.8);
  assert.throws(() => {
    snapshot.storeys[0]!.walls[0]!.height = 4;
  });
  assert.throws(() => {
    snapshot.storeys.push(source.storeys[0]!);
  });
  buildBuildingSolid(source); // another scene must not evict this identity entry
  assert.equal(buildBuildingSolid(snapshot), scene);
  const mutableCopy = validateProject(snapshot);
  mutableCopy.storeys[0]!.walls[0]!.height = 5;
  assert.ok(!isOwnedProjectSnapshot(mutableCopy));
  assert.notEqual(buildBuildingSolid(mutableCopy), scene);
  assert.ok(isOwnedProjectSnapshot(selectWorkingStorey(snapshot, snapshot, "s1")));
});

test("caller freeze and snapshot spreading do not grant validation bypass", () => {
  const source = Object.freeze(buildingViewFixture(1));
  const before = buildBuildingSolid(source);
  source.storeys[0]!.windows[0]!.width = 1.6;
  assert.notEqual(buildBuildingSolid(source), before);
  source.storeys[0]!.walls[0]!.height = -1;
  assert.throws(() => buildBuildingSolid(source));
  assert.throws(() => createProjectSnapshot(source));
  const snapshot = createProjectSnapshot(buildingViewFixture(1));
  const spread = { ...snapshot, workingStoreyId: "missing" };
  assert.ok(!isOwnedProjectSnapshot(spread));
  assert.throws(() => buildBuildingSolid(spread));
});
