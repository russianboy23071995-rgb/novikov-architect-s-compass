import { createImageAssetHandle } from "../src/domain/elements/reference/model.ts";
import { rasterFixture } from "./raster-budget-fixture.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { translationFixture } from "./translation-content-fixture.ts";
import { prepareSelectionTranslation } from "../src/application/selection/storey-translation.ts";
import { prepareZTranslation } from "../src/application/selection/z-translation.ts";
import { previewHatch } from "../src/application/hatches/actions.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
  readProjectFile,
} from "../src/lib/bim/history.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
import { validateProject } from "../src/domain/project/schema.ts";
import { createProjectRecoveryCodec } from "../src/interop/project-file/recovery-codec.ts";
import { fullSelectionMove } from "./selection-move-oracle.ts";
import { sameProjectContent } from "../src/domain/project/model-equality.ts";

for (const count of [1, 2, 5])
  test(`${count} storeys: shared XY snapshot agrees with full path, one history step and portable/recovery roundtrip`, async () => {
    const fixture = translationFixture(count);
    const image = rasterFixture(1);
    fixture.assets = image.assets.map(createImageAssetHandle);
    fixture.storeys[0]!.references = image.storeys[0]!.references;
    const h = createHistory(fixture),
      p = h.present;
    const ids = count === 1 ? ["w0"] : ["w0", `w${count - 1}`];
    const action = prepareSelectionTranslation(p, ids);
    assert.equal(action.materialize(p, { x: 0, y: 0 }), p);
    let oracle = p;
    for (const s of p.storeys)
      if (ids.includes(s.walls[0]!.id)) {
        oracle = fullSelectionMove(
          { ...oracle, workingStoreyId: s.id },
          [{ kind: "wall", id: s.walls[0]!.id }],
          { x: 0.5, y: -0.2 },
        );
      }
    oracle = validateProject({ ...oracle, workingStoreyId: p.workingStoreyId });
    if (p.workingStoreyId === undefined) delete oracle.workingStoreyId;
    const next = action.materialize(p, { x: 0.5, y: -0.2 });
    assert.equal(sameProjectContent(next, oracle), true);
    const preview = action.evaluate({ x: 0.5, y: -0.2 });
    assert.equal(
      (preview.storeyPatches ?? [preview]).reduce(
        (n, q) => n + storeyOf(q.geometry).windows.length,
        0,
      ),
      ids.length,
    );
    assert.equal(next.assets[0], p.assets[0]);
    const committed = commitProject(h, next);
    assert.equal(committed.past.length, 1);
    assert.deepEqual(undoProject(committed).present, p);
    assert.deepEqual(redoProject(undoProject(committed)).present, next);
    assert.deepEqual(readProjectFile(serializeProject(next)), next);
    const codec = createProjectRecoveryCodec();
    assert.deepEqual(await codec.restore(await codec.prepare(next)), next);
  });

test("XY and Z reject stale identity and in-place changes including image replacement at confirmation", () => {
  for (const mutate of [
    (p: ReturnType<typeof translationFixture>) => {
      p.storeys[0]!.walls[0]!.end.x = 5;
    },
    (p: ReturnType<typeof translationFixture>) => {
      p.storeys[1]!.height = 4;
    },
    (p: ReturnType<typeof translationFixture>) => {
      p.assets[0] = { ...p.assets[0]!, data: "AQID" };
    },
    (p: ReturnType<typeof translationFixture>) => {
      p.layers[0]!.name = "Changed";
    },
  ]) {
    const p = translationFixture(2, 4096),
      ids = ["w0", "w1"];
    const targets = ids.map((id) => ({ kind: "wall" as const, id }));
    const xy = prepareSelectionTranslation(p, ids),
      z = prepareZTranslation(p, targets);
    assert.throws(() => xy.materialize({ ...p }, { x: 1, y: 0 }));
    assert.throws(() => z.materialize({ ...p }, targets, 1));
    mutate(p);
    assert.throws(() => xy.materialize(p, { x: 0, y: 0 }));
    assert.throws(() => z.materialize(p, targets, 0));
  }
});

test("XY/Z preparation, pointer and confirmation plus hatch no-op never stringify payloads", (t) => {
  const p = translationFixture(5, 32 * 1024 * 1024);
  const stringify = JSON.stringify;
  t.mock.method(JSON, "stringify", (...args: Parameters<typeof JSON.stringify>) => {
    const result = stringify(...args);
    assert.ok(!result?.includes("A".repeat(1024)), "image payload was serialized");
    return result;
  });
  const ids = ["w0", "w4"],
    targets = ids.map((id) => ({ kind: "wall" as const, id }));
  const xy = prepareSelectionTranslation(p, ids),
    z = prepareZTranslation(p, targets);
  xy.evaluate({ x: 1, y: 0 });
  z.evaluate(p, targets, 1);
  xy.materialize(p, { x: 1, y: 0 });
  z.materialize(p, targets, 1);
  const made = previewHatch(p, p, {
    kind: "create",
    projectId: p.id,
    hatch: {
      id: "h",
      points: [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
      ],
      fill: { color: "#abcdef", opacity: 1 },
    },
  });
  assert.equal(
    previewHatch(made, made, { kind: "update", projectId: p.id, id: "h", changes: {} }),
    made,
  );
  assert.ok(sameProjectContent(made, made));
});
