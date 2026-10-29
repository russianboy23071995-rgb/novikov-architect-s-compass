import { PROJECT_SCHEMA_VERSION } from "../../project/format.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { wallBase, wallHeights } from "./heights.ts";
import { serializeProject, deserializeProject } from "../../../lib/bim/model.ts";
import { createProject } from "../../../application/projects/create.ts";
import { addWindow } from "../../../application/windows/actions.ts";
import { addWall, updateWall } from "../../../application/walls/actions.ts";
import { validateProject } from "../../project/schema.ts";
import { buildBuildingSolid } from "../../../rendering/viewport/building-solid.ts";
import { buildSolid } from "../../../rendering/viewport/storey-solid.ts";
import { storeyOf } from "../../storeys/access.ts";
import {
  addStorey,
  setStoreyHeight,
  setGroundDatum,
} from "../../../application/storeys/actions.ts";
import { selectWorkingStorey } from "../../../application/storeys/working-storey.ts";
import { windowSelectionSurfaces } from "../../../rendering/viewport/window-selection.ts";
import { movementCorners } from "../../../rendering/viewport/movement-origin.ts";
import { exportIfc } from "../../../lib/bim/ifc.ts";
import { prepareSelectionTranslation } from "../../../application/selection/storey-translation.ts";
import { selectionMoveSurfaces } from "../../../rendering/viewport/selection-move-preview.ts";
function fixture(offset = 0) {
  const p = addWall(createProject("p", "eg"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    thickness: 0.36,
    height: 2.8,
    baseOffset: offset,
  });
  return addWindow(p, {
    id: "win",
    wallId: "w",
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
  });
}
test("wall heights preserve signed offsets, reject overflow and precision collapse", () => {
  assert.deepEqual(wallHeights({ height: 2.8, baseOffset: -0.5 }, 3), { bottom: 2.5, top: 5.3 });
  assert.equal(wallBase({}), 0);
  for (const offset of [NaN, Infinity, -Infinity, Number.MAX_VALUE])
    assert.throws(() => fixture(offset));
});
test("V24 migrates at zero with identical material and rejects forged legacy offsets", () => {
  const p = fixture();
  const old = JSON.parse(serializeProject(p));
  old.schemaVersion = 24;
  delete old.storeys[0].walls[0].baseOffset;
  const restored = deserializeProject(JSON.stringify(old));
  assert.equal(restored.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.equal(wallBase(storeyOf(restored).walls[0]!), 0);
  assert.deepEqual(buildSolid(restored), buildSolid(p));
  old.storeys[0].walls[0].baseOffset = 2;
  assert.throws(() => deserializeProject(JSON.stringify(old)));
});
test("signed base offsets align material, windows, corners and project roundtrip", () => {
  for (const offset of [-1.2, 0, 0.7]) {
    const p = fixture(offset),
      s = buildSolid(p);
    assert.equal(s.min[2], offset);
    assert.equal(s.max[2], offset + 2.8);
    assert.equal(windowSelectionSurfaces(p, () => true)[0]!.vertices[0]![2], offset + 0.9);
    assert.ok(movementCorners(p).some((c) => c.point[2] === offset));
    assert.deepEqual(deserializeProject(serializeProject(p)), p);
    assert.ok(Math.abs(s.volume - buildSolid(fixture()).volume) < 1e-10);
  }
});
test("offset follows OG and KG storey levels while absolute datum remains annotation", () => {
  let p = fixture();
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: "eg", height: 3 });
  p = addStorey(p, p, { projectId: p.id, storeyId: "eg", side: "above", id: "og", height: 3.1 });
  p = addStorey(p, p, { projectId: p.id, storeyId: "eg", side: "below", id: "kg", height: 2.5 });
  for (const [id, z] of [
    ["og", 3],
    ["kg", -2.5],
  ] as const) {
    p = selectWorkingStorey(p, p, id);
    p = addWall(p, {
      id: id + "w",
      start: { x: 0, y: 0 },
      end: { x: 3, y: 0 },
      thickness: 0.36,
      height: 2.8,
      baseOffset: 0.4,
    });
    assert.equal(buildSolid(p).min[2], z + 0.4);
  }
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: "eg", height: 4 });
  p = selectWorkingStorey(p, p, "og");
  assert.equal(buildSolid(p).min[2], 4.4);
  const before = buildBuildingSolid(p);
  p = setGroundDatum(p, p, { projectId: p.id, storeyId: "eg", elevation: 100 });
  assert.deepEqual(buildBuildingSolid(p), before);
});
test("equal elevated corner keeps geometry; unequal foot heights reject and do not autojoin", () => {
  let p = fixture(0.5);
  p = addWall(p, {
    id: "b",
    start: { x: 3, y: 0 },
    end: { x: 3, y: 3 },
    thickness: 0.36,
    height: 2.8,
    baseOffset: 0.5,
  });
  assert.equal(storeyOf(p).wallJoins.length, 1);
  assert.equal(buildSolid(p).min[2], 0.5);
  assert.throws(() => updateWall(p, "b", { baseOffset: 0.6 }), /Fußhöhen/);
  const raw = structuredClone(p);
  storeyOf(raw).walls[1]!.baseOffset = 0.6;
  assert.throws(() => validateProject(raw), /Fußhöhen/);
  let free = fixture(0.5);
  free = addWall(free, {
    id: "b",
    start: { x: 3, y: 0 },
    end: { x: 3, y: 3 },
    thickness: 0.36,
    height: 2.8,
    baseOffset: 0.6,
  });
  assert.equal(storeyOf(free).wallJoins.length, 0);
  const action = prepareSelectionTranslation(p, ["w", "b"]),
    delta = { x: 1, y: 2 };
  const preview = selectionMoveSurfaces(buildBuildingSolid(p), p, action.evaluate(delta));
  assert.deepEqual(preview.faces, buildBuildingSolid(action.materialize(p, delta)).faces);
});
test("IFC wall placement carries signed offset once and opening stays relative to host", async () => {
  const p = fixture(-0.7),
    text = await exportIfc(p, new Date("2026-10-14T00:00:00Z"));
  const rows = new Map([...text.matchAll(/^(#\d+)=(.*);$/gm)].map((m) => [m[1]!, m[2]!]));
  const entity = (kind: string) => [...rows.values()].find((r) => r.startsWith(kind + "("))!;
  const placementZ = (ref: string): number => {
    const row = rows.get(ref)!;
    const refs = row.match(/#\d+/g)!;
    if (row.startsWith("IFCLOCALPLACEMENT")) return refs.reduce((sum, r) => sum + placementZ(r), 0);
    if (row.startsWith("IFCAXIS2PLACEMENT3D")) return placementZ(refs[0]!);
    if (row.startsWith("IFCCARTESIANPOINT"))
      return Number(row.match(/\(\((.*)\)\)/)![1]!.split(",")[2]);
    throw new Error(row);
  };
  const wallZ = placementZ(entity("IFCWALL").split(",")[5]!);
  const openingZ = placementZ(entity("IFCOPENINGELEMENT").split(",")[5]!);
  assert.equal(wallZ, -0.7);
  assert.ok(Math.abs(openingZ - 0.2) < 1e-10);
});

test("T connections require matching bases; equal signed offsets retain cut bodies", () => {
  let p = fixture(-0.5);
  p = addWall(p, {
    id: "b",
    start: { x: 1.5, y: -3 },
    end: { x: 1.5, y: 0 },
    thickness: 0.36,
    height: 2.8,
    baseOffset: -0.5,
  });
  const raw = structuredClone(p);
  storeyOf(raw).wallTJunctions = [{ hostWallId: "w", incoming: { wallId: "b", endpoint: 1 } }];
  const connected = validateProject(raw);
  assert.equal(buildSolid(connected).min[2], -0.5);
  storeyOf(raw).walls[1]!.baseOffset = 0;
  assert.throws(() => validateProject(raw), /Fußhöhen/);
});
test("prepared XY move ignores coincident join nodes at different heights", () => {
  let p = fixture();
  p = addWall(p, {
    id: "b",
    start: { x: 3, y: 0 },
    end: { x: 3, y: 3 },
    thickness: 0.36,
    height: 2.8,
  });
  p = addWall(p, {
    id: "c",
    start: { x: 4, y: 0 },
    end: { x: 6, y: 0 },
    thickness: 0.36,
    height: 2.8,
    baseOffset: 1,
  });
  const action = prepareSelectionTranslation(p, ["c"]),
    delta = { x: -1, y: 0 };
  const preview = selectionMoveSurfaces(buildBuildingSolid(p), p, action.evaluate(delta));
  assert.deepEqual(preview.faces, buildBuildingSolid(action.materialize(p, delta)).faces);
});

import { resolveWallHeightRule } from "./heights.ts";

test("storey binding ends at the own storey top plus extra height and follows storeys", () => {
  const rule = { kind: "storey", topOffset: -0.3 } as const;
  for (const floor of [-3, 0, 3]) {
    const result = resolveWallHeightRule({ baseOffset: 0.1 }, floor, rule, floor + 3);
    assert.ok(Math.abs(result.height - 2.6) < 1e-12);
    assert.ok(Math.abs(result.top - (floor + 2.7)) < 1e-12);
  }
  // Parapet: 0,50 m above OK raw floor of the storey above (user decision 29.10.2026).
  assert.equal(resolveWallHeightRule({}, 0, { kind: "storey", topOffset: 0.5 }, 3).height, 3.5);
  assert.equal(resolveWallHeightRule({}, 0, { kind: "storey", topOffset: 0 }, 4).height, 4);
});

test("fixed rule preserves legacy height regardless of storey levels", () => {
  assert.deepEqual(resolveWallHeightRule({ baseOffset: 0.5 }, 3, { kind: "fixed", height: 2.8 }), {
    bottom: 3.5,
    top: 6.3,
    height: 2.8,
  });
});

test("storey rule rejects missing, invalid or collapsed references instead of guessing", () => {
  const rule = { kind: "storey", topOffset: 0 } as const;
  assert.throws(() => resolveWallHeightRule({}, 0, rule));
  for (const upper of [0, -1, NaN, Infinity])
    assert.throws(() => resolveWallHeightRule({}, 0, rule, upper));
  for (const topOffset of [NaN, Infinity, -3])
    assert.throws(() => resolveWallHeightRule({}, 0, { ...rule, topOffset }, 3));
});

import { setWallHeightRule } from "../../../application/walls/height-binding.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
} from "../../../application/history/project-history.ts";
import { prepareZTranslation } from "../../../application/selection/z-translation.ts";
import {
  createAssetPreparation,
  restoreCheckedSnapshot,
} from "../../../interop/project-file/recovery-codec.ts";
function heightFixture() {
  let p = fixture();
  p = setStoreyHeight(p, p, { projectId: "p", storeyId: "eg", height: 3 });
  return addStorey(p, p, { projectId: "p", storeyId: "eg", side: "above", id: "og", height: 3 });
}
function bind(p: ReturnType<typeof heightFixture>) {
  return setWallHeightRule(p, p, {
    projectId: "p",
    storeyId: "eg",
    wallIds: ["w"],
    rule: { kind: "storey", topOffset: -0.2 },
  });
}
test("bound heights follow storeys atomically, serialize only source rule, undo and IFC agree", async () => {
  const p = bind(heightFixture());
  assert.equal(p.storeys[0]!.walls[0]!.height, 2.8);
  const changed = setStoreyHeight(p, p, { projectId: "p", storeyId: "eg", height: 4 });
  assert.equal(changed.storeys[0]!.walls[0]!.height, 3.8);
  assert.equal(buildBuildingSolid(changed).max[2], 3.8);
  assert.match(await exportIfc(changed), /'Height',\$,IFCLENGTHMEASURE\(3\.8\)/);
  const raw = JSON.parse(serializeProject(changed));
  assert.equal(raw.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.equal(raw.storeys[0].walls[0].height, undefined);
  assert.deepEqual(deserializeProject(JSON.stringify(raw)), changed);
  const h = commitProject(createHistory(p), changed);
  assert.equal(h.past.length, 1);
  assert.deepEqual(undoProject(h).present, p);
  assert.deepEqual(redoProject(undoProject(h)).present, changed);
  const before = serializeProject(changed);
  assert.throws(
    () => setStoreyHeight(changed, changed, { projectId: "p", storeyId: "eg", height: 2 }),
    /window|height/i,
  );
  assert.equal(serializeProject(changed), before);
});
test("V25 remains fixed; bound rule cannot be smuggled into old format; stale height is never authoritative", () => {
  const p = heightFixture();
  const raw = JSON.parse(serializeProject(p));
  raw.schemaVersion = 25;
  const restored = deserializeProject(JSON.stringify(raw));
  const taller = setStoreyHeight(restored, restored, { projectId: "p", storeyId: "eg", height: 4 });
  assert.equal(taller.storeys[0]!.walls[0]!.height, 2.8);
  raw.storeys[0].walls[0].topBinding = {
    kind: "slab-underside",
    storeyId: "og",
    slabThickness: 0.2,
    topOffset: 0,
  };
  assert.throws(() => deserializeProject(JSON.stringify(raw)));
  raw.schemaVersion = 26;
  raw.storeys[0].walls[0].height = 90;
  assert.equal(deserializeProject(JSON.stringify(raw)).storeys[0]!.walls[0]!.height, 2.8);
  const bound = bind(p);
  // A typed height releases the binding (user decision 29.10.2026).
  const released = updateWall(bound, "w", { height: 2.6 });
  assert.equal(released.storeys[0]!.walls[0]!.topBinding, undefined);
  assert.equal(released.storeys[0]!.walls[0]!.height, 2.6);
  assert.equal(
    updateWall(bound, "w", { height: 2.8 }).storeys[0]!.walls[0]!.topBinding?.kind,
    "storey",
  );
  const fixed = setWallHeightRule(bound, bound, {
    projectId: "p",
    storeyId: "eg",
    wallIds: ["w"],
    rule: { kind: "fixed", height: 2.7 },
  });
  assert.equal(fixed.storeys[0]!.walls[0]!.topBinding, undefined);
  assert.equal(fixed.storeys[0]!.walls[0]!.height, 2.7);
});
test("binding validates explicit context, needs a known storey height and survives insertion", () => {
  const p = bind(heightFixture());
  assert.throws(() => bind(fixture()), /Geschosshöhe/);
  // Only the own storey height is read (A08): a storey inserted above changes nothing.
  const inserted = addStorey(p, p, {
    projectId: "p",
    storeyId: "eg",
    side: "above",
    id: "mid",
    height: 3,
  });
  assert.equal(inserted.storeys[0]!.walls[0]!.height, 2.8);
  // The top storey can be bound too, e.g. a parapet 0,50 m above its storey top.
  let og = selectWorkingStorey(p, p, "og");
  og = addWall(og, {
    id: "attika",
    start: { x: 0, y: 5 },
    end: { x: 3, y: 5 },
    thickness: 0.24,
    height: 1,
  });
  const parapet = setWallHeightRule(og, og, {
    projectId: "p",
    storeyId: "og",
    wallIds: ["attika"],
    rule: { kind: "storey", topOffset: 0.5 },
  });
  assert.equal(parapet.storeys[1]!.walls[0]!.height, 3.5);
  assert.equal(buildBuildingSolid(parapet).max[2], 6.5);
  assert.throws(
    () =>
      setWallHeightRule(p, heightFixture(), {
        projectId: "p",
        storeyId: "eg",
        wallIds: ["w"],
        rule: { kind: "fixed", height: 3 },
      }),
    /kontext/i,
  );
  assert.throws(
    () =>
      setWallHeightRule(p, p, {
        projectId: "p",
        storeyId: "eg",
        wallIds: ["missing"],
        rule: { kind: "fixed", height: 3 },
      }),
    /Wandauswahl/,
  );
});
test("bound recovery and rigid Z preview preserve rule and full-path geometry", async () => {
  const p = bind(heightFixture());
  const codec = createAssetPreparation({ maxBytes: 1024, maxPixels: 1024 });
  const doc = await codec.prepare(p);
  assert.equal("height" in doc.model.storeys[0]!.walls[0]!, false);
  assert.deepEqual(await restoreCheckedSnapshot(doc), p);
  const targets = [{ kind: "wall", id: "w" }] as const;
  const action = prepareZTranslation(p, targets);
  const preview = action.evaluate(p, targets, 0.5);
  const moved = action.materialize(p, targets, 0.5);
  assert.equal(moved.storeys[0]!.walls[0]!.topBinding!.topOffset, -0.2 + 0.5);
  assert.equal(moved.storeys[0]!.walls[0]!.height, 2.8);
  assert.deepEqual(storeyOf(preview.geometry).walls, moved.storeys[0]!.walls);
});

test("connected bound walls resize together; mixed heights keep their join as a butt corner", () => {
  let p = heightFixture();
  p = addWall(p, {
    id: "b",
    start: { x: 3, y: 0 },
    end: { x: 3, y: 3 },
    thickness: 0.36,
    height: 2.8,
  });
  assert.equal(storeyOf(p).wallJoins.length, 1);
  const mixed = bind(p);
  // Mixed heights at a corner are a butt joint since 26.10.2026 (docs/WALL_JUNCTIONS.md).
  assert.doesNotThrow(() =>
    setStoreyHeight(mixed, mixed, { projectId: "p", storeyId: "eg", height: 4 }),
  );
  assert.equal(storeyOf(mixed).walls[0]!.height, 2.8);
  const bound = setWallHeightRule(p, p, {
    projectId: "p",
    storeyId: "eg",
    wallIds: ["w", "b"],
    rule: { kind: "storey", topOffset: -0.2 },
  });
  const taller = setStoreyHeight(bound, bound, { projectId: "p", storeyId: "eg", height: 4 });
  assert.equal(storeyOf(taller).wallJoins.length, 1);
  assert.ok(storeyOf(taller).walls.every((w) => w.height === 3.8));
  assert.equal(buildBuildingSolid(taller).max[2], 3.8);
  const datum = setGroundDatum(taller, taller, { projectId: "p", storeyId: "eg", elevation: 150 });
  assert.deepEqual(buildBuildingSolid(datum), buildBuildingSolid(taller));
  const targets = [
    { kind: "wall", id: "w" },
    { kind: "wall", id: "b" },
  ] as const;
  const action = prepareZTranslation(taller, targets);
  for (const delta of [-0.7, 0.5, 3.2]) {
    const preview = action.evaluate(taller, targets, delta);
    const result = action.materialize(taller, targets, delta);
    assert.deepEqual(storeyOf(preview.geometry).walls, storeyOf(result).walls);
  }
});

test("bound T junctions and prepared XY movement agree with committed geometry", () => {
  let p = heightFixture();
  p = addWall(p, {
    id: "b",
    start: { x: 1.5, y: -3 },
    end: { x: 1.5, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  const raw = structuredClone(p);
  storeyOf(raw).wallTJunctions = [{ hostWallId: "w", incoming: { wallId: "b", endpoint: 1 } }];
  p = validateProject(raw);
  p = setWallHeightRule(p, p, {
    projectId: "p",
    storeyId: "eg",
    wallIds: ["w", "b"],
    rule: { kind: "storey", topOffset: -0.2 },
  });
  p = setStoreyHeight(p, p, { projectId: "p", storeyId: "eg", height: 3.5 });
  const action = prepareSelectionTranslation(p, ["w", "b"]);
  const delta = { x: 2, y: -1 };
  assert.deepEqual(
    selectionMoveSurfaces(buildBuildingSolid(p), p, action.evaluate(delta)).faces,
    buildBuildingSolid(action.materialize(p, delta)).faces,
  );
  const z = prepareZTranslation(p, [
    { kind: "wall", id: "w" },
    { kind: "wall", id: "b" },
  ]);
  assert.deepEqual(
    selectionMoveSurfaces(
      buildBuildingSolid(p),
      p,
      z.evaluate(
        p,
        [
          { kind: "wall", id: "w" },
          { kind: "wall", id: "b" },
        ],
        0.5,
      ),
    ).faces,
    buildBuildingSolid(
      z.materialize(
        p,
        [
          { kind: "wall", id: "w" },
          { kind: "wall", id: "b" },
        ],
        0.5,
      ),
    ).faces,
  );
});

test("bound snapshots retain canonical content order through validation, file and recovery", async () => {
  const p = bind(heightFixture());
  assert.equal(JSON.stringify(validateProject(p)), JSON.stringify(p));
  assert.equal(JSON.stringify(deserializeProject(serializeProject(p))), JSON.stringify(p));
  const codec = createAssetPreparation({ maxBytes: 1024, maxPixels: 1024 });
  assert.equal(
    JSON.stringify(await restoreCheckedSnapshot(await codec.prepare(p))),
    JSON.stringify(p),
  );
  const history = createHistory(p);
  assert.equal(commitProject(history, deserializeProject(serializeProject(p))), history);
});

test("schema 29 slab bindings load as storey bindings with unchanged heights", () => {
  const p = bind(heightFixture());
  const raw = JSON.parse(serializeProject(p));
  const legacy = (topOffset: number, storeyId = "og") => ({
    kind: "slab-underside",
    storeyId,
    slabThickness: 0.25,
    topOffset,
  });
  for (const version of [26, 27, 28, 29]) {
    raw.schemaVersion = version;
    raw.storeys[0].walls[0].topBinding = legacy(-0.1);
    if (version < 29) for (const s of raw.storeys) delete s.slabs;
    if (version < 28) for (const s of raw.storeys) for (const w of s.windows) delete w.mark;
    const loaded = deserializeProject(JSON.stringify(raw));
    const wall = loaded.storeys[0]!.walls[0]!;
    assert.equal(loaded.schemaVersion, PROJECT_SCHEMA_VERSION);
    assert.deepEqual(wall.topBinding, { kind: "storey", topOffset: -0.1 - 0.25 });
    assert.equal(wall.height, 3 - 0.25 + -0.1);
  }
  raw.schemaVersion = 29;
  raw.storeys[0].walls[0].topBinding = legacy(0, "eg");
  assert.throws(() => deserializeProject(JSON.stringify(raw)), /darüberliegende Geschoss/);
  raw.storeys[0].walls[0].topBinding = { kind: "storey", topOffset: 0 };
  assert.throws(() => deserializeProject(JSON.stringify(raw)));
  raw.schemaVersion = PROJECT_SCHEMA_VERSION;
  raw.storeys[0].walls[0].topBinding = legacy(0);
  assert.throws(() => deserializeProject(JSON.stringify(raw)));
});
