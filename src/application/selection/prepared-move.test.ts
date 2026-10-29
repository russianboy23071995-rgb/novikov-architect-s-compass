import { storeyOf } from "../../domain/storeys/access.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../projects/create.ts";
import { validateProject, type Point } from "../../domain/project/schema.ts";
import { defaultHatchAppearance } from "../../domain/elements/hatch/model.ts";
import { fullSelectionMove } from "../../../benchmarks/selection-move-oracle.ts";
import { prepareTranslation } from "../../domain/project/prepared-translation.ts";
import { connectedWallSolids } from "../../domain/elements/wall/connections.ts";
import { wallPlanOutlines } from "../../rendering/viewport/wall-plan-outline.ts";
import { derivePlanScene, planSceneRuns } from "../../rendering/viewport/plan-scene.ts";
import { selectionIndex } from "./state.ts";
import { beginSelectionMove, previewSelectionGeometry, previewSelectionMove } from "./move.ts";

function fixture(extra = 0) {
  const p = createProject("prepared", "s");
  for (const [id, start, end] of [
    ["H", { x: 0, y: 0 }, { x: 10, y: 0 }],
    ["E", { x: 0, y: 0 }, { x: 0, y: 5 }],
    ["N", { x: 4, y: -3 }, { x: 4, y: 0 }],
    ["P", { x: 7, y: -3 }, { x: 7, y: 0 }],
    ["X", { x: 20, y: 0 }, { x: 22, y: 0 }],
  ] as const)
    storeyOf(p).walls.push({
      id,
      start,
      end,
      thickness: 0.36,
      height: 2.8,
      bodyOffset: 0.18,
      layerId: p.defaultLayerIds.wall,
    });
  storeyOf(p).wallJoins.push({
    first: { wallId: "H", endpoint: 0 },
    second: { wallId: "E", endpoint: 0 },
  });
  for (const wallId of ["N", "P"])
    storeyOf(p).wallTJunctions.push({ hostWallId: "H", incoming: { wallId, endpoint: 1 } });
  storeyOf(p).windows.push({
    id: "W",
    wallId: "H",
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
    layerId: p.defaultLayerIds.window,
  });
  storeyOf(p).hatches.push({
    id: "S",
    kind: "hatch",
    layerId: p.defaultLayerIds.line,
    points: [
      { x: 0, y: 10 },
      { x: 2, y: 10 },
      { x: 2, y: 11 },
    ],
    fill: { color: "#999999", opacity: 0.5 },
    ...defaultHatchAppearance,
  });
  p.assets.push({
    id: "asset",
    mimeType: "image/png",
    pixelWidth: 1,
    pixelHeight: 1,
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX5sAAAAASUVORK5CYII=",
  });
  storeyOf(p).references.push({
    id: "R",
    kind: "image-reference",
    assetId: "asset",
    layerId: p.defaultLayerIds.line,
    origin: { x: 10, y: 10 },
    rotation: 0.7,
    metresPerPixel: 1,
  });
  storeyOf(p).lines = Array.from({ length: extra + 1 }, (_, i) => ({
    id: i ? `unaffected-${i}` : "L",
    kind: "polyline" as const,
    points: [
      { x: i, y: 12 },
      { x: i + 2, y: 12 },
      { x: i + 2, y: 14 },
      { x: i, y: 12 },
    ],
    color: "#000000",
    penWidth: 0.25,
    style: "solid" as const,
    layerId: p.defaultLayerIds.line,
  }));
  return validateProject(p);
}

test("prepared mixed moves match the frozen full path, solids and seams for corner/T subsets", () => {
  const base = fixture();
  let seed = 1741;
  const random = () =>
    ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32 - 0.5) * 30;
  const deltas: Point[] = [
    { x: 0, y: 0 },
    { x: 2, y: -1 },
    { x: 1e-13, y: -1e-13 },
    ...Array.from({ length: 12 }, () => ({ x: random(), y: random() })),
  ];
  for (const ids of [
    ["H"],
    ["E"],
    ["N"],
    ["H", "E"],
    ["H", "N"],
    ["H", "E", "N", "P", "W"],
    ["L", "S", "R"],
    ["H", "L", "S", "R"],
  ]) {
    const targets = [...selectionIndex(base).values()].filter((t) => ids.includes(t.id));
    const session = beginSelectionMove(base, targets, { x: 0, y: 0 });
    for (const delta of deltas) {
      let expected;
      try {
        expected = fullSelectionMove(base, targets, delta);
      } catch {
        assert.throws(
          () => previewSelectionGeometry(session, base, targets, delta),
          `must reject ${ids} ${JSON.stringify(delta)}`,
        );
        continue;
      }
      const patch = previewSelectionGeometry(session, base, targets, delta);
      assert.deepEqual(previewSelectionMove(session, base, targets, delta), expected);
      for (const kind of ["walls", "windows", "hatches", "references", "lines"] as const)
        assert.deepEqual(
          storeyOf(patch.geometry)[kind],
          storeyOf(expected)[kind]?.filter((e) => patch.replacedIds.includes(e.id)),
        );
      const wallIds = new Set(storeyOf(patch.geometry).walls.map((w) => w.id));
      assert.deepEqual(
        connectedWallSolids(patch.geometry),
        connectedWallSolids(expected).filter((s) => wallIds.has(s.wallId)),
      );
      for (const visible of [wallIds, new Set([...wallIds].filter((id) => id !== "H"))]) {
        const all = wallPlanOutlines(expected, visible);
        assert.deepEqual(wallPlanOutlines(patch.geometry, visible), all);
      }
    }
  }
});

test("an unrelated endpoint arriving at a fixed join and a moved join arriving at an unrelated end are rejected", () => {
  const base = fixture();
  for (const [ids, delta] of [
    [["X"], { x: -20, y: 0 }],
    [["H", "E"], { x: 20, y: 0 }],
    [["N"], { x: -4, y: 0 }],
  ] as const) {
    const targets = [...selectionIndex(base).values()].filter((t) =>
      (ids as readonly string[]).includes(t.id),
    );
    assert.throws(() => fullSelectionMove(base, targets, delta), /Mehrfachanschluss/);
    const session = beginSelectionMove(base, targets, { x: 0, y: 0 });
    assert.throws(
      () => previewSelectionGeometry(session, base, targets, delta),
      /Mehrfachanschluss/,
    );
  }
});

test("pointer patches exclude unrelated data, retain asset/stationary object identities and are immutable", () => {
  const base = fixture(5000),
    targets = [
      { kind: "wall" as const, id: "H" },
      { kind: "reference" as const, id: "R" },
    ];
  const session = beginSelectionMove(base, targets, { x: 0, y: 0 });
  const a = previewSelectionGeometry(session, base, targets, { x: 1, y: -1 });
  const b = previewSelectionGeometry(session, base, targets, { x: 2, y: -2 });
  assert.equal(storeyOf(a.geometry).lines!.length, 0);
  assert.equal(storeyOf(a.geometry).walls.length, 4);
  assert.equal(a.geometry.assets, b.geometry.assets);
  assert.equal(storeyOf(a.geometry).windows, storeyOf(b.geometry).windows);
  assert.equal(storeyOf(a.geometry).walls[1], storeyOf(b.geometry).walls[1]);
  assert.equal(storeyOf(a.geometry).walls[1]!.id, "E");
  assert.throws(() => {
    storeyOf(a.geometry).walls[0]!.height = -1;
  });
  assert.throws(() => {
    a.geometry.assets[0]!.data = "AAAA";
  });
  assert.throws(() => {
    storeyOf(a.geometry).wallJoins.push(storeyOf(base).wallJoins[0]!);
  });
  assert.equal(storeyOf(base).wallJoins.length, 1);
  assert.equal(storeyOf(a.geometry).wallJoins.length, 0);
});

test("the owned preparation is isolated from caller mutation; full confirmation rejects changed base", () => {
  const base = fixture(),
    action = prepareTranslation(base, ["H"]);
  const a = action.evaluate({ x: 2, y: -1 });
  storeyOf(base).walls[4]!.height = 9;
  assert.deepEqual(action.evaluate({ x: 2, y: -1 }), a);
  assert.throws(() => action.materialize(base, { x: 2, y: -1 }), /Modell/);
  assert.throws(() => prepareTranslation(base, ["missing"]));
  assert.throws(() => prepareTranslation(base, ["W"]), /Fenster/);
});

test("numeric collapse, overflow and invalid coordinates agree with full validation", () => {
  const base = fixture();
  for (const id of ["H", "L", "S", "R"]) {
    const target = selectionIndex(base).get(id)!;
    const session = beginSelectionMove(base, [target], { x: 0, y: 0 });
    for (const delta of [
      { x: NaN, y: 1 },
      { x: Infinity, y: 0 },
      { x: 1e308, y: 1e308 },
      { x: 1e16, y: -1e16 },
    ]) {
      let expected;
      try {
        expected = fullSelectionMove(base, [target], delta);
      } catch {
        assert.throws(() => previewSelectionGeometry(session, base, [target], delta));
        continue;
      }
      assert.deepEqual(previewSelectionMove(session, base, [target], delta), expected);
    }
  }
});

test("scene runs preserve paint order and exclude hidden geometry without a second model", () => {
  const base = fixture(100),
    scene = derivePlanScene(base, (id) => id !== "P");
  const runs = planSceneRuns(scene, ["H", "N", "L"]);
  assert.deepEqual(
    runs.filter((r) => r.kind === "wall").flatMap((r) => r.ids),
    ["H", "E", "N", "X"],
  );
  assert.deepEqual(
    runs.filter((r) => r.affected).flatMap((r) => r.ids),
    ["H", "N", "L"],
  );
  assert.equal(runs.filter((r) => r.kind === "line").length, 2);
  assert.deepEqual(
    runs.filter((r) => r.kind === "line").flatMap((r) => r.ids),
    storeyOf(base).lines!.map((l) => l.id),
  );
});

test("detached chain end retains full renderer geometry, zero state and stale-context guards", async () => {
  const { connectedFixture } = await import("../../../benchmarks/connected-fixture.ts");
  const p = connectedFixture("chain", 25),
    targets = [{ kind: "wall" as const, id: "wall-0" }];
  const session = beginSelectionMove(p, targets, { x: 0, y: 0 });
  for (const point of [
    { x: -2, y: -2 },
    { x: -3, y: -1 },
    { x: 0, y: 0 },
  ]) {
    const patch = previewSelectionGeometry(session, p, targets, point),
      full = fullSelectionMove(p, targets, point);
    assert.deepEqual(connectedWallSolids(patch.geometry), connectedWallSolids(full));
    const visible = new Set(storeyOf(p).walls.map((w) => w.id));
    assert.deepEqual(wallPlanOutlines(patch.geometry, visible), wallPlanOutlines(full, visible));
    assert.deepEqual(
      derivePlanScene(patch.geometry, () => true).plan,
      derivePlanScene(full, () => true).plan,
    );
    assert.equal(patch.replacedIds.length, storeyOf(p).walls.length + storeyOf(p).windows.length);
    assert.equal(
      storeyOf(previewSelectionMove(session, p, targets, point)).wallJoins.length,
      storeyOf(full).wallJoins.length,
    );
  }
  assert.throws(() =>
    previewSelectionGeometry(session, validateProject(p), targets, { x: -2, y: -2 }),
  );
  assert.throws(() =>
    previewSelectionGeometry(session, p, [{ kind: "wall", id: "wall-1" }], { x: -2, y: -2 }),
  );
  assert.throws(() => previewSelectionGeometry(session, p, targets, { x: 4, y: 4 }));
});

test("single wall shared move preserves picked origins and legacy move geometry", async () => {
  const { connectedFixture } = await import("../../../benchmarks/connected-fixture.ts");
  const { editAtPointer } = await import("../direct-edit/session.ts");
  for (const kind of ["chain", "tees"] as const) {
    const base = connectedFixture(kind, 5),
      target = { kind: "wall" as const, id: "wall-0" },
      wall = storeyOf(base).walls[0]!;
    for (const origin of [wall.start, wall.end, { x: wall.start.x, y: wall.start.y + 0.18 }]) {
      const session = beginSelectionMove(base, [target], origin),
        point = { x: origin.x - 2, y: origin.y - 2 };
      const legacy = editAtPointer(
        { base, target, action: "move", index: 0, anchor: origin },
        base,
        point,
      );
      assert.deepEqual(previewSelectionMove(session, base, [target], point), legacy);
      assert.deepEqual(session.origin, origin);
      assert.throws(() =>
        previewSelectionGeometry(session, validateProject(base), [target], point),
      );
    }
  }
});
