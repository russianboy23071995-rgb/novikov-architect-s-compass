import { storeyOf } from "../../domain/storeys/access.ts";
import { createPointPreview } from "../tools/point-preview.ts";
import { previewCreateReference } from "../references/actions.ts";
import { previewSelectionCommand, applySelectionCommand } from "../commands/selection-command.ts";
import { imageReferenceCorners } from "../../rendering/viewport/image-reference.ts";
import { editAtPointer } from "../../lib/bim/direct-edit.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  addWall,
  addWindow,
  serializeProject,
  deserializeProject,
} from "../../lib/bim/model.ts";
import { createDrawing, defaultHatchFill } from "../drawing/actions.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { beginSelectionMove, previewSelectionMove, selectionMoveInteraction } from "./move.ts";
import { selectionIndex } from "./state.ts";
import { previewTConnection } from "../walls/t-connections.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
import { confirmInteraction } from "../tools/interaction.ts";
import { connectedWallContours } from "../../domain/elements/wall/connections.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
const origin = { x: 0, y: 0 },
  target = { x: 2, y: -1 };
for (const kind of ["line", "hatch"] as const)
  test(`single ${kind} shared interaction preserves picked origin, full-path result and atomic history`, () => {
    const p = fixture();
    p.hatchPatterns.push({
      id: "diagonal",
      name: "Diagonal",
      width: 1,
      height: 1,
      lines: [{ start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }],
    });
    storeyOf(p).hatches[0]!.pattern = {
      patternId: "diagonal",
      mode: "model",
      origin: { x: 3.25, y: 4.75 },
      rotation: 35,
    };
    const selected = { kind, id: kind === "line" ? "L" : "S" };
    const anchor = { x: -4, y: 7 };
    const point = { x: -2, y: 6 };
    const policy = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
    const before = serializeProject(p);
    let history = createHistory(p),
      cancels = 0,
      commits = 0;
    const make = () =>
      selectionMoveInteraction(
        beginSelectionMove(p, [selected], anchor, policy),
        p,
        [selected],
        policy,
        (next) => {
          history = commitProject(history, next);
          commits++;
        },
        () => cancels++,
      );
    const cancelled = make();
    assert.deepEqual(cancelled.origin, anchor);
    cancelled.geometryPreview!.evaluate(point);
    cancelled.cancel();
    assert.equal(cancels, 1);
    assert.equal(commits, 0);
    assert.equal(serializeProject(p), before);
    const adapter = make();
    assert.equal(adapter.click, "confirm");
    const expected = editAtPointer(
      { base: p, target: selected, action: "move", index: null, anchor },
      p,
      point,
    );
    const patch = adapter.geometryPreview!.evaluate(point);
    assert.deepEqual(
      storeyOf(patch.geometry)[kind === "line" ? "lines" : "hatches"]?.[0],
      storeyOf(expected)[kind === "line" ? "lines" : "hatches"]?.[0],
    );
    adapter.confirm!(point);
    assert.equal(commits, 1);
    assert.deepEqual(history.present, expected);
    assert.deepEqual(deserializeProject(serializeProject(history.present)), expected);
    history = undoProject(history);
    assert.equal(serializeProject(history.present), before);
    history = redoProject(history);
    assert.deepEqual(history.present, expected);
  });
function fixture() {
  let p = createProject("p", "s");
  for (const [id, start, end] of [
    ["H", { x: 0, y: 0 }, { x: 6, y: 0 }],
    ["E", { x: 0, y: 0 }, { x: 0, y: 3 }],
    ["N", { x: 3, y: -3 }, { x: 3, y: 0 }],
  ] as const)
    p = addWall(p, { id, start, end, thickness: 0.36, height: 2.8, bodyOffset: 0.18 });
  p = previewTConnection(p, p, {
    projectId: p.id,
    kind: "connect",
    relation: { hostWallId: "H", incoming: { wallId: "N", endpoint: 1 } },
  });
  p = addWindow(p, {
    id: "F",
    wallId: "H",
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
  });
  p = createDrawing(p, p, "L", {
    kind: "line",
    lineKind: "polyline",
    points: [
      { x: 0, y: 4 },
      { x: 2, y: 4 },
      { x: 2, y: 5 },
      { x: 0, y: 4 },
    ],
    appearance: defaultLineAppearance,
  });
  return createDrawing(p, p, "S", {
    kind: "hatch",
    points: [
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 5 },
    ],
    fill: defaultHatchFill,
  });
}
for (const mode of ["model", "paper"] as const)
  for (const coordinate of [0, 1e9])
    test(`hatch translation preserves exact pattern delta: ${mode}, coordinate ${coordinate}`, () => {
      const p = fixture();
      p.hatchPatterns.push({
        id: "translation-pattern",
        name: "Translation",
        width: 1,
        height: 1,
        lines: [{ start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }],
      });
      const hatch = storeyOf(p).hatches[0]!;
      hatch.points = [
        { x: coordinate + 10, y: coordinate },
        { x: coordinate + 18, y: coordinate },
        { x: coordinate + 18, y: coordinate + 8 },
        { x: coordinate + 10, y: coordinate + 8 },
      ];
      hatch.pattern = {
        patternId: "translation-pattern",
        origin: { x: coordinate + 0.13, y: coordinate + 0.27 },
        rotation: 37,
        ...(mode === "model"
          ? { mode, modelWidthMetres: 0.75 }
          : { mode, paperWidthMetres: 0.003 }),
      };
      const target = { kind: "hatch" as const, id: hatch.id };
      const anchor = { x: -2.25, y: 1.75 };
      const before = serializeProject(p);
      for (const action of ["move", "x", "y"] as const)
        for (const metres of [-0.68, 0, 0.68]) {
          const point = {
            x: anchor.x + (action === "y" ? 0 : metres),
            y: anchor.y + (action === "x" ? 0 : metres),
          };
          const delta = { x: point.x - anchor.x, y: point.y - anchor.y };
          const legacy = editAtPointer({ base: p, target, action, index: null, anchor }, p, point);
          const session = beginSelectionMove(p, [target], anchor);
          const patch = previewSelectionGeometry(session, p, [target], point);
          const shared = previewSelectionMove(session, p, [target], point);
          assert.deepEqual(shared, legacy);
          const actual = storeyOf(patch.geometry).hatches[0]!;
          assert.deepEqual(actual, storeyOf(legacy).hatches[0]);
          assert.deepEqual(actual.pattern, {
            ...hatch.pattern,
            origin: { x: hatch.pattern.origin.x + delta.x, y: hatch.pattern.origin.y + delta.y },
          });
          assert.deepEqual(deserializeProject(serializeProject(shared)), shared);
          const history = createHistory(p),
            committed = commitProject(history, shared);
          assert.equal(committed.past.length, metres === 0 ? 0 : 1);
          assert.deepEqual(undoProject(committed).present, p);
          if (metres !== 0) assert.deepEqual(redoProject(undoProject(committed)).present, shared);
          assert.equal(serializeProject(p), before);
        }
    });
test("atomic mixed translation keeps internal corner/T, host window parameters and source snapshot", () => {
  const p = fixture(),
    targets = [...selectionIndex(p).values()],
    before = serializeProject(p);
  const session = beginSelectionMove(p, targets, origin);
  const moved = previewSelectionMove(session, p, [...targets].reverse(), target);
  assert.deepEqual(storeyOf(moved).wallJoins, storeyOf(p).wallJoins);
  assert.deepEqual(storeyOf(moved).wallTJunctions, storeyOf(p).wallTJunctions);
  assert.deepEqual(storeyOf(moved).windows, storeyOf(p).windows);
  for (const wall of storeyOf(moved).walls) {
    const old = storeyOf(p).walls.find((w) => w.id === wall.id)!;
    assert.deepEqual(wall.start, { x: old.start.x + 2, y: old.start.y - 1 });
    assert.deepEqual(wall.end, { x: old.end.x + 2, y: old.end.y - 1 });
  }
  assert.deepEqual(storeyOf(moved).lines![0]!.points[0], { x: 2, y: 3 });
  assert.deepEqual(storeyOf(moved).hatches[0]!.points[0], { x: 5, y: 3 });
  const contours = connectedWallContours(moved);
  for (const [id, points] of connectedWallContours(p))
    points.forEach((point, i) => {
      assert.ok(Math.abs(contours.get(id)![i]!.x - point.x - 2) < 1e-9);
      assert.ok(Math.abs(contours.get(id)![i]!.y - point.y + 1) < 1e-9);
    });
  assert.equal(serializeProject(p), before);
});
test("only external relationships detach; unselected host windows follow exactly once", () => {
  const p = fixture(),
    all = [...selectionIndex(p).values()];
  for (const [ids, corners, tees] of [
    [["H", "E"], 1, 0],
    [["H", "N"], 0, 1],
    [["L", "S"], 1, 1],
  ] as const) {
    const targets = all.filter((t) => (ids as readonly string[]).includes(t.id));
    const next = previewSelectionMove(beginSelectionMove(p, targets, origin), p, targets, target);
    assert.equal(storeyOf(next).wallJoins.length, corners);
    assert.equal(storeyOf(next).wallTJunctions.length, tees);
    assert.deepEqual(storeyOf(next).windows, storeyOf(p).windows);
    for (const wall of storeyOf(p).walls.filter((w) => !(ids as readonly string[]).includes(w.id)))
      assert.deepEqual(
        storeyOf(next).walls.find((w) => w.id === wall.id),
        wall,
      );
  }
});
test("unsupported window mixtures, invalid IDs, duplicate IDs, stale selection/model and hidden layers fail atomically", () => {
  const p = fixture(),
    all = [...selectionIndex(p).values()],
    before = serializeProject(p);
  assert.throws(
    () =>
      beginSelectionMove(
        p,
        all.filter((t) => t.id === "F" || t.id === "L"),
        origin,
      ),
    /Fenster/,
  );
  assert.throws(() => beginSelectionMove(p, [{ kind: "wall", id: "missing" }], origin));
  assert.throws(() => beginSelectionMove(p, [all[0]!, all[0]!], origin));
  assert.throws(() => beginSelectionMove(p, [], origin));
  assert.throws(() => beginSelectionMove(p, all, { x: NaN, y: 0 }));
  const session = beginSelectionMove(p, all, origin);
  assert.throws(() => previewSelectionMove(session, { ...p }, all, target));
  assert.throws(() => previewSelectionMove(session, p, all.slice(1), target));
  assert.throws(() => previewSelectionMove(session, p, all, { x: Infinity, y: 0 }));
  assert.throws(() =>
    previewSelectionMove(
      session,
      p,
      all,
      target,
      createLayerVisibilityPolicy(p, {
        scope: { kind: "bim-project" },
        hiddenLayerIds: [storeyOf(p).hatches[0]!.layerId],
      }),
    ),
  );
  assert.equal(serializeProject(p), before);
  assert.equal(previewSelectionMove(session, p, all, origin), p);
});
test("group snap policy excludes all moving geometry and host dependencies but pins common origin", () => {
  const p = fixture(),
    targets = [...selectionIndex(p).values()].filter((t) => ["H", "E"].includes(t.id));
  const s = beginSelectionMove(p, targets, origin);
  const refs = ["H", "E", "F", "N", "L"].map((entityId) => ({
    entityId,
    feature: "start",
    point: origin,
  }));
  assert.deepEqual(
    s.snapping.sources(refs).map((r) => r.entityId),
    ["N", "L"],
  );
  assert.equal(
    s.snapping.sources([
      {
        entityId: "intersection",
        feature: "point",
        point: origin,
        dependencies: [refs[0]!, refs[3]!],
      },
    ]).length,
    0,
  );
  assert.deepEqual(s.snapping.origin.point, origin);
});
test("shared input and click produce same snapshot, one undo/redo, zero displacement has no history", async () => {
  const history = createHistory(fixture()),
    p = history.present,
    targets = [...selectionIndex(p).values()];
  const session = beginSelectionMove(p, targets, origin);
  let result = p;
  const adapter = selectionMoveInteraction(
    session,
    p,
    targets,
    createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE),
    (next) => {
      result = next;
    },
    () => {},
  );
  const numeric = adapter.preview("90", "2", null);
  confirmInteraction(adapter, numeric.point);
  assert.deepEqual(result, previewSelectionMove(session, p, targets, numeric.point));
  const committed = commitProject(history, result);
  assert.equal(committed.past.length, 1);
  assert.deepEqual(undoProject(committed).present, p);
  assert.deepEqual(redoProject(undoProject(committed)).present, result);
  assert.equal(commitProject(history, previewSelectionMove(session, p, targets, origin)), history);
  const restored = deserializeProject(serializeProject(result));
  assert.deepEqual(buildSolid(restored), buildSolid(result));
  const stamp = new Date("2026-10-06T12:00:00Z");
  assert.equal(await exportIfc(restored, stamp), await exportIfc(result, stamp));
});

function imageFixture() {
  const p = fixture();
  return previewCreateReference(p, p, {
    projectId: p.id,
    asset: { id: "asset", mimeType: "image/png", pixelWidth: 400, pixelHeight: 200, data: "AAAA" },
    reference: {
      id: "image",
      kind: "image-reference",
      assetId: "asset",
      layerId: p.defaultLayerIds.line,
      origin: { x: 10, y: 12 },
      rotation: 0.7,
      metresPerPixel: 0.0125,
    },
  });
}
test("image movement uses shared origin/input, preserves calibration and is one reversible portable commit", () => {
  const p = imageFixture(),
    targets = [{ kind: "reference" as const, id: "image" }],
    v = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE),
    s = beginSelectionMove(p, targets, origin, v);
  let next = p;
  const adapter = selectionMoveInteraction(
    s,
    p,
    targets,
    v,
    (n) => (next = n),
    () => {},
  );
  const aim = adapter.preview("0", "2", null);
  confirmInteraction(adapter, aim.point);
  assert.deepEqual(storeyOf(next).references[0], {
    ...storeyOf(p).references[0],
    origin: { x: 12, y: 12 },
  });
  assert.deepEqual(next.assets, p.assets);
  assert.deepEqual(storeyOf(next).walls, storeyOf(p).walls);
  const before = imageReferenceCorners(storeyOf(p).references[0]!, p.assets[0]!);
  imageReferenceCorners(storeyOf(next).references[0]!, next.assets[0]!).forEach((c, i) => {
    assert.ok(Math.abs(c.x - before[i]!.x - 2) < 1e-10);
    assert.equal(c.y, before[i]!.y);
  });
  const command = previewSelectionCommand(p, targets, v, "Auswahl um 2 m bei 0 Grad verschieben");
  assert.deepEqual(applySelectionCommand(p, targets, v, command), next);
  assert.deepEqual(s.snapping.origin.point, origin);
  assert.equal(
    s.snapping.sources([{ entityId: "image", feature: "point", point: origin }]).length,
    0,
  );
  const h = commitProject(createHistory(p), next);
  assert.equal(h.past.length, 1);
  assert.deepEqual(undoProject(h).present, p);
  assert.deepEqual(redoProject(undoProject(h)).present, next);
  assert.deepEqual(deserializeProject(serializeProject(next)), next);
});
test("mixed image and BIM move is atomic with host windows and joins retained", () => {
  const p = imageFixture(),
    targets = [...selectionIndex(p).values()];
  const next = previewSelectionMove(beginSelectionMove(p, targets, origin), p, targets, target);
  assert.deepEqual(storeyOf(next).references[0]!.origin, { x: 12, y: 11 });
  assert.deepEqual(storeyOf(next).wallJoins, storeyOf(p).wallJoins);
  assert.deepEqual(storeyOf(next).wallTJunctions, storeyOf(p).wallTJunctions);
  assert.deepEqual(storeyOf(next).windows, storeyOf(p).windows);
  assert.deepEqual(storeyOf(next).walls[0]!.start, { x: 2, y: -1 });
  assert.deepEqual(storeyOf(p).references[0]!.origin, { x: 10, y: 12 });
});
test("image movement rejects hidden/stale/nonfinite targets and an unaccompanied window", () => {
  const p = imageFixture(),
    targets = [{ kind: "reference" as const, id: "image" }],
    s = beginSelectionMove(p, targets, origin);
  const hidden = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [p.defaultLayerIds.line],
  });
  assert.throws(() => beginSelectionMove(p, targets, origin, hidden));
  assert.throws(() => previewSelectionMove(s, p, targets, target, hidden));
  assert.throws(() => previewSelectionMove(s, { ...p }, targets, target));
  assert.throws(() => previewSelectionMove(s, p, [], target));
  assert.throws(() => previewSelectionMove(s, p, targets, { x: Infinity, y: 0 }));
  assert.throws(() => beginSelectionMove(p, [...targets, { kind: "window", id: "F" }], origin));
  assert.equal(previewSelectionMove(s, p, targets, origin), p);
});

test("point preview shares one evaluation, copies coordinates and drops failed or cleared results", () => {
  let calls = 0,
    allowed = true;
  const preview = createPointPreview(
    (point) => {
      calls++;
      if (!Number.isFinite(point.x)) throw new Error("invalid target");
      return { ...point };
    },
    () => {
      if (!allowed) throw new Error("stale");
    },
  );
  const point = { x: 2, y: 3 };
  const first = preview.get(point);
  assert.equal(preview.get({ ...point }), first);
  assert.equal(calls, 1);
  point.x = 4;
  assert.deepEqual(preview.get(point), point);
  assert.equal(calls, 2);
  assert.throws(() => preview.get({ x: Infinity, y: 0 }), /invalid target/);
  preview.get(point);
  assert.equal(calls, 4);
  allowed = false;
  assert.throws(() => preview.get(point), /stale/);
  allowed = true;
  preview.get(point);
  assert.equal(calls, 5);
  preview.clear();
  preview.get(point);
  assert.equal(calls, 6);
});

test("precision and plan share a group preview; confirmation ignores altered presentation data", () => {
  const p = fixture(),
    targets = [...selectionIndex(p).values()];
  const v = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const session = beginSelectionMove(p, targets, origin, v);
  let result = p;
  const adapter = selectionMoveInteraction(
    session,
    p,
    targets,
    v,
    (next) => {
      result = next;
    },
    () => {},
  );
  const precision = adapter.preview("90", "2", null);
  const first = adapter.geometryPreview!.evaluate(precision.point);
  assert.equal(adapter.geometryPreview!.evaluate({ ...precision.point }), first);
  // A changed numeric target must derive different geometry.
  const changed = adapter.preview("90", "3", null);
  assert.notEqual(adapter.geometryPreview!.evaluate(changed.point), first);
  const displayed = adapter.geometryPreview!.evaluate(changed.point);
  assert.throws(() => {
    storeyOf(displayed.geometry).walls[0]!.height = -1;
  });
  confirmInteraction(adapter, changed.point);
  assert.deepEqual(result, previewSelectionMove(session, p, targets, changed.point, v));
  assert.ok(storeyOf(result).walls[0]!.height > 0);
  assert.notEqual(adapter.geometryPreview!.evaluate(changed.point), displayed);
  const beforeCancel = adapter.geometryPreview!.evaluate(changed.point);
  adapter.cancel();
  assert.notEqual(adapter.geometryPreview!.evaluate(changed.point), beforeCancel);
});

test("group preview reuse is scoped to model, selection, visibility and origin", () => {
  const p = fixture(),
    targets = [...selectionIndex(p).values()];
  const visible = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const session = beginSelectionMove(p, targets, origin, visible);
  const make = (base = p, selected = targets, policy = visible, move = session) =>
    selectionMoveInteraction(
      move,
      base,
      selected,
      policy,
      () => {},
      () => {},
    );
  const a = make(),
    first = a.geometryPreview!.evaluate(target);
  assert.notEqual(make().geometryPreview!.evaluate(target), first);
  assert.throws(() => make({ ...p }).geometryPreview!.evaluate(target));
  assert.throws(() => make(p, targets.slice(1)).geometryPreview!.evaluate(target));
  const hidden = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [storeyOf(p).hatches[0]!.layerId],
  });
  assert.throws(() => make(p, targets, hidden).geometryPreview!.evaluate(target));
  const otherOrigin = beginSelectionMove(p, targets, { x: 10, y: 10 }, visible);
  assert.notDeepEqual(
    make(p, targets, visible, otherOrigin).geometryPreview!.evaluate(target),
    first,
  );
  // Guard the retained hit even if the caller mutates its selection or origin.
  const removed = targets.pop()!;
  assert.throws(() => a.geometryPreview!.evaluate(target));
  targets.push(removed);
  assert.notEqual(a.geometryPreview!.evaluate(target), first);
  session.origin.x++;
  assert.throws(() => a.geometryPreview!.evaluate(target));
  assert.throws(() => confirmInteraction(a, target));
  assert.throws(() => a.commit(target));
});

test("unconstrained mouse input preserves the exact snapped target for plan reuse", () => {
  const p = fixture(),
    targets = [...selectionIndex(p).values()];
  const v = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const adapter = selectionMoveInteraction(
    beginSelectionMove(p, targets, origin, v),
    p,
    targets,
    v,
    () => {},
    () => {},
  );
  for (const point of [
    { x: 22.8, y: -15.3 },
    { x: 46.3, y: -27 },
    { x: 48.6, y: -28.2 },
  ]) {
    const precision = adapter.preview("", "", point);
    assert.deepEqual(precision.point, point);
    assert.equal(
      adapter.geometryPreview!.evaluate(precision.point),
      adapter.geometryPreview!.evaluate(point),
    );
  }
});

test("atomic selection confirmation rejects invalid or mutated context before publishing", () => {
  for (const defect of ["coordinate", "model", "selection", "origin"] as const) {
    const p = fixture(),
      targets = [...selectionIndex(p).values()];
    const policy = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
    const session = beginSelectionMove(p, targets, origin, policy);
    let commits = 0;
    const adapter = selectionMoveInteraction(
      session,
      p,
      targets,
      policy,
      () => {
        commits++;
      },
      () => {},
    );
    adapter.geometryPreview!.evaluate(target);
    if (defect === "model") storeyOf(p).walls[0]!.height = -1;
    if (defect === "selection") targets.pop();
    if (defect === "origin") session.origin.x++;
    assert.throws(() =>
      confirmInteraction(adapter, defect === "coordinate" ? { x: Infinity, y: 0 } : target),
    );
    assert.equal(commits, 0);
  }
});

test("atomic publication failure propagates and a later confirmation revalidates the base", () => {
  const p = fixture(),
    targets = [...selectionIndex(p).values()];
  const policy = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  let calls = 0;
  const adapter = selectionMoveInteraction(
    beginSelectionMove(p, targets, origin, policy),
    p,
    targets,
    policy,
    () => {
      calls++;
      throw new Error("stale publication context");
    },
    () => {},
  );
  assert.throws(() => confirmInteraction(adapter, target), /stale publication context/);
  assert.equal(calls, 1);
  storeyOf(p).walls[0]!.height = -1;
  assert.throws(() => confirmInteraction(adapter, target));
  assert.equal(calls, 1);
});

import { setStoreyHeight, addStorey } from "../storeys/actions.ts";
import { selectWorkingStorey } from "../storeys/working-storey.ts";
import { previewSelectionGeometry } from "./move.ts";
import { eligibleSelection, selectTargets } from "./state.ts";
function multiFixture() {
  let p = fixture();
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: p.groundStoreyId, height: 3 });
  p = addStorey(p, p, {
    projectId: p.id,
    storeyId: p.groundStoreyId,
    id: "og",
    side: "above",
    height: 3,
  });
  p = selectWorkingStorey(p, p, "og");
  p = addWall(p, {
    id: "OG-W",
    start: { x: 0, y: 0 },
    end: { x: 5, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  p = addWindow(p, {
    id: "OG-F",
    wallId: "OG-W",
    width: 1,
    height: 1,
    sillHeight: 1,
    position: 0.5,
  });
  return selectWorkingStorey(p, p, p.groundStoreyId);
}
test("multi-storey selection and movement compose per-storey rules atomically with one Undo", async () => {
  const p = multiFixture(),
    before = serializeProject(p);
  const targets = [...selectionIndex(p).values()].filter((t) =>
    ["H", "N", "OG-W", "OG-F"].includes(t.id),
  );
  const policy = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  assert.equal(eligibleSelection(p, policy, targets).length, 4);
  assert.equal(selectTargets(targets, [{ kind: "wall", id: "OG-W" }], "toggle").length, 3);
  const session = beginSelectionMove(p, targets, origin, policy);
  const patch = previewSelectionGeometry(session, p, targets, target, policy);
  const moved = previewSelectionMove(session, p, targets, target, policy);
  for (const id of [p.groundStoreyId, "og"]) {
    const a = moved.storeys.find((s) => s.id === id)!,
      b = p.storeys.find((s) => s.id === id)!;
    assert.deepEqual(a.windows, b.windows);
    for (const wall of b.walls.filter((w) => targets.some((t) => t.id === w.id)))
      assert.deepEqual(a.walls.find((w) => w.id === wall.id)!.start, {
        x: wall.start.x + 2,
        y: wall.start.y - 1,
      });
  }
  assert.equal(storeyOf(moved).wallTJunctions.length, 1);
  assert.deepEqual(
    storeyOf(patch.geometry).walls,
    storeyOf(moved).walls.filter((w) => patch.replacedIds.includes(w.id)),
  );
  let history = commitProject(createHistory(p), moved);
  assert.equal(history.past.length, 1);
  history = undoProject(history);
  assert.equal(serializeProject(history.present), before);
  history = redoProject(history);
  assert.equal(serializeProject(history.present), serializeProject(moved));
  assert.equal(
    serializeProject(deserializeProject(serializeProject(moved))),
    serializeProject(moved),
  );
  assert.equal(await exportIfc(history.present, new Date(0)), await exportIfc(moved, new Date(0)));
  assert.equal(serializeProject(p), before);
  assert.throws(() => previewSelectionMove(session, moved, targets, target), /geändert/);
  assert.throws(() => beginSelectionMove(p, [{ kind: "window", id: "OG-F" }], origin), /zusammen/);
  const hidden = createLayerVisibilityPolicy(p, {
    ...ALL_LAYERS_VISIBLE,
    hiddenLayerIds: [p.storeys[1]!.walls[0]!.layerId],
  });
  assert.throws(() => previewSelectionMove(session, p, targets, target, hidden), /sichtbar/);
});
test("failed multi-storey preview and cancellation never publish a partial floor", () => {
  const p = multiFixture(),
    before = serializeProject(p);
  const targets = [
    { kind: "wall" as const, id: "H" },
    { kind: "wall" as const, id: "OG-W" },
  ];
  const policy = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const session = beginSelectionMove(p, targets, origin, policy);
  let commits = 0,
    cancels = 0;
  const interaction = selectionMoveInteraction(
    session,
    p,
    targets,
    policy,
    () => commits++,
    () => cancels++,
  );
  assert.throws(() => interaction.confirm!({ x: Infinity, y: 0 }));
  assert.equal(commits, 0);
  interaction.cancel();
  assert.equal(cancels, 1);
  assert.equal(serializeProject(p), before);
  const command = previewSelectionCommand(
    p,
    targets,
    policy,
    "Auswahl um 2 m bei 0 Grad verschieben",
  );
  assert.equal(command.result.storeys.find((s) => s.id === "og")!.walls[0]!.start.x, 2);
});

import { buildBuildingSolid } from "../../lib/bim/geometry.ts";
import {
  selectionMoveSurfaces,
  selectionMoveWindows,
} from "../../rendering/viewport/selection-move-preview.ts";
import { buildingWindowSelectionSurfaces } from "../../rendering/viewport/window-selection.ts";
import {
  selectionMovementAxes,
  horizontalAxisDegrees,
  WORLD_MOVEMENT_AXES,
} from "../input/movement-axes.ts";
import { precisionTarget } from "../input/precision.ts";
test("prepared 3D multi-storey preview equals complete committed geometry including windows and detached neighbours", () => {
  const p = multiFixture();
  const targets = [
    { kind: "wall" as const, id: "H" },
    { kind: "wall" as const, id: "OG-W" },
  ];
  const session = beginSelectionMove(p, targets, origin);
  const patch = previewSelectionGeometry(session, p, targets, target);
  const next = previewSelectionMove(session, p, targets, target);
  const faces = (
    value: ReturnType<typeof buildBuildingSolid> | ReturnType<typeof selectionMoveSurfaces>,
  ) => value.faces.map((f) => JSON.stringify(f)).sort();
  assert.deepEqual(
    faces(selectionMoveSurfaces(buildBuildingSolid(p), p, patch)),
    faces(buildBuildingSolid(next)),
  );
  const windows = (v: ReturnType<typeof buildingWindowSelectionSurfaces>) =>
    v.map((w) => JSON.stringify(w)).sort();
  assert.deepEqual(
    windows(
      selectionMoveWindows(
        buildingWindowSelectionSurfaces(p, () => true),
        p,
        patch,
        () => true,
      ),
    ),
    windows(buildingWindowSelectionSurfaces(next, () => true)),
  );
  assert.equal(patch.storeyPatches?.length, 2);
});
test("movement axis contract supports XYZ but horizontal adapter rejects Z and follows oblique walls", () => {
  let p = multiFixture();
  p = addWall(p, {
    id: "diagonal",
    start: { x: 10, y: 10 },
    end: { x: 13, y: 14 },
    thickness: 0.36,
    height: 2.8,
  });
  const targets = [{ kind: "wall" as const, id: "diagonal" }];
  const axes = selectionMovementAxes(p, targets);
  const axis = axes.find((a) => a.id === "diagonal")!;
  assert.deepEqual(axis.direction, [0.6, 0.8, 0]);
  const degrees = horizontalAxisDegrees(axis);
  const point = precisionTarget({ x: 10, y: 10 }, null, String(degrees), "5").point;
  assert.ok(Math.abs(point.x - 13) < 1e-10 && Math.abs(point.y - 14) < 1e-10);
  assert.equal(horizontalAxisDegrees(WORLD_MOVEMENT_AXES[0]!), 0);
  assert.equal(horizontalAxisDegrees(WORLD_MOVEMENT_AXES[1]!), 90);
  assert.throws(() => horizontalAxisDegrees(WORLD_MOVEMENT_AXES[2]!), /Höhenaktion/);
  const session = beginSelectionMove(p, targets, { x: 10, y: 10 });
  assert.ok(session.snapping.origin.directions?.some((d) => d.x === 0.6 && d.y === 0.8));
  const next = previewSelectionMove(session, p, targets, point);
  assert.ok(Math.abs(storeyOf(next).walls.find((w) => w.id === "diagonal")!.start.x - 13) < 1e-10);
});
