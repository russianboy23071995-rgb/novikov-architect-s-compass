import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../../lib/bim/model.ts";
import { addWall, updateWall } from "../walls/actions.ts";
import { createHistory, commitProject } from "../../lib/bim/history.ts";
import { DOOR_DEFAULTS } from "../../domain/elements/door/model.ts";
import { addDoor } from "../doors/actions.ts";
import { projectSnapPrimitives } from "./project-references.ts";

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
