import test from "node:test";
import assert from "node:assert/strict";
import { loadProjectData } from "./load.ts";
import {
  createProject,
  addWall,
  addWindow,
  addLine,
  validateProject,
  serializeProject,
} from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { createDrawing } from "../../application/drawing/actions.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";

function legacy(withLines = true) {
  return {
    schemaVersion: 1,
    unit: "m",
    id: "p",
    storey: {
      id: "s",
      walls: [
        { id: "w", start: { x: 0, y: 0 }, end: { x: 3, y: 0 }, height: 2.8, thickness: 0.36 },
      ],
      windows: [{ id: "f", wallId: "w", width: 1.2, height: 1.35, sillHeight: 0.9, position: 0.5 }],
      ...(withLines
        ? {
            lines: [
              {
                id: "l",
                kind: "polyline",
                points: [
                  { x: 0, y: 1 },
                  { x: 3, y: 1 },
                  { x: 3, y: 2 },
                ],
                ...defaultLineAppearance,
              },
            ],
          }
        : {}),
    },
  };
}

for (const withLines of [false, true])
  test(`migration preserves version-1 geometry and identity (lines=${withLines})`, () => {
    const input = legacy(withLines),
      before = structuredClone(input);
    const migrated = loadProjectData(input);
    const strip = <T extends { layerId: string }>(e: T) => {
      const { layerId, ...rest } = e;
      return rest;
    };
    assert.equal(migrated.schemaVersion, 5);
    assert.deepEqual(
      migrated.storey.walls.map(strip),
      input.storey.walls.map((w) => ({ ...w, bodyOffset: 0 })),
    );
    assert.deepEqual(migrated.storey.windows.map(strip), input.storey.windows);
    assert.deepEqual(migrated.storey.lines?.map(strip), input.storey.lines);
    assert.equal(migrated.id, input.id);
    assert.equal(migrated.storey.id, input.storey.id);
    assert.equal(migrated.unit, input.unit);
    assert.equal(migrated.storey.walls[0]!.layerId, migrated.defaultLayerIds.wall);
    assert.equal(migrated.storey.windows[0]!.layerId, migrated.defaultLayerIds.window);
    if (withLines) assert.equal(migrated.storey.lines![0]!.layerId, migrated.defaultLayerIds.line);
    assert.deepEqual(input, before);
    assert.deepEqual(loadProjectData(input), migrated);
    assert.deepEqual(readProjectFile(serializeProject(migrated)), migrated);
    assert.deepEqual(readProjectFile(JSON.stringify(input)), migrated);
    assert.throws(() => validateProject(input)); // no migration during runtime edits
  });

test("standard IDs handle collisions with old project, storey and element IDs deterministically", () => {
  const input = legacy();
  input.id = "layer:exterior-wall";
  input.storey.id = "layer:exterior-wall:1";
  input.storey.lines![0]!.id = "layer:exterior-wall:2";
  input.storey.windows[0]!.id = "layer:window";
  const p = loadProjectData(input);
  assert.equal(p.defaultLayerIds.wall, "layer:exterior-wall:3");
  assert.equal(p.defaultLayerIds.window, "layer:window:1");
  assert.deepEqual(loadProjectData(input), p);
  assert.equal(p.storey.lines![0]!.id, input.storey.lines![0]!.id);
});

test("legacy validation rejects corruption before adding defaults", () => {
  const edits = [
    (p: ReturnType<typeof legacy>) => {
      p.storey.windows[0]!.wallId = "missing";
    },
    (p: ReturnType<typeof legacy>) => {
      p.storey.windows[0]!.width = 4;
    },
    (p: ReturnType<typeof legacy>) => {
      p.storey.walls[0]!.height = 0;
    },
    (p: ReturnType<typeof legacy>) => {
      p.storey.lines![0]!.id = p.id;
    },
    (p: ReturnType<typeof legacy>) => {
      p.storey.lines![0]!.points[1] = { x: 0, y: 1 };
    },
  ];
  for (const edit of edits) {
    const p = legacy();
    edit(p);
    assert.throws(() => loadProjectData(p));
  }
  assert.throws(() => loadProjectData({ ...legacy(), unknown: 1 }));
  assert.throws(() => loadProjectData({ ...legacy(), schemaVersion: 99 }));
  assert.throws(() => readProjectFile("{"));
});

test("current schema never repairs missing memberships, unknown defaults or duplicate identities", () => {
  const p = loadProjectData(legacy());
  const edits = [
    (q: typeof p) => {
      q.storey.walls[0]!.layerId = "missing";
    },
    (q: typeof p) => {
      q.defaultLayerIds.wall = "missing";
    },
    (q: typeof p) => {
      q.layers[0]!.id = q.id;
    },
    (q: typeof p) => {
      q.layers[1]!.id = q.layers[0]!.id;
    },
    (q: typeof p) => {
      q.layers[0]!.name = " ";
    },
  ];
  for (const edit of edits) {
    const q = structuredClone(p);
    edit(q);
    assert.throws(() => loadProjectData(q));
  }
  const { layerId, ...wall } = p.storey.walls[0]!;
  assert.throws(() => loadProjectData({ ...p, storey: { ...p.storey, walls: [wall] } }));
  assert.throws(() => loadProjectData({ ...p, unexpected: true }));
});

test("all creation paths use the same stable defaults even after a layer rename", () => {
  let p = createProject("p", "s");
  assert.deepEqual(
    p.layers.map((l) => l.name),
    [
      "Außenwand",
      "Innenwand",
      "Dach",
      "Decke",
      "Fenster",
      "Tür",
      "Möblierung",
      "Geländer",
      "Gelände",
      "2D-Zeichnungen",
      "Neutrale Ebene",
      "Bemaßung",
      "Raum",
      "Textelemente",
    ],
  );
  p.layers.find((l) => l.id === p.defaultLayerIds.wall)!.name = "Fassade";
  p = createDrawing(p, p, "w", {
    kind: "wall",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    height: 2.8,
    thickness: 0.36,
  });
  p = addWindow(p, legacy().storey.windows[0]!);
  p = createDrawing(p, p, "l", {
    kind: "line",
    lineKind: "line",
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
    appearance: defaultLineAppearance,
  });
  assert.equal(p.storey.walls[0]!.layerId, p.defaultLayerIds.wall);
  assert.equal(p.storey.windows[0]!.layerId, p.defaultLayerIds.window);
  assert.equal(p.storey.lines![0]!.layerId, p.defaultLayerIds.line);
  const other = p.layers.find((l) => l.name === "Innenwand")!.id;
  const wall = { ...p.storey.walls[0]!, id: "w2", layerId: other };
  assert.equal(addWall(p, wall).storey.walls[1]!.layerId, other);
  assert.throws(() => addWall(p, { ...wall, layerId: "missing" }));
  assert.throws(() => addLine(p, { ...p.storey.lines![0]!, id: "l2", layerId: "missing" }));
});
