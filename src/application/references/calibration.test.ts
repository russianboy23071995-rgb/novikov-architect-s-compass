import test from "node:test";
import assert from "node:assert/strict";
import { createProject, serializeProject, deserializeProject } from "../../lib/bim/model.ts";
import { createHistory, undoProject, redoProject } from "../../lib/bim/history.ts";
import { previewCreateReference } from "./actions.ts";
import { previewCalibration, commitCalibration, parseCalibrationLength } from "./calibration.ts";
import { imageReferenceCorners } from "../../rendering/viewport/image-reference.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";
function fixture(rotation = 0) {
  const p = createProject("p", "s");
  return previewCreateReference(p, p, {
    projectId: p.id,
    asset: { id: "a", mimeType: "image/png", pixelWidth: 400, pixelHeight: 200, data: "AAAA" },
    reference: {
      id: "r",
      kind: "image-reference",
      assetId: "a",
      layerId: p.defaultLayerIds.line,
      origin: { x: 3, y: 4 },
      rotation,
      metresPerPixel: 0.01,
    },
  });
}
const targets = [{ kind: "reference" as const, id: "r" }];
for (const angle of [0, 0.73])
  test(`calibration preserves anchor, rotation, asset and one undo step (${angle})`, () => {
    const base = fixture(angle),
      h = createHistory(base),
      r = base.storey.references[0]!,
      asset = base.assets[0]!;
    const first = imageReferenceCorners(r, asset)[0]!,
      second = imageReferenceCorners(r, asset)[1]!;
    const request = { projectId: base.id, referenceId: "r", first, second, metres: 5 };
    const preview = previewCalibration(base, base, targets, request);
    const corners = imageReferenceCorners(preview.storey.references[0]!, asset);
    assert.ok(
      Math.abs(Math.hypot(corners[1]!.x - corners[0]!.x, corners[1]!.y - corners[0]!.y) - 5) <
        1e-12,
    );
    assert.deepEqual(corners[0], first);
    assert.deepEqual(preview.assets, base.assets);
    assert.equal(preview.storey.references[0]!.rotation, angle);
    assert.equal(base.storey.references[0]!.metresPerPixel, 0.01);
    const next = commitCalibration(h, h.present, targets, request);
    assert.equal(next.past.length, 1);
    assert.deepEqual(undoProject(next).present, h.present);
    assert.deepEqual(redoProject(undoProject(next)).present, next.present);
    assert.deepEqual(deserializeProject(serializeProject(next.present)), preview);
  });
test("interior anchor stays fixed while origin moves", () => {
  const base = fixture();
  const r = previewCalibration(base, base, targets, {
    projectId: "p",
    referenceId: "r",
    first: { x: 4, y: 3 },
    second: { x: 5, y: 3 },
    metres: 2,
  }).storey.references[0]!;
  assert.deepEqual(r.origin, { x: 2, y: 5 });
  assert.equal(r.metresPerPixel, 0.02);
  assert.deepEqual(
    { x: r.origin.x + 100 * r.metresPerPixel, y: r.origin.y - 100 * r.metresPerPixel },
    { x: 4, y: 3 },
  );
});
test("invalid, mixed, missing and stale targets are rejected before scaling", () => {
  const base = fixture(),
    request = {
      projectId: "p",
      referenceId: "r",
      first: { x: 0, y: 0 },
      second: { x: 1, y: 0 },
      metres: 5,
    };
  for (const t of [
    [],
    [{ kind: "wall" as const, id: "r" }],
    [...targets, { kind: "wall" as const, id: "w" }],
    [{ kind: "reference" as const, id: "missing" }],
  ])
    assert.throws(() => previewCalibration(base, base, t, request));
  assert.throws(() => previewCalibration(base, { ...base }, targets, request));
  assert.throws(() => previewCalibration(base, base, targets, { ...request, projectId: "other" }));
  const hidden = createLayerVisibilityPolicy(base, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [base.defaultLayerIds.line],
  });
  assert.throws(() => previewCalibration(base, base, targets, request, hidden));
});
test("zero baselines and invalid or overflowing lengths reject without mutation", () => {
  const base = fixture(),
    before = serializeProject(base),
    request = {
      projectId: "p",
      referenceId: "r",
      first: { x: 0, y: 0 },
      second: { x: 1, y: 0 },
      metres: 5,
    };
  for (const metres of [0, -1, NaN, Infinity, 1e308])
    assert.throws(() => previewCalibration(base, base, targets, { ...request, metres }));
  assert.throws(() =>
    previewCalibration(base, base, targets, { ...request, second: request.first }),
  );
  assert.equal(serializeProject(base), before);
});
test("length requires explicit metric units and handles decimal comma", () => {
  assert.equal(parseCalibrationLength("250 cm"), 2.5);
  assert.equal(parseCalibrationLength("1,5 m"), 1.5);
  assert.equal(parseCalibrationLength("5000 mm"), 5);
  for (const text of ["5", "0 m", "-2 m", "NaN m", "5 ft", ""])
    assert.throws(() => parseCalibrationLength(text));
});
