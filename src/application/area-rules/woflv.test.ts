import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addRoom, updateRoom } from "../rooms/actions.ts";
import { pickupToolDefaults } from "../tools/pickup.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { compactLivingArea } from "../../domain/elements/room/model.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { deserializeProject, serializeProject } from "../../lib/bim/model.ts";
import { areaUseOf, fixedShare, roomLivingResult, storeyAreaBlockers } from "./woflv.ts";
import { livingSchedule, livingScheduleCsv } from "./schedule.ts";
import { addColumn } from "../columns/actions.ts";
import { addStair } from "../stairs/actions.ts";
import { workingRoomLiving } from "../rooms/actions.ts";
import type { CeilingSource } from "../../domain/elements/room/heights.ts";

// docs/WOHNFLAECHE.md, W1.
const square = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 3 },
  { x: 0, y: 3 },
];
const withRoom = () => addRoom(createStandardProject("p", "eg", "og"), { id: "r", points: square });
const room = (p: ReturnType<typeof withRoom>) => storeyOf(p).rooms![0]!;

test("a room without data is a living room, the kinds have their shares", () => {
  assert.equal(areaUseOf(undefined), "living");
  assert.equal(fixedShare(undefined), null);
  assert.equal(fixedShare({ use: "unheated" }), 0.5);
  assert.equal(fixedShare({ use: "outdoor" }), 0.25);
  assert.equal(fixedShare({ use: "outdoor", outdoorShare: 0.5 }), 0.5);
  assert.equal(fixedShare({ use: "none" }), 0);
});

test("the stored form drops defaults, a share belongs to outdoor rooms only", () => {
  assert.equal(compactLivingArea({ use: "living" }), undefined);
  assert.deepEqual(compactLivingArea({ use: "outdoor", outdoorShare: 0.25 }), { use: "outdoor" });
  assert.deepEqual(compactLivingArea({ use: "none", outdoorShare: 0.4 }), { use: "none" });
  const corrections = [{ note: "Schornstein", area: -0.25 }];
  assert.deepEqual(compactLivingArea({ use: "living", corrections }), {
    use: "living",
    corrections,
  });
});

test("a room keeps its use through file and window; more than half is refused", () => {
  let p = updateRoom(withRoom(), "r", { livingArea: { use: "outdoor", outdoorShare: 0.4 } });
  assert.throws(() => updateRoom(p, "r", { livingArea: { use: "outdoor", outdoorShare: 0.6 } }));
  const back = deserializeProject(serializeProject(p));
  assert.deepEqual(room(back).livingArea, { use: "outdoor", outdoorShare: 0.4 });
  p = updateRoom(p, "r", { livingArea: undefined });
  assert.equal("livingArea" in room(p), false);
});

test("the tool places the use, pickup takes it back", () => {
  const p = addRoom(createStandardProject("p", "eg", "og"), {
    id: "r",
    points: square,
    livingArea: { use: "unheated" },
  });
  const picked = pickupToolDefaults(p, createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE), {
    kind: "room",
    id: "r",
  });
  assert.equal(picked?.tool === "room" && picked.values.areaUse, "unheated");
});

test("file 64: loads without data, living area data is refused", () => {
  const p = updateRoom(withRoom(), "r", { livingArea: { use: "none" } });
  const old = JSON.parse(serializeProject(p));
  old.schemaVersion = 64;
  assert.throws(() => deserializeProject(JSON.stringify(old)));
  for (const storey of old.storeys) for (const r of storey.rooms ?? []) delete r.livingArea;
  assert.equal(deserializeProject(JSON.stringify(old)).schemaVersion, PROJECT_SCHEMA_VERSION);
});

// W2, by hand: a room 4 × 3 m under a roof rising 1 m per metre from x = 0.
const slope: CeilingSource = {
  id: "dach",
  points: [
    { x: -1, y: -1 },
    { x: 5, y: -1 },
    { x: 5, y: 4 },
    { x: -1, y: 4 },
  ],
  at: (p) => p.x,
  levelLine: (z) => ({ point: { x: z, y: 0 }, direction: { x: 0, y: 1 } }),
};
const flat = (height: number): CeilingSource => ({
  ...slope,
  at: () => height,
  levelLine: undefined!,
});
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

test("height rule: full from 2 m, half from 1 m, nothing below", () => {
  const result = roomLivingResult({ points: square }, [slope]);
  near(result.grossArea, 12);
  // x < 1: 3 m² at 0, 1 ≤ x < 2: 3 m² at a half, x ≥ 2: 6 m² in full.
  near(result.livingArea, 7.5);
  assert.deepEqual(
    result.steps.map((s) => [s.rule, s.share]),
    [
      ["§ 4 Nr. 1", 1],
      ["§ 4 Nr. 2", 0.5],
      ["§ 4", 0],
    ],
  );
  near(
    result.steps.reduce((sum, s) => sum + s.area, 0),
    12,
  );
});

test("the floor build-up lowers the clear height", () => {
  // Heights shift by 0,5 m: 4,5 m² at 0, 3 m² at a half, 4,5 m² in full.
  near(roomLivingResult({ points: square, floorBuildUp: 0.5 }, [slope]).livingArea, 6);
});

test("exactly 2 m counts in full, exactly 1 m at a half", () => {
  near(roomLivingResult({ points: square }, [flat(2)]).livingArea, 12);
  near(roomLivingResult({ points: square }, [flat(1)]).livingArea, 6);
  near(roomLivingResult({ points: square }, [flat(0.99)]).livingArea, 0);
});

test("fixed shares ignore the height; a part without ceiling counts in full and says so", () => {
  const under = (livingArea: Parameters<typeof fixedShare>[0]) =>
    roomLivingResult({ points: square, ...(livingArea ? { livingArea } : {}) }, [flat(1.5)]);
  near(under({ use: "unheated" }).livingArea, 6);
  near(under({ use: "outdoor" }).livingArea, 3);
  near(under({ use: "outdoor", outdoorShare: 0.5 }).livingArea, 6);
  near(under({ use: "none" }).livingArea, 0);
  const open = roomLivingResult({ points: square }, []);
  near(open.livingArea, 12);
  assert.equal(open.notes.length, 1);
});

// W3, by hand.
const box = (x: number, y: number, w: number, h: number) => [
  { x, y },
  { x: x + w, y },
  { x: x + w, y: y + h },
  { x, y: y + h },
];
const blocker = (points: ReturnType<typeof box>) => ({ label: "Stütze", rule: "§ 3", points });

test("a blocker comes off where it stands, only its part inside the room", () => {
  near(
    roomLivingResult({ points: square }, [flat(2.5)], [blocker(box(1, 1, 0.5, 0.5))]).livingArea,
    11.75,
  );
  near(
    roomLivingResult({ points: square }, [flat(2.5)], [blocker(box(3, 1, 2, 1))]).livingArea,
    11,
  );
  // Under 1,50 m everything counts at a half, the column too.
  near(
    roomLivingResult({ points: square }, [flat(1.5)], [blocker(box(1, 1, 0.5, 0.5))]).livingArea,
    5.875,
  );
  // On the roof slope: 1 m² at x from 1 to 2 at a half, half a square metre comes off.
  near(roomLivingResult({ points: square }, [slope], [blocker(box(1, 1, 1, 1))]).livingArea, 7);
});

test("§ 3 Abs. 3: columns above 1,50 m and 0,1 m², stairs above three risers", () => {
  const shape = (width: number) => ({ kind: "rectangle" as const, width, depth: width });
  let p = addRoom(createStandardProject("p", "eg", "og"), { id: "r", points: square });
  const base = { position: { x: 1, y: 1 }, rotation: 0, baseOffset: 0 };
  p = addColumn(p, { ...base, id: "gross", shape: shape(0.5), height: 2.5 });
  p = addColumn(p, { ...base, id: "klein", shape: shape(0.3), height: 2.5 });
  p = addColumn(p, { ...base, id: "niedrig", shape: shape(0.5), height: 1.5 });
  const labels = () => storeyAreaBlockers(storeyOf(p)).map((b) => b.label);
  assert.deepEqual(labels(), ["Stütze"]);
  p = addStair(p, { id: "kurz", start: { x: 3, y: 1 }, height: 0.5, riserCount: 3 });
  assert.deepEqual(labels(), ["Stütze"]);
  p = addStair(p, { id: "lang", start: { x: 3, y: 1 }, height: 0.7, riserCount: 4 });
  assert.deepEqual(labels(), ["Stütze", "Treppe"]);
  const result = workingRoomLiving(p, room(p));
  assert.ok(result.steps.some((s) => s.rule === "§ 3 Abs. 3 Nr. 2" && s.area < 0));
});

test("corrections: at the fixed share, in a living room in full; never below zero", () => {
  const corrections = [
    { note: "Schornstein", area: -0.5 },
    { note: "Nische", area: 0.25 },
  ];
  const living = roomLivingResult({ points: square, livingArea: { use: "living", corrections } }, [
    flat(2.5),
  ]);
  near(living.livingArea, 11.75);
  assert.equal(living.steps.at(-1)!.label, "Nische");
  near(
    roomLivingResult({ points: square, livingArea: { use: "outdoor", corrections } }, [])
      .livingArea,
    2.9375,
  );
  const tooMuch = roomLivingResult(
    { points: square, livingArea: { use: "living", corrections: [{ note: "x", area: -20 }] } },
    [flat(2.5)],
  );
  near(tooMuch.livingArea, 0);
  assert.equal(tooMuch.notes.length, 1);
});

// W4.
const twoStoreys = () => {
  let p = addRoom(createStandardProject("p", "eg", "og"), {
    id: "b",
    number: "R-010",
    name: "Bad",
    points: box(0, 0, 2, 2),
  });
  p = addRoom(p, { id: "a", number: "R-002", name: "Küche; Essen", points: box(2, 0, 4, 3) });
  return addRoom(p, {
    id: "t",
    number: "R-001",
    name: "Terrasse",
    points: box(6, 0, 2, 2),
    livingArea: { use: "outdoor" },
  });
};

test("list: rooms in number order, sums add up, each room with its own result", () => {
  const schedule = livingSchedule(twoStoreys());
  assert.equal(schedule.storeys.length, 1);
  const [storey] = schedule.storeys;
  assert.deepEqual(
    storey!.rooms.map((r) => r.number),
    ["R-001", "R-002", "R-010"],
  );
  near(storey!.grossArea, 20);
  // 4 + 12 in full (no ceiling above), terrace 4 m² at a quarter.
  near(schedule.livingArea, 17);
  assert.equal(storey!.rooms[0]!.useLabel, "Balkon, Loggia, Dachgarten, Terrasse");
  assert.equal(schedule.rules.version, 1);
});

test("csv: a row per step, sums, rule set; semicolons in names are quoted", () => {
  const csv = livingScheduleCsv(livingSchedule(twoStoreys()));
  assert.ok(csv.startsWith("\uFEFFGeschoss;Nr.;Name;Raumart;Teilfläche"));
  assert.ok(csv.includes('"Küche; Essen"'));
  assert.ok(csv.includes("Summe Projekt;;;;;;20,00;;17,00"));
  assert.ok(csv.includes("Regelstand: WoFlV"));
  assert.ok(csv.includes("Balkon, Terrasse zu 25 %;§ 4 Nr. 4;4,00;25,00;1,00"));
});
