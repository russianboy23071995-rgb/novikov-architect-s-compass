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
import { createStandardProject } from "../../application/projects/create.ts";
import { addRoof } from "../../application/roofs/actions.ts";
import { addRoom, nextProjectRoomNumber, updateRoom } from "../../application/rooms/actions.ts";
import { nextRoomNumber, roomArea } from "../../domain/elements/room/model.ts";
import { clearHeightLine } from "../../domain/elements/room/height-line.ts";
import { selectWorkingStorey } from "../../application/storeys/working-storey.ts";
import { boundHeightFixture } from "../../../benchmarks/bound-height-fixture.ts";

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

test("schema 31 adds roofs: v30 files load unchanged, smuggled roofs are refused, roofs round-trip", () => {
  // docs/ROOF_ELEMENT.md, D1.
  assert.ok(PROJECT_SCHEMA_VERSION >= 31);
  const current = createStandardProject("p", "eg", "og");
  const v30 = { ...JSON.parse(serializeProject(current)), schemaVersion: 30 };
  const migrated = loadProjectData(v30);
  assert.equal(migrated.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.deepEqual({ ...migrated, schemaVersion: 30 }, { ...current, schemaVersion: 30 });
  const roof = {
    id: "dach",
    points: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 4 },
      { x: 0, y: 4 },
    ],
    referenceLine: { start: { x: 0, y: 0 }, end: { x: 6, y: 0 } },
    rise: "left" as const,
    referenceHeight: 0.5,
    pitch: 35,
    thickness: 0.24,
    eaveCut: "horizontal" as const,
    topCut: "perpendicular" as const,
  };
  const withRoof = addRoof(current, roof);
  const smuggled = { ...JSON.parse(serializeProject(withRoof)), schemaVersion: 30 };
  assert.throws(() => loadProjectData(smuggled));
  // Walls bound to their storey store no height in the file; they load unchanged too.
  const bound = boundHeightFixture();
  assert.ok(bound.storeys.some((s) => s.walls.some((w) => w.topBinding)));
  const boundV30 = { ...JSON.parse(serializeProject(bound)), schemaVersion: 30 };
  assert.deepEqual(
    { ...loadProjectData(boundV30), schemaVersion: 30 },
    { ...bound, schemaVersion: 30 },
  );
  const reread = readProjectFile(serializeProject(withRoof));
  assert.deepEqual(reread, withRoof);
  assert.deepEqual(storeyOf(reread).roofs![0], {
    ...roof,
    layerId: storeyOf(withRoof).roofs![0]!.layerId,
  });
});

test("schema 32 adds rooms: numbers R-001…, optional floor build-up, unique numbers, migration", () => {
  // docs/ROOM_ELEMENT.md, R1.
  assert.equal(PROJECT_SCHEMA_VERSION, 34);
  const base = createStandardProject("p", "eg", "og");
  const square = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ];
  // Numbers: the first room is R-001, the next one continues after the highest R-number.
  let p = addRoom(base, { id: "r1", points: square });
  let room = storeyOf(p).rooms![0]!;
  assert.deepEqual([room.number, room.name, "floorBuildUp" in room], ["R-001", "", false]);
  assert.equal(p.layers.find((l) => l.id === room.layerId)!.name, "Raum");
  assert.equal(roomArea(room), 12);
  p = addRoom(p, { id: "r2", points: square, name: "Bad", floorBuildUp: 0.12 });
  assert.equal(storeyOf(p).rooms![1]!.number, "R-002");
  assert.equal(storeyOf(p).rooms![1]!.floorBuildUp, 0.12);
  p = addRoom(p, { id: "r3", points: square, number: "R-010" });
  assert.equal(nextProjectRoomNumber(p), "R-011");
  assert.equal(nextRoomNumber([{ number: "Küche" }, { number: "r-007" }]), "R-008");
  // Numbers are unique in the whole project, also across storeys and in any letter case.
  const og = selectWorkingStorey(p, p, "og");
  assert.throws(
    () => addRoom(og, { id: "r4", points: square, number: " r-001 " }),
    /bereits vergeben/,
  );
  const ogRoom = addRoom(og, { id: "r4", points: square });
  assert.equal(storeyOf(ogRoom).rooms![0]!.number, "R-011");
  // The floor build-up is optional: it can be set and removed again.
  p = updateRoom(p, "r1", { floorBuildUp: 0.1, name: "Wohnen" });
  room = storeyOf(p).rooms![0]!;
  assert.deepEqual([room.floorBuildUp, room.name], [0.1, "Wohnen"]);
  p = updateRoom(p, "r1", { floorBuildUp: undefined });
  assert.equal("floorBuildUp" in storeyOf(p).rooms![0]!, false);
  for (const bad of [
    { floorBuildUp: -0.1 },
    { number: "" },
    { number: "R-002" },
    { points: [square[0]!, square[2]!, square[1]!, square[3]!] },
  ])
    assert.throws(() => updateRoom(p, "r1", bad));
  assert.throws(() => updateRoom(p, "unbekannt", { name: "x" }), /Unbekannter Raum/);
  // File: rooms round-trip; schema 31 files load unchanged, smuggled rooms are refused.
  assert.deepEqual(readProjectFile(serializeProject(ogRoom)), ogRoom);
  const v31 = { ...JSON.parse(serializeProject(base)), schemaVersion: 31 };
  assert.deepEqual({ ...loadProjectData(v31), schemaVersion: 31 }, { ...base, schemaVersion: 31 });
  assert.throws(() =>
    loadProjectData({ ...JSON.parse(serializeProject(ogRoom)), schemaVersion: 31 }),
  );
  const bound = boundHeightFixture();
  for (const version of [30, 31])
    assert.deepEqual(
      {
        ...loadProjectData({ ...JSON.parse(serializeProject(bound)), schemaVersion: version }),
        schemaVersion: 0,
      },
      { ...bound, schemaVersion: 0 },
      `bound walls from schema ${version}`,
    );
});

test("schema 34 height lines: objects with style and references; 32/33 files load", () => {
  // docs/ROOM_ELEMENT.md, R3/R3b.
  const square = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
  ];
  const base = addRoom(createStandardProject("p", "eg", "og"), { id: "r1", points: square });
  assert.equal("heightLines" in storeyOf(base).rooms![0]!, false);
  const proof = { ...clearHeightLine("h1", 2.3), upper: "outerSkin" as const, color: "#dc2626" };
  const set = updateRoom(base, "r1", { heightLines: [proof] });
  assert.deepEqual(storeyOf(set).rooms![0]!.heightLines, [proof]);
  assert.deepEqual(readProjectFile(serializeProject(set)), set);
  assert.deepEqual(
    storeyOf(updateRoom(base, "r1", { heightLines: [] })).rooms![0]!.heightLines,
    [],
  );
  for (const bad of [
    { ...proof, height: 0.05 },
    { ...proof, height: 11 },
    { ...proof, color: "rot" },
    { ...proof, upper: "dach" },
    { ...proof, style: { ...proof.style, period: -1 } },
  ])
    assert.throws(() => updateRoom(base, "r1", { heightLines: [bad as typeof proof] }));
  // Schema 33 stored clear heights as numbers: they become clear-height lines (default look).
  const v33 = JSON.parse(serializeProject(base));
  v33.schemaVersion = 33;
  v33.storeys[0].rooms[0].heightLines = [1.2, 2.3];
  assert.deepEqual(storeyOf(loadProjectData(v33)).rooms![0]!.heightLines, [
    clearHeightLine("h1", 1.2),
    clearHeightLine("h2", 2.3),
  ]);
  // Rooms without lines and schema 32 files keep the defaults; objects in older files are refused.
  const plain = JSON.parse(serializeProject(base));
  assert.deepEqual(loadProjectData({ ...plain, schemaVersion: 33 }), base);
  assert.deepEqual(loadProjectData({ ...plain, schemaVersion: 32 }), base);
  const withObjects = JSON.parse(serializeProject(set));
  assert.throws(() => loadProjectData({ ...withObjects, schemaVersion: 33 }));
  assert.throws(() => loadProjectData({ ...withObjects, schemaVersion: 32 }));
});
