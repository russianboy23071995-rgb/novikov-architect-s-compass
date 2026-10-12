import test from "node:test";
import assert from "node:assert/strict";
import { sameProjectModel } from "./model-equality.ts";
import { createProject, addLine, validateProject, updateLine } from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { createImageAssetHandle } from "../elements/reference/model.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
const oracle = (a: ReturnType<typeof createProject>, b: typeof a) => {
  const { bimVisibility: _a, ...x } = a,
    { bimVisibility: _b, ...y } = b;
  return JSON.stringify(x) === JSON.stringify(y);
};
function fixture() {
  const p = addLine(createProject("p", "s"), {
    id: "l",
    kind: "line",
    points: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ],
    ...defaultLineAppearance,
  });
  p.assets.push(
    createImageAssetHandle({
      id: "a",
      mimeType: "image/png",
      pixelWidth: 1,
      pixelHeight: 1,
      data: "AAAA",
    }),
  );
  return p;
}
test("structured model comparison agrees with JSON for visibility, fields and asset copies", () => {
  const p = fixture();
  const cases = [
    p,
    validateProject(p),
    structuredClone(p),
    { ...p, bimVisibility: { hiddenLayerIds: [p.defaultLayerIds.line] } },
    updateLine(p, "l", { color: "#abcdef" }),
    { ...p, assets: [{ ...p.assets[0]!, data: "AAAB" }] },
    { ...p, assets: [] },
    { ...p, id: "ä中" },
    { ...p, storey: { ...p.storey, lines: undefined } },
  ];
  for (const a of cases) for (const b of cases) assert.equal(sameProjectModel(a, b), oracle(a, b));
  const negativeZero = updateLine(p, "l", {
    points: [
      { x: -0, y: 0 },
      { x: 2, y: 0 },
    ],
  });
  assert.equal(sameProjectModel(p, negativeZero), oracle(p, negativeZero));
});
test("comparison preserves key-order semantics and optional undefined omission", () => {
  const p = fixture(),
    reordered = { ...p, storey: { ...p.storey } };
  const { data, ...rest } = p.assets[0]!;
  reordered.assets = [{ data, ...rest }];
  assert.equal(sameProjectModel(p, reordered), oracle(p, reordered));
  const a = { ...p, storey: { ...p.storey, lines: undefined } };
  const b: ReturnType<typeof createProject> = structuredClone(a);
  delete b.storey.lines;
  assert.equal(sameProjectModel(a, b), true);
});
test("model edits, visibility, noop and undo retain existing transaction behavior", () => {
  const h = createHistory(fixture());
  assert.equal(commitProject(h, h.present), h);
  const visible = commitProject(h, {
    ...h.present,
    bimVisibility: { hiddenLayerIds: [h.present.defaultLayerIds.line] },
  });
  assert.equal(visible.past.length, 0);
  const edited = commitProject(visible, updateLine(visible.present, "l", { color: "#abcdef" }));
  assert.equal(edited.past.length, 1);
  assert.deepEqual(redoProject(undoProject(edited)), edited);
  assert.throws(() =>
    commitProject(edited, {
      ...edited.present,
      assets: [{ ...edited.present.assets[0]!, data: "!!!!" }],
    }),
  );
});
