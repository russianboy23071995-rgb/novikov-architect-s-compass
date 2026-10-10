import test from "node:test";
import assert from "node:assert/strict";
import { hatchPatternTile } from "../../rendering/viewport/hatch-pattern.ts";
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
import { pickupToolDefaults } from "../tools/pickup.ts";
import { ALL_LAYERS_VISIBLE, createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { moveElement } from "../direct-edit/transforms.ts";
import { resolveProjectHatchPatterns } from "./pattern-resolution.ts";

// Exactly the creator gesture: bottom-left to top-right in its SVG-local cell.
const definition = {
  id: "mauerwerk",
  name: "Mauerwerk",
  width: 1,
  height: 1,
  lines: [{ start: { x: 0, y: 1 }, end: { x: 1, y: 0 } }],
};
const points = [
  { x: 10, y: 20 },
  { x: 13, y: 20 },
  { x: 13, y: 22 },
  { x: 10, y: 22 },
];
function fixture(rotation?: number) {
  const p = createProject("project", "storey");
  return createDrawing(p, p, "h", {
    kind: "hatch",
    points,
    fill: { color: "#22b8c5", opacity: 0.6 },
    patternDefinition: definition,
    patternRotation: rotation,
  });
}

test("creator rising diagonal and asymmetric motif retain orientation in a non-square plan tile", () => {
  const application = { patternId: "mauerwerk", mode: "model" as const, origin: { x: 10, y: 20 } };
  const tile = hatchPatternTile(definition, application)!;
  const line = tile.lines[0]!;
  assert.deepEqual({ x: tile.x + line.start.x, y: tile.y + line.start.y }, { x: 10, y: -20 });
  assert.deepEqual({ x: tile.x + line.end.x, y: tile.y + line.end.y }, { x: 11, y: -21 });
  assert.equal(tile.viewBox, "0 0 1 1");
  assert.equal(tile.patternTransform, "rotate(0 10 -20)");
  const asymmetric = {
    ...definition,
    width: 2,
    height: 3,
    lines: [
      { start: { x: 0.2, y: 2.7 }, end: { x: 0.2, y: 0.3 } },
      { start: { x: 0.2, y: 2.7 }, end: { x: 1.8, y: 2.7 } },
    ],
  };
  const t = hatchPatternTile(asymmetric, application)!;
  assert.equal(t.viewBox, "0 0 2 3");
  assert.equal(t.y, -23);
  assert.deepEqual(t.lines, asymmetric.lines);
});

test("rotation affects tile lattice around fixed origin, never contour or shared definition", () => {
  const p = fixture(),
    before = serializeProject(p);
  for (const patternRotation of [0, 360])
    assert.equal(
      previewHatch(p, p, {
        projectId: p.id,
        kind: "update",
        id: "h",
        changes: {},
        patternRotation,
      }),
      p,
    );
  const rotated = previewHatch(p, p, {
    projectId: p.id,
    kind: "update",
    id: "h",
    changes: {},
    patternRotation: 90,
  });
  const hatch = rotated.storey.hatches[0]!;
  assert.deepEqual(hatch.points, p.storey.hatches[0]!.points);
  assert.deepEqual(hatch.fill, p.storey.hatches[0]!.fill);
  assert.deepEqual(hatch.pattern!.origin, { x: 10, y: 20 });
  assert.deepEqual(rotated.hatchPatterns, p.hatchPatterns);
  const tile = hatchPatternTile(definition, hatch.pattern!)!;
  assert.equal(tile.patternTransform, "rotate(-90 10 -20)");
  assert.equal(tile.width, 1);
  assert.equal(tile.height, 1);
  assert.equal(serializeProject(p), before);
  const twice = createDrawing(rotated, rotated, "other", {
    kind: "hatch",
    points: points.map((q) => ({ x: q.x + 5, y: q.y })),
    fill: hatch.fill,
    patternDefinition: definition,
    patternRotation: 15,
  });
  assert.equal(twice.storey.hatches[0]!.pattern!.rotation, 90);
  assert.equal(twice.storey.hatches[1]!.pattern!.rotation, 15);
});

test("pattern angle survives a single Undo/Redo step, file roundtrip, movement and library updates", () => {
  const p = fixture(),
    rotated = previewHatch(p, p, {
      projectId: p.id,
      kind: "update",
      id: "h",
      changes: {},
      patternRotation: 37.5,
    });
  const history = commitProject(createHistory(p), rotated);
  assert.equal(history.past.length, 1);
  assert.deepEqual(undoProject(history).present, p);
  assert.deepEqual(redoProject(undoProject(history)).present, rotated);
  assert.deepEqual(readProjectFile(serializeProject(rotated)), rotated);
  const moved = moveElement(rotated, { kind: "hatch", id: "h" }, { x: 2, y: 3 });
  assert.equal(moved.storey.hatches[0]!.pattern!.rotation, 37.5);
  assert.deepEqual(moved.storey.hatches[0]!.pattern!.origin, { x: 12, y: 23 });
  const refreshed = resolveProjectHatchPatterns(moved, moved, [
    { definition: { ...definition, name: "Neu" }, revision: 7 },
  ]).project;
  assert.deepEqual(refreshed.storey, moved.storey);
});

test("defaults pickup copies angle and produces an independent new origin", () => {
  const p = fixture(135);
  const picked = pickupToolDefaults(p, createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE), {
    kind: "hatch",
    id: "h",
  });
  assert.equal(picked?.tool, "hatch");
  if (picked?.tool !== "hatch") throw new Error("Missing hatch defaults");
  assert.equal(picked.values.patternRotation, 135);
  const next = createDrawing(p, p, "copy", {
    kind: "hatch",
    points: points.map((q) => ({ x: q.x + 7, y: q.y + 8 })),
    ...picked.values,
  });
  assert.equal(next.storey.hatches[1]!.pattern!.rotation, 135);
  assert.deepEqual(next.storey.hatches[1]!.pattern!.origin, { x: 17, y: 28 });
  const retained = previewHatch(next, next, {
    projectId: p.id,
    kind: "update",
    id: "copy",
    changes: {},
    patternDefinition: definition,
  });
  assert.equal(retained.storey.hatches[1]!.pattern!.rotation, 135);
});

test("angles validate at shared action and file boundaries; invalid draft angle emits no tile", () => {
  const p = fixture(),
    before = serializeProject(p);
  for (const angle of [NaN, Infinity, -1, 566]) {
    assert.throws(() =>
      previewHatch(p, p, {
        projectId: p.id,
        kind: "update",
        id: "h",
        changes: {},
        patternRotation: angle,
      }),
    );
    assert.throws(() => fixture(angle));
    assert.equal(
      hatchPatternTile(definition, { ...p.storey.hatches[0]!.pattern!, rotation: angle }),
      null,
    );
    const bad = structuredClone(p);
    bad.storey.hatches[0]!.pattern!.rotation = angle;
    assert.throws(() => validateProject(bad));
  }
  assert.equal(serializeProject(p), before);
  assert.doesNotThrow(() => fixture(0));
  assert.doesNotThrow(() => fixture(360));
  const base = createProject("empty", "s");
  assert.throws(() =>
    createDrawing(base, base, "solid", {
      kind: "hatch",
      points,
      fill: { color: "#112233", opacity: 1 },
      patternRotation: 30,
    }),
  );
  assert.throws(() =>
    previewHatch(
      p,
      { ...p },
      { projectId: p.id, kind: "update", id: "h", changes: {}, patternRotation: 45 },
    ),
  );
});

test("legacy schema 12 migrates with zero implied angle and retains strict old application fields", () => {
  const p = fixture(),
    old = { ...p, schemaVersion: 12 };
  const migrated = readProjectFile(JSON.stringify(old));
  assert.equal(migrated.schemaVersion, 17);
  assert.equal(migrated.storey.hatches[0]!.pattern!.rotation, undefined);
  assert.equal(
    hatchPatternTile(definition, migrated.storey.hatches[0]!.pattern!)!.patternTransform,
    "rotate(0 10 -20)",
  );
  assert.deepEqual(migrated.storey, p.storey);
  assert.throws(() => readProjectFile(JSON.stringify({ ...fixture(45), schemaVersion: 12 })));
});
