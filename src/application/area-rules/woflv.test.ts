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
import { areaUseOf, fixedShare } from "./woflv.ts";

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
