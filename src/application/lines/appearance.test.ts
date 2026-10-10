import { createDrawing } from "../drawing/actions.ts";
import { pickupToolDefaults } from "../tools/pickup.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyLineStyle } from "./appearance.ts";
import { builtInLineStyles, deleteLineStyle } from "./style-library.ts";
import {
  createProject,
  addLine,
  serializeProject,
  deserializeProject,
  updateLine,
} from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { createHistory, commitProject, undoProject } from "../../lib/bim/history.ts";
import {
  linePatternLayout,
  linePatternStroke,
} from "../../rendering/viewport/line-pattern-layout.ts";
test("portable model-space pattern survives catalog deletion and roundtrip, undo atomic", () => {
  const base = createProject("pattern-project", "storey-pattern");
  const appearance = applyLineStyle(defaultLineAppearance, builtInLineStyles[1]!, 0.25);
  const next = addLine(base, {
    id: "line-pattern",
    kind: "polyline",
    points: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 2 },
    ],
    ...appearance,
  });
  deleteLineStyle({ read: () => null, write: () => {} }, builtInLineStyles, "dashed");
  const reopened = deserializeProject(serializeProject(next));
  assert.deepEqual(reopened, next);
  assert.equal(reopened.storey.lines![0]!.repeatLength, 0.25);
  assert.equal(reopened.storey.lines![0]!.pattern!.id, "dashed");
  const history = commitProject(createHistory(base), next);
  assert.deepEqual(undoProject(history).present, base);
  assert.throws(() => applyLineStyle(defaultLineAppearance, builtInLineStyles[0]!, 0));
});
test("schema 9 loads unchanged geometry as schema 11; invalid embedded patterns rejected", () => {
  const project = createProject("legacy-style", "storey-legacy");
  const { hatchPatterns: _patterns, ...old } = project;
  const legacy = { ...old, schemaVersion: 9 };
  const loaded = loadProjectData(legacy);
  assert.equal(loaded.schemaVersion, 16);
  assert.deepEqual(loaded.storey, project.storey);
  assert.throws(() =>
    addLine(project, {
      id: "invalid",
      kind: "line",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
      color: "#000000",
      penWidth: 0.25,
      style: "custom",
    }),
  );
});
test("pattern size is world-based and phase continues around polyline corners", () => {
  const result = linePatternLayout(
    [
      { x: 0, y: 0 },
      { x: 1.25, y: 0 },
      { x: 1.25, y: 1 },
    ],
    20,
    0.5,
  );
  assert.equal(result.scale, 0.025);
  assert.equal(result.segments[1]!.phase, 0.25);
  assert.equal(result.segments[1]!.rotation, -90);
  const dense = linePatternLayout(
    [
      { x: 0, y: 0 },
      { x: 100000, y: 0 },
    ],
    20,
    0.000001,
  );
  assert.equal(dense.segments.length, 1);
});

test("shared creation and pickup retain owned custom pattern without geometry duplication", () => {
  const base = createProject("shared-custom", "storey-custom");
  const appearance = applyLineStyle(defaultLineAppearance, builtInLineStyles[2]!, 0.4);
  const made = createDrawing(base, base, "source-custom", {
    kind: "line",
    points: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ],
    lineKind: "line",
    appearance,
  });
  const preset = pickupToolDefaults(made, createLayerVisibilityPolicy(made, ALL_LAYERS_VISIBLE), {
    kind: "line",
    id: "source-custom",
  })!;
  assert.equal(preset.tool, "line");
  if (preset.tool !== "line") throw new Error("line expected");
  assert.equal(preset.values.repeatLength, 0.4);
  assert.deepEqual(preset.values.pattern, made.storey.lines![0]!.pattern);
  assert.notEqual(preset.values.pattern, made.storey.lines![0]!.pattern);
  const next = createDrawing(made, made, "copy-custom", {
    kind: "line",
    points: [
      { x: 0, y: 1 },
      { x: 3, y: 1 },
    ],
    lineKind: "line",
    appearance: preset.values,
  });
  assert.equal(next.storey.lines!.length, 2);
  assert.equal(next.storey.lines![1]!.points.length, 2);
  const before = JSON.stringify(next);
  assert.throws(() =>
    addLine(next, {
      id: "bad-custom",
      kind: "line",
      points: [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
      ],
      ...appearance,
      repeatLength: Infinity,
    }),
  );
  assert.equal(JSON.stringify(next), before);
});

test("fixed color cannot be overridden, editable colors remain free and survive roundtrip", () => {
  const base = createProject("color-rule", "color-storey");
  const locked = applyLineStyle(
    defaultLineAppearance,
    { ...builtInLineStyles[0]!, color: "#aa2244", colorEditable: false },
    1.5,
  );
  const line = {
    id: "locked",
    kind: "line" as const,
    points: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
    ],
    ...locked,
  };
  const project = addLine(base, line);
  assert.throws(() => updateLine(project, "locked", { color: "#00ff00" }));
  assert.equal(project.storey.lines![0]!.color, "#aa2244");
  const reopened = deserializeProject(serializeProject(project));
  assert.equal(reopened.storey.lines![0]!.pattern!.colorEditable, false);
  const free = addLine(base, {
    ...line,
    id: "free",
    ...applyLineStyle(
      defaultLineAppearance,
      { ...builtInLineStyles[0]!, colorEditable: true },
      1.5,
    ),
  });
  assert.equal(updateLine(free, "free", { color: "#00ff00" }).storey.lines![0]!.color, "#00ff00");
  const noFlag = applyLineStyle(defaultLineAppearance, builtInLineStyles[0]!, 1.5);
  assert.equal(noFlag.pattern!.colorEditable, true);
});
test("pattern pen width stays equal to system pen at different zoom and repeat lengths", () => {
  for (const ppm of [20, 100, 500])
    for (const scale of [0.005, 0.05, 0.5]) {
      const width = linePatternStroke(0.25, ppm, scale);
      assert.ok(Math.abs(width * scale * ppm - (0.25 * 96) / 25.4) < 1e-10);
    }
  assert.throws(() => linePatternStroke(0.25, 0, 1));
});
