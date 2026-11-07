import test from "node:test";
import assert from "node:assert/strict";
import { storeyOf } from "../../domain/storeys/access.ts";
import { createProject } from "../projects/create.ts";
import { previewCreateReference } from "./actions.ts";
import {
  alignmentTurn,
  parseCalibrationField,
  previewAlignment,
  previewCalibration,
} from "./calibration.ts";
import { imageReferenceCorners } from "../../rendering/viewport/image-reference.ts";

// docs/BILDUNTERLAGE.md, B3 (An Linie ausrichten) and B4 (Kalibrierfeld).
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
function underlay(rotation = 0) {
  const base = createProject("p", "s");
  return previewCreateReference(base, base, {
    projectId: base.id,
    asset: { id: "asset", mimeType: "image/png", pixelWidth: 1, pixelHeight: 1, data: png },
    reference: {
      id: "ref",
      kind: "image-reference",
      assetId: "asset",
      layerId: base.defaultLayerIds.line,
      origin: { x: 0, y: 10 },
      rotation,
      metresPerPixel: 10,
    },
  });
}
const targets = [{ kind: "reference" as const, id: "ref" }];
const ref = (p: ReturnType<typeof underlay>) => storeyOf(p).references[0]!;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test("align: the nearer axis wins, the first point stays", () => {
  assert.ok(near(alignmentTurn({ x: 0, y: 0 }, { x: 10, y: 1 }), -Math.atan2(1, 10)));
  assert.ok(near(alignmentTurn({ x: 0, y: 0 }, { x: 1, y: 10 }), Math.PI / 2 - Math.atan2(10, 1)));
  // A scan turned by 5°: its top edge from the corner goes 5° up; afterwards it is level.
  const tilt = (5 * Math.PI) / 180;
  const p = underlay(tilt);
  const [a, b] = imageReferenceCorners(ref(p), p.assets[0]!);
  const first = { x: a!.x + 0.2 * (b!.x - a!.x), y: a!.y + 0.2 * (b!.y - a!.y) };
  const aligned = previewAlignment(p, p, targets, {
    projectId: p.id,
    referenceId: "ref",
    first,
    second: b!,
  });
  assert.ok(near(ref(aligned).rotation, 0));
  const [a2, b2] = imageReferenceCorners(ref(aligned), aligned.assets[0]!);
  assert.ok(near(a2!.y, b2!.y));
  // The picked point keeps its place on the image: 20 % along the top edge.
  assert.ok(near(a2!.x + 0.2 * (b2!.x - a2!.x), first.x));
  assert.ok(near(a2!.y, first.y));
  assert.throws(() =>
    previewAlignment(p, p, targets, { projectId: p.id, referenceId: "ref", first, second: first }),
  );
  assert.throws(() =>
    previewAlignment(p, p, [], { projectId: p.id, referenceId: "ref", first, second: b! }),
  );
});

test("calibration field: a bare number is metres, units still work", () => {
  assert.equal(parseCalibrationField("8"), 8);
  assert.equal(parseCalibrationField("7,5"), 7.5);
  assert.equal(parseCalibrationField("800 cm"), 8);
  for (const text of ["", "0", "-2", "acht", "5 ft"])
    assert.throws(() => parseCalibrationField(text));
  const p = underlay();
  const next = previewCalibration(p, p, targets, {
    projectId: p.id,
    referenceId: "ref",
    first: { x: 0, y: 0 },
    second: { x: 5, y: 0 },
    metres: parseCalibrationField("10"),
  });
  assert.ok(near(ref(next).metresPerPixel, 20));
});
