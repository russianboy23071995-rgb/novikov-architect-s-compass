import test from "node:test";
import assert from "node:assert/strict";
import { propertyFormKey } from "./property-form-key.ts";
import { createExampleProject } from "./bim-view.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
import { updateWall } from "../../lib/bim/model.ts";
test("property drafts follow immutable revisions, selection and undo/redo without serializing data", () => {
  const p = createExampleProject(),
    s = { kind: "wall" as const, id: p.storey.walls[0]!.id };
  const initial = propertyFormKey(p, s);
  assert.equal(propertyFormKey(p, { ...s }), initial);
  assert.notEqual(propertyFormKey(p, null), initial);
  assert.notEqual(propertyFormKey(p, { kind: "window", id: s.id }), initial);
  const h = commitProject(createHistory(p), updateWall(p, s.id, { height: 3 }));
  assert.notEqual(propertyFormKey(h.present, s), initial);
  const u = undoProject(h);
  assert.notEqual(propertyFormKey(u.present, s), propertyFormKey(h.present, s));
  assert.equal(redoProject(u).present.storey.walls[0]!.height, 3);
  const noRead = new Proxy(p, {
    get() {
      throw new Error("Key must not inspect model or assets");
    },
  });
  assert.equal(propertyFormKey(noRead, s), propertyFormKey(noRead, s));
  for (const next of [
    { ...p, layers: [...p.layers] },
    { ...p, bimVisibility: { hiddenLayerIds: [] } },
    { ...p, assets: [...p.assets] },
  ])
    assert.notEqual(propertyFormKey(next, s), initial);
});
