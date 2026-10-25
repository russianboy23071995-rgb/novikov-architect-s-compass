import { withoutOpeningMarks } from "../../test/legacy-project-fixture.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { loadProjectData, deserializeProject } from "./load.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { createProject } from "../../application/projects/create.ts";
import { addWindow } from "../../application/windows/actions.ts";
import { addLine } from "../../application/lines/actions.ts";
import { validateProject } from "../../domain/project/schema.ts";
import { addWall } from "../../application/walls/actions.ts";
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
    assert.equal(migrated.schemaVersion, PROJECT_SCHEMA_VERSION);
    assert.deepEqual(
      storeyOf(migrated).walls.map(strip),
      storeyOf(input).walls.map((w) => ({ ...w, bodyOffset: 0 })),
    );
    assert.deepEqual(
      storeyOf(withoutOpeningMarks(migrated)).windows.map(strip),
      storeyOf(input).windows,
    );
    assert.deepEqual(storeyOf(migrated).lines?.map(strip), storeyOf(input).lines);
    assert.equal(migrated.id, input.id);
    assert.equal(storeyOf(migrated).id, storeyOf(input).id);
    assert.equal(migrated.unit, input.unit);
    assert.equal(storeyOf(migrated).walls[0]!.layerId, migrated.defaultLayerIds.wall);
    assert.equal(storeyOf(migrated).windows[0]!.layerId, migrated.defaultLayerIds.window);
    if (withLines)
      assert.equal(storeyOf(migrated).lines![0]!.layerId, migrated.defaultLayerIds.line);
    assert.deepEqual(input, before);
    assert.deepEqual(loadProjectData(input), migrated);
    assert.deepEqual(readProjectFile(serializeProject(migrated)), migrated);
    assert.deepEqual(readProjectFile(JSON.stringify(input)), migrated);
    assert.throws(() => validateProject(input)); // no migration during runtime edits
  });

test("standard IDs handle collisions with old project, storey and element IDs deterministically", () => {
  const input = legacy();
  input.id = "layer:exterior-wall";
  storeyOf(input).id = "layer:exterior-wall:1";
  storeyOf(input).lines![0]!.id = "layer:exterior-wall:2";
  storeyOf(input).windows[0]!.id = "layer:window";
  const p = loadProjectData(input);
  assert.equal(p.defaultLayerIds.wall, "layer:exterior-wall:3");
  assert.equal(p.defaultLayerIds.window, "layer:window:1");
  assert.deepEqual(loadProjectData(input), p);
  assert.equal(storeyOf(p).lines![0]!.id, storeyOf(input).lines![0]!.id);
});

test("legacy validation rejects corruption before adding defaults", () => {
  const edits = [
    (p: ReturnType<typeof legacy>) => {
      storeyOf(p).windows[0]!.wallId = "missing";
    },
    (p: ReturnType<typeof legacy>) => {
      storeyOf(p).windows[0]!.width = 4;
    },
    (p: ReturnType<typeof legacy>) => {
      storeyOf(p).walls[0]!.height = 0;
    },
    (p: ReturnType<typeof legacy>) => {
      storeyOf(p).lines![0]!.id = p.id;
    },
    (p: ReturnType<typeof legacy>) => {
      storeyOf(p).lines![0]!.points[1] = { x: 0, y: 1 };
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
      storeyOf(q).walls[0]!.layerId = "missing";
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
  const { layerId, ...wall } = storeyOf(p).walls[0]!;
  assert.throws(() => loadProjectData({ ...replaceStorey(p, { ...storeyOf(p), walls: [wall] }) }));
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
  p = addWindow(p, storeyOf(legacy()).windows[0]!);
  p = createDrawing(p, p, "l", {
    kind: "line",
    lineKind: "line",
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
    appearance: defaultLineAppearance,
  });
  assert.equal(storeyOf(p).walls[0]!.layerId, p.defaultLayerIds.wall);
  assert.equal(storeyOf(p).windows[0]!.layerId, p.defaultLayerIds.window);
  assert.equal(storeyOf(p).lines![0]!.layerId, p.defaultLayerIds.line);
  const other = p.layers.find((l) => l.name === "Innenwand")!.id;
  const wall = {
    ...storeyOf(p).walls[0]!,
    id: "w2",
    start: { x: 10, y: 0 },
    end: { x: 13, y: 0 },
    layerId: other,
  };
  assert.equal(storeyOf(addWall(p, wall)).walls[1]!.layerId, other);
  assert.throws(() => addWall(p, { ...wall, layerId: "missing" }));
  assert.throws(() => addLine(p, { ...storeyOf(p).lines![0]!, id: "l2", layerId: "missing" }));
});

test("both file entry points preserve UTF-8 budget precedence and normal invalid-file errors", async () => {
  const { PROJECT_FILE_LIMIT, ProjectFileSizeError } = await import("./size.ts");
  // Valid JSON padded to the exact byte boundary; not a valid project.
  const exact = '"' + "ä".repeat((PROJECT_FILE_LIMIT - 2) / 2) + '"';
  for (const read of [deserializeProject, readProjectFile]) {
    assert.throws(
      () => read(exact),
      (error: unknown) => error instanceof Error && !(error instanceof ProjectFileSizeError),
    );
    // Still invalid JSON: size must win before parsing, including direct callers.
    assert.throws(() => read(exact + "x"), ProjectFileSizeError);
  }
  assert.throws(() => readProjectFile("{"), /Ungültige Projektdatei/);
  assert.throws(() => readProjectFile("{}"), /Ungültige Projektdatei/);
});
