import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  addWall,
  addLine,
  updateWall,
  updateLine,
  serializeProject,
  validateProject,
} from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
  readProjectFile,
} from "../../lib/bim/history.ts";
function fixture() {
  const p = addLine(
    addWall(createProject("p", "s"), {
      id: "w",
      start: { x: 0, y: 0 },
      end: { x: 3, y: 0 },
      thickness: 0.36,
      height: 2.8,
    }),
    {
      id: "l",
      kind: "line",
      points: [
        { x: 0, y: 2 },
        { x: 3, y: 2 },
      ],
      ...defaultLineAppearance,
    },
  );
  p.assets.push({
    id: "a",
    mimeType: "image/png",
    pixelWidth: 1,
    pixelHeight: 1,
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZsAAAAASUVORK5CYII=",
  });
  p.storey.references.push({
    id: "r",
    kind: "image-reference",
    assetId: "a",
    layerId: p.defaultLayerIds.line,
    origin: { x: 0, y: 0 },
    rotation: 0,
    metresPerPixel: 1,
  });
  return p;
}
test("file ingress renews handles and shares them through wall/line edits and history", () => {
  const source = fixture(),
    loaded = readProjectFile(serializeProject(source)),
    asset = loaded.assets[0]!;
  assert.deepEqual(loaded, source);
  assert.ok(Object.isFrozen(asset));
  assert.notEqual(asset, source.assets[0]);
  let h = createHistory(loaded);
  h = commitProject(h, updateLine(h.present, "l", { color: "#abcdef" }));
  h = commitProject(h, updateWall(h.present, "w", { height: 3 }));
  assert.equal(h.present.assets[0], asset);
  assert.equal(h.past[0]!.assets[0], asset);
  assert.deepEqual(redoProject(undoProject(h)), h);
  assert.deepEqual(undoProject(undoProject(h)).present, loaded);
  const reopened = readProjectFile(serializeProject(h.present));
  assert.deepEqual(reopened, h.present);
  assert.notEqual(reopened.assets[0], asset);
  assert.equal(validateProject(reopened).assets[0], reopened.assets[0]);
  assert.equal(reopened.schemaVersion, 19);
});
test("file ingress rejects corrupt storage, references and geometry before returning handles", () => {
  for (const mutate of [
    (p: ReturnType<typeof fixture>) => {
      p.assets[0]!.data = "!!!!";
    },
    (p: ReturnType<typeof fixture>) => {
      p.assets[0]!.pixelWidth = 20000;
    },
    (p: ReturnType<typeof fixture>) => {
      p.storey.references[0]!.assetId = "missing";
    },
    (p: ReturnType<typeof fixture>) => {
      p.storey.walls[0]!.height = -1;
    },
  ]) {
    const p = fixture();
    mutate(p);
    assert.throws(() => readProjectFile(JSON.stringify(p)));
  }
  assert.throws(() => readProjectFile('{"schemaVersion":9'));
});
