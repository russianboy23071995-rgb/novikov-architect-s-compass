import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../projects/create.ts";
import { addWall, updateWall } from "../walls/actions.ts";
import { createHistory, commitProject } from "../history/project-history.ts";
import { DOOR_DEFAULTS } from "../../domain/elements/door/model.ts";
import { addDoor } from "../doors/actions.ts";
import { projectSnapPrimitives } from "./project-references.ts";
import { snapPointLabel } from "./point-label.ts";
import { addSlab } from "../slabs/actions.ts";
import { createDrawing, defaultHatchFill } from "../drawing/actions.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";

function project() {
  const walled = addWall(createProject("p", "eg"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 4, y: 0 },
    thickness: 0.24,
    height: 2.8,
  });
  return addDoor(walled, { id: "d", wallId: "w", position: 0.5, ...DOOR_DEFAULTS });
}
const jambs = (p: Parameters<typeof projectSnapPrimitives>[0]) =>
  projectSnapPrimitives(p).references.filter((r) => r.entityId === "d");

test("each door offers its four jamb corners on both wall faces", () => {
  const refs = jambs(project());
  assert.deepEqual(
    refs.map((r) => [r.feature, +r.point.x.toFixed(9), +r.point.y.toFixed(9)]),
    [
      ["jamb-start--1", 1.495, -0.12],
      ["jamb-start-1", 1.495, 0.12],
      ["jamb-end--1", 2.505, -0.12],
      ["jamb-end-1", 2.505, 0.12],
    ],
  );
});

test("jamb parts are reused for an unchanged door and wall, and follow a changed wall", () => {
  const h0 = createHistory(project());
  const first = jambs(h0.present);
  const relabelled = commitProject(h0, { ...h0.present, id: h0.present.id });
  assert.equal(jambs(relabelled.present)[0], first[0]);
  const thicker = commitProject(h0, updateWall(h0.present, "w", { thickness: 0.3 }));
  const moved = jambs(thicker.present);
  assert.notEqual(moved[0], first[0]);
  assert.equal(+moved[0]!.point.y.toFixed(9), -0.15);
});

test("snapped element points are named „Element · Ecke n“ instead of „Endpunkt“", () => {
  const base = project();
  const withSlab = addSlab(base, {
    id: "s",
    points: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
    ],
    thickness: 0.2,
    topOffset: 0,
  });
  const withHatch = createDrawing(withSlab, withSlab, "h", {
    kind: "hatch",
    points: [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
    fill: defaultHatchFill,
  });
  const p = createDrawing(withHatch, withHatch, "l", {
    kind: "line",
    lineKind: "polyline",
    points: [
      { x: 0, y: 5 },
      { x: 2, y: 5 },
      { x: 2, y: 6 },
      { x: 0, y: 5 },
    ],
    appearance: defaultLineAppearance,
  });
  const cases: [string | null, string, string | null][] = [
    ["s", "vertex-2", "Decke · Ecke 3"],
    ["h", "vertex-0", "Schraffur · Ecke 1"],
    ["l", "vertex-1", "Linie · Punkt 2"],
    // The repeated end of a closed polyline is its first point.
    ["l", "vertex-3", "Linie · Punkt 1"],
    ["w", "axis-start", "Wand · Anfang"],
    ["w", "axis-end", "Wand · Ende"],
    ["w", "corner-1--1", "Wand · Ecke Ende"],
    ["w", "join-corner-0-1", "Wand · Ecke Anfang"],
    ["d", "jamb-start-1", "Tür · Laibung"],
    ["@drawing-start", "first", "Startpunkt"],
    ["@drawing-origin", "start", "Letzter Punkt"],
    ["unknown", "vertex-0", null],
    [null, "grid", null],
  ];
  for (const [id, feature, label] of cases)
    assert.equal(snapPointLabel(p, id, feature), label, `${id} ${feature}`);
  // Every element corner the snap engine offers gets a name.
  for (const ref of projectSnapPrimitives(p).references.filter((r) =>
    r.feature.startsWith("vertex-"),
  ))
    assert.match(snapPointLabel(p, ref.entityId, ref.feature)!, /· (Ecke|Punkt) \d+$/);
});
