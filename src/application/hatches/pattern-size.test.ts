import test from "node:test";
import assert from "node:assert/strict";
import { createProject, serializeProject, validateProject } from "../../lib/bim/model.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
  readProjectFile,
} from "../../lib/bim/history.ts";
import { createDrawing } from "../drawing/actions.ts";
import { previewHatch } from "./actions.ts";
import { changeHatchSizeMode, patternSize } from "./pattern-size.ts";
import { projectScaleContext, changeProjectScale } from "../views/project-scale.ts";
import { hatchPatternTile } from "../../rendering/viewport/hatch-pattern.ts";
import { pickupToolDefaults } from "../tools/pickup.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { moveElement } from "../direct-edit/transforms.ts";
import { resolveProjectHatchPatterns } from "./pattern-resolution.ts";
const definition = {
  id: "scale-test",
  name: "Zelle",
  width: 0.2,
  height: 0.3,
  lines: [{ start: { x: 0, y: 0.3 }, end: { x: 0.2, y: 0 } }],
};
const points = [
  { x: 1, y: 2 },
  { x: 4, y: 2 },
  { x: 4, y: 4 },
  { x: 1, y: 4 },
];
function fixture() {
  const p = createProject("p", "s");
  return createDrawing(p, p, "h", {
    kind: "hatch",
    points,
    fill: { color: "#22b8c5", opacity: 0.6 },
    patternDefinition: definition,
    patternRotation: 45,
  });
}
function toPaper(p = fixture()) {
  const size = changeHatchSizeMode(
    definition,
    patternSize(p.storey.hatches[0]!.pattern),
    "paper",
    projectScaleContext(p),
  );
  return previewHatch(p, p, {
    projectId: p.id,
    kind: "update",
    id: "h",
    changes: {},
    patternSize: size,
  });
}
test("mode changes preserve visible width both ways, including after a scale change", () => {
  const base = fixture(),
    paper = toPaper(base),
    h = paper.storey.hatches[0]!;
  assert.deepEqual(h.points, base.storey.hatches[0]!.points);
  assert.deepEqual(paper.hatchPatterns, base.hatchPatterns);
  assert.equal(h.pattern!.mode, "paper");
  assert.deepEqual(patternSize(h.pattern), { mode: "paper", paperWidthMetres: 0.002 });
  const tile = hatchPatternTile(definition, h.pattern!, undefined, projectScaleContext(paper))!;
  assert.equal(tile.width, 0.2);
  assert.equal(tile.height, 0.3);
  assert.equal(tile.patternTransform, "rotate(-45 1 -2)");
  const changed = changeProjectScale(paper, projectScaleContext(paper).view, 50);
  assert.equal(
    hatchPatternTile(definition, h.pattern!, undefined, projectScaleContext(changed))!.width,
    0.1,
  );
  const size = changeHatchSizeMode(
    definition,
    patternSize(h.pattern),
    "model",
    projectScaleContext(changed),
  );
  assert.deepEqual(size, { mode: "model", modelWidthMetres: 0.1 });
  const restored = previewHatch(changed, changed, {
    projectId: changed.id,
    kind: "update",
    id: "h",
    changes: {},
    patternSize: size,
  });
  assert.equal(hatchPatternTile(definition, restored.storey.hatches[0]!.pattern!)!.width, 0.1);
});
test("size edits are one model undo step; view scale stays outside that history; save/load retains mode", () => {
  const p = fixture();
  let history = commitProject(createHistory(p), toPaper(p));
  assert.equal(history.past.length, 1);
  history = commitProject(
    history,
    changeProjectScale(history.present, projectScaleContext(p).view, 50),
  );
  history = undoProject(history);
  assert.equal(history.present.storey.hatches[0]!.pattern!.mode, "model");
  assert.equal(projectScaleContext(history.present).denominator, 50);
  history = redoProject(history);
  assert.equal(history.present.storey.hatches[0]!.pattern!.mode, "paper");
  assert.deepEqual(readProjectFile(serializeProject(history.present)), history.present);
  const old = { ...p, schemaVersion: 15 };
  const loaded = readProjectFile(JSON.stringify(old));
  assert.equal(loaded.schemaVersion, 20);
  assert.deepEqual(loaded.storey, p.storey);
  assert.throws(() => readProjectFile(JSON.stringify({ ...history.present, schemaVersion: 15 })));
});
test("pickup, drawing, translation, property edits and library updates preserve application sizing", () => {
  const p = toPaper();
  const pickup = pickupToolDefaults(p, createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE), {
    kind: "hatch",
    id: "h",
  })!;
  assert.equal(pickup.tool, "hatch");
  if (pickup.tool !== "hatch") throw new Error();
  const next = createDrawing(p, p, "copy", {
    kind: "hatch",
    points: points.map((v) => ({ x: v.x + 5, y: v.y })),
    ...pickup.values,
  });
  assert.deepEqual(
    patternSize(next.storey.hatches[1]!.pattern),
    patternSize(p.storey.hatches[0]!.pattern),
  );
  const moved = moveElement(p, { kind: "hatch", id: "h" }, { x: 2, y: 3 });
  assert.deepEqual(
    patternSize(moved.storey.hatches[0]!.pattern),
    patternSize(p.storey.hatches[0]!.pattern),
  );
  const edited = previewHatch(p, p, {
    projectId: p.id,
    kind: "update",
    id: "h",
    changes: { fill: { color: "#112233", opacity: 0.8 } },
    patternDefinition: definition,
    patternRotation: 90,
  });
  assert.equal(edited.storey.hatches[0]!.pattern!.mode, "paper");
  const updated = resolveProjectHatchPatterns(p, p, [
    { definition: { ...definition, width: 0.4 }, revision: 2 },
  ]).project;
  assert.deepEqual(
    patternSize(updated.storey.hatches[0]!.pattern),
    patternSize(p.storey.hatches[0]!.pattern),
  );
});
test("invalid dimensions, stale actions, missing context and overflow are rejected without mutation", () => {
  const p = fixture(),
    before = serializeProject(p);
  for (const size of [
    { mode: "paper" },
    { mode: "paper", paperWidthMetres: 0 },
    { mode: "paper", paperWidthMetres: NaN },
    { mode: "paper", paperWidthMetres: Infinity },
    { mode: "model", modelWidthMetres: -1 },
    { mode: "paper", paperWidthMetres: 0.002, modelWidthMetres: 1 },
  ]) {
    assert.throws(() =>
      previewHatch(p, p, {
        projectId: p.id,
        kind: "update",
        id: "h",
        changes: {},
        patternSize: size as never,
      }),
    );
  }
  assert.throws(() =>
    previewHatch(
      p,
      { ...p },
      {
        projectId: p.id,
        kind: "update",
        id: "h",
        changes: {},
        patternSize: { mode: "paper", paperWidthMetres: 0.002 },
      },
    ),
  );
  const paper = toPaper(p);
  assert.throws(() => hatchPatternTile(definition, paper.storey.hatches[0]!.pattern!));
  assert.throws(() =>
    changeProjectScale(
      previewHatch(paper, paper, {
        projectId: paper.id,
        kind: "update",
        id: "h",
        changes: {},
        patternSize: { mode: "paper", paperWidthMetres: 2 },
      }),
      projectScaleContext(paper).view,
      Number.MAX_VALUE,
    ),
  );
  assert.throws(() =>
    validateProject({
      ...paper,
      workingViews: [{ kind: "working-plan", storeyId: "s", denominator: 0.001 }],
      storey: {
        ...paper.storey,
        hatches: paper.storey.hatches.map((h) => ({
          ...h,
          pattern: { ...h.pattern, paperWidthMetres: Number.MIN_VALUE },
        })),
      },
    }),
  );
  assert.equal(serializeProject(p), before);
});
