import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addWall } from "./actions.ts";
import { setWallHeightRule } from "./height-binding.ts";
import { prepareZTranslation } from "../selection/z-translation.ts";
import { addStorey } from "../storeys/actions.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { deserializeProject, serializeProject } from "../../lib/bim/model.ts";
import type { Project } from "../../domain/project/schema.ts";

// docs/MEHRGESCHOSS.md, M1.
const wallOf = (p: Project) => p.storeys.flatMap((s) => s.walls).find((w) => w.id === "w")!;
function threeStoreys(): Project {
  let p = createStandardProject("p", "eg", "og");
  p = addStorey(p, p, {
    projectId: p.id,
    storeyId: p.storeys.at(-1)!.id,
    side: "above",
    id: "dg",
    height: 2.5,
  });
  return addWall(p, {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    thickness: 0.3,
    height: 2.5,
  });
}
const bind = (p: Project, storeys: number, topOffset = 0) =>
  setWallHeightRule(p, p, {
    projectId: p.id,
    storeyId: p.storeys.find((s) => s.walls.some((w) => w.id === "w"))!.id,
    wallIds: ["w"],
    rule: { kind: "storey", topOffset, storeys },
  });

test("a wall bound over two storeys ends at OK raw floor two storeys up", () => {
  const p = threeStoreys();
  const [eg, og] = p.storeys;
  const one = bind(p, 1);
  assert.equal(wallOf(one).height, eg!.height);
  assert.equal("storeys" in wallOf(one).topBinding!, false);
  const two = bind(p, 2, 0.5);
  assert.equal(wallOf(two).height, eg!.height! + og!.height! + 0.5);
  assert.deepEqual(wallOf(two).topBinding, { kind: "storey", topOffset: 0.5, storeys: 2 });
  const back = deserializeProject(serializeProject(two));
  assert.deepEqual(wallOf(back).topBinding, wallOf(two).topBinding);
  assert.equal(wallOf(back).height, wallOf(two).height);
});

test("past the top storey is refused; a changed storey height moves the top", () => {
  const p = threeStoreys();
  assert.throws(() => bind(p, 4), /oberste Geschoss/);
  const three = bind(p, 3);
  const total = p.storeys.reduce((sum, s) => sum + s.height!, 0);
  assert.ok(Math.abs(wallOf(three).height - total) < 1e-9);
});

test("a vertical move keeps the span and shifts the extra height", () => {
  const p = bind(threeStoreys(), 2);
  const targets = [{ kind: "wall" as const, id: "w" }];
  const moved = prepareZTranslation(p, targets).materialize(p, targets, 0.2);
  assert.equal(wallOf(moved).topBinding?.storeys, 2);
  assert.equal(wallOf(moved).topBinding?.topOffset, 0.2);
  assert.ok(Math.abs(wallOf(moved).height - wallOf(p).height) < 1e-9);
});

test("file 65: loads unchanged, a wall over several storeys is refused", () => {
  const p = bind(threeStoreys(), 2);
  const old = JSON.parse(serializeProject(p));
  old.schemaVersion = 65;
  assert.throws(() => deserializeProject(JSON.stringify(old)));
  for (const s of old.storeys)
    for (const w of s.walls) if (w.topBinding) delete w.topBinding.storeys;
  assert.equal(deserializeProject(JSON.stringify(old)).schemaVersion, PROJECT_SCHEMA_VERSION);
});
