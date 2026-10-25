import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../../lib/bim/model.ts";
import { addWall } from "../../application/walls/actions.ts";
import { buildBuildingSolid } from "../../lib/bim/geometry.ts";
import { addDoor } from "../../application/doors/actions.ts";
import { DOOR_DEFAULTS } from "../../domain/elements/door/model.ts";
import { DOOR_LEAF_THICKNESS, doorLeafFaces } from "./door-leaf.ts";

function project(opensTo: "left" | "right") {
  const walled = addWall(createProject("p", "eg"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 4, y: 0 },
    thickness: 0.24,
    height: 2.8,
  });
  return addDoor(walled, {
    id: "d",
    wallId: "w",
    position: 0.5,
    ...DOOR_DEFAULTS,
    zOffset: 0.1,
    opensTo,
  });
}
const range = (faces: ReturnType<typeof doorLeafFaces>, axis: 0 | 1 | 2) => {
  const values = faces.flatMap((f) => f.vertices.map((v) => v[axis]));
  return [Math.min(...values), Math.max(...values)].map((v) => +v.toFixed(9));
};

test("the closed leaf fills the opening flush with the wall face on the swing side", () => {
  const left = doorLeafFaces(project("left"), () => true);
  assert.equal(left.length, 6);
  assert.ok(left.every((f) => f.wallId === "d"));
  assert.deepEqual(range(left, 0), [1.495, 2.505]);
  assert.deepEqual(range(left, 2), [0.1, 2.235]);
  assert.deepEqual(range(left, 1), [+(0.12 - DOOR_LEAF_THICKNESS).toFixed(9), 0.12]);
  const right = doorLeafFaces(project("right"), () => true);
  assert.deepEqual(range(right, 1), [-0.12, +(-0.12 + DOOR_LEAF_THICKNESS).toFixed(9)]);
});

test("leaves follow door and host visibility and never enter the wall solid", () => {
  const p = project("left");
  assert.equal(doorLeafFaces(p, (id) => id !== "d").length, 0);
  assert.equal(doorLeafFaces(p, (id) => id !== "w").length, 0);
  assert.ok(buildBuildingSolid(p).faces.every((f) => f.wallId === "w"));
});
