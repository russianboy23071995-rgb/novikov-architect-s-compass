import test from "node:test";
import assert from "node:assert/strict";
import { previewLayerAssignment, commitLayerAssignment } from "./actions.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { addLine, serializeProject } from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { createHistory, undoProject, redoProject, readProjectFile } from "../../lib/bim/history.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";

const fixture = () =>
  createHistory(
    addLine(createExampleProject(), {
      id: "line-1",
      kind: "line",
      points: [
        { x: 0, y: 1 },
        { x: 2, y: 1 },
      ],
      ...defaultLineAppearance,
    }),
  );

test("shared assignment previews then commits all element kinds atomically; undo/reload/IFC unchanged", async () => {
  const h = fixture(),
    base = h.present,
    saved = serializeProject(base);
  const request = {
    projectId: base.id,
    elementIds: ["wall-1", "window-1", "line-1"],
    layerId: base.layers.find((l) => l.name === "Neutrale Ebene")!.id,
  };
  const preview = previewLayerAssignment(base, base, request);
  assert.equal(h.past.length, 0);
  assert.equal(serializeProject(base), saved); // discarding preview is cancellation
  const next = commitLayerAssignment(h, base, request);
  assert.equal(next.past.length, 1);
  assert.deepEqual(next.present, preview);
  for (const e of [
    ...next.present.storey.walls,
    ...next.present.storey.windows,
    ...next.present.storey.lines!,
  ])
    assert.equal(e.layerId, request.layerId);
  assert.equal(next.present.storey.windows[0]!.wallId, "wall-1");
  assert.deepEqual(buildSolid(next.present), buildSolid(base));
  const date = new Date("2026-10-04T00:00:00Z");
  assert.equal(await exportIfc(next.present, date), await exportIfc(base, date));
  assert.deepEqual(undoProject(next).present, base);
  assert.deepEqual(redoProject(undoProject(next)).present, next.present);
  assert.deepEqual(readProjectFile(serializeProject(next.present)), next.present);
  assert.equal(commitLayerAssignment(next, next.present, request), next);
});

test("invalid, mixed and stale targets cannot partially commit", () => {
  const h = fixture(),
    base = h.present,
    saved = serializeProject(base);
  const request = {
    projectId: base.id,
    elementIds: ["wall-1"],
    layerId: base.defaultLayerIds.line,
  };
  for (const bad of [
    { ...request, elementIds: ["wall-1", "missing"] },
    { ...request, elementIds: [base.storey.id] },
    { ...request, elementIds: [] },
    { ...request, projectId: "other" },
    { ...request, layerId: "missing" },
  ])
    assert.throws(() => commitLayerAssignment(h, base, bad));
  const next = commitLayerAssignment(h, base, request);
  assert.throws(() => commitLayerAssignment(next, base, request));
  assert.throws(() => commitLayerAssignment(h, structuredClone(base), request));
  assert.equal(serializeProject(base), saved);
  assert.equal(h.past.length, 0);
  assert.equal(next.present.storey.windows[0]!.layerId, base.defaultLayerIds.window);
});
