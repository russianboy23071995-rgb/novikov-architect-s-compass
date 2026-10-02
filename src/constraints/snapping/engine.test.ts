import test from "node:test";
import assert from "node:assert/strict";
import { querySnap } from "./engine.ts";
import type { SnapContext } from "./engine.ts";
import { projectSnapReferences } from "../../application/snapping/project-references.ts";
import { createProject, addWall, addLine, serializeProject } from "../../lib/bim/model.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
  readProjectFile,
} from "../../lib/bim/history.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";

const context: SnapContext = {
  references: [{ point: { x: 1.037, y: 2.013 }, entityId: "wall", feature: "axis-end" }],
  pixelsPerMetre: 100,
  enabled: true,
  endpointRadiusPx: 10,
  gridSpacing: 0.1,
  orthoOrigin: null,
};

test("endpoint wins over grid and retains exact non-grid coordinates", () => {
  const before = JSON.stringify(context);
  const result = querySnap({ x: 1.04, y: 2.01 }, context);
  assert.deepEqual(result.point, { x: 1.037, y: 2.013 });
  assert.equal(result.candidate?.sourceEntityId, "wall");
  assert.equal(result.candidate?.kind, "endpoint");
  assert.equal(JSON.stringify(context), before);
});
test("endpoint radius stays ten CSS pixels across zoom levels", () => {
  for (const pixelsPerMetre of [10, 100, 1000]) {
    const c = { ...context, pixelsPerMetre, gridSpacing: null };
    assert.equal(
      querySnap({ x: 1.037 + 9 / pixelsPerMetre, y: 2.013 }, c).candidate?.kind,
      "endpoint",
    );
    assert.equal(querySnap({ x: 1.037 + 11 / pixelsPerMetre, y: 2.013 }, c).candidate, null);
  }
});
test("equal candidates use deterministic source ordering independent of array order", () => {
  const refs = [
    { point: { x: 0, y: 0 }, entityId: "b", feature: "end" },
    { point: { x: 0, y: 0 }, entityId: "a", feature: "start" },
  ];
  for (const references of [refs, [...refs].reverse()])
    assert.equal(
      querySnap({ x: 0, y: 0 }, { ...context, references }).candidate?.sourceEntityId,
      "a",
    );
});
test("disabled snap, grid fallback and Ortho never mislabel projected endpoints", () => {
  assert.deepEqual(querySnap({ x: 1.04, y: 2.01 }, { ...context, enabled: false }).point, {
    x: 1.04,
    y: 2.01,
  });
  assert.equal(querySnap({ x: 4.04, y: 4.02 }, context).candidate?.kind, "grid");
  const r = querySnap({ x: 1.04, y: 2.01 }, { ...context, orthoOrigin: { x: 0, y: 2.02 } });
  assert.equal(r.point.y, 2.02);
  assert.equal(r.candidate, null);
});
test("invalid numerical contexts reject and invalid references do not poison queries", () => {
  assert.throws(() => querySnap({ x: NaN, y: 0 }, context));
  assert.throws(() => querySnap({ x: 0, y: 0 }, { ...context, pixelsPerMetre: 0 }));
  assert.throws(() => querySnap({ x: 0, y: 0 }, { ...context, gridSpacing: 0 }));
  assert.throws(() =>
    querySnap({ x: 0, y: 0 }, { ...context, orthoOrigin: { x: Infinity, y: 0 } }),
  );
  assert.equal(
    querySnap(
      { x: 0, y: 0 },
      {
        ...context,
        references: [{ point: { x: NaN, y: 0 }, entityId: "bad", feature: "end" }],
        gridSpacing: null,
      },
    ).candidate,
    null,
  );
});
test("model adapter and snapped line workflow preserve exact point, ID, undo and JSON", () => {
  const project = addWall(createProject("p", "s"), {
    id: "wall",
    start: { x: 0.037, y: 0.013 },
    end: { x: 3.037, y: 0.013 },
    thickness: 0.36,
    height: 2.8,
  });
  const before = serializeProject(project);
  const references = projectSnapReferences(project);
  const start = querySnap({ x: 3.04, y: 0.02 }, { ...context, references }).point;
  const history = createHistory(project);
  const line = {
    id: "line",
    kind: "line" as const,
    points: [start, { x: 4, y: 2 }],
    ...defaultLineAppearance,
  };
  const committed = commitProject(history, addLine(history.present, line));
  assert.deepEqual(committed.present.storey.lines![0]!.points[0], project.storey.walls[0]!.end);
  assert.equal(committed.past.length, 1);
  assert.deepEqual(undoProject(committed).present, project);
  assert.deepEqual(
    readProjectFile(serializeProject(redoProject(undoProject(committed)).present)),
    committed.present,
  );
  assert.equal(projectSnapReferences(committed.present).length, 4);
  assert.equal(serializeProject(project), before);
});
