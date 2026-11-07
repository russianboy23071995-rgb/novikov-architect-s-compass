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
import { guestWalls } from "../../domain/elements/wall/guests.ts";
import { derivePlanScene, planSceneRuns } from "../../rendering/viewport/plan-scene.ts";
import { projectSnapReferences } from "../snapping/project-references.ts";
import { selectWorkingStorey } from "../storeys/working-storey.ts";
import { snapPointLabel } from "../snapping/point-label.ts";
import { addWindow } from "../windows/actions.ts";
import { addSection } from "../sections/actions.ts";
import { sectionDrawing } from "../../rendering/viewport/section-drawing.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { buildBuildingSolid } from "../../rendering/viewport/building-solid.ts";

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

// M2: guests in the plan of the storeys a wall passes.
const working = (p: Project, index: number) => selectWorkingStorey(p, p, p.storeys[index]!.id);
const guestIds = (p: Project) => guestWalls(p).map((g) => g.wall.id);

test("guests: a wall over two storeys shows in the first upper storey, not above or at home", () => {
  const p = bind(threeStoreys(), 2);
  assert.deepEqual(guestIds(working(p, 0)), []);
  assert.deepEqual(guestIds(working(p, 1)), ["w"]);
  // The cut of the third storey lies 1 m above its floor at 7 m; the wall ends at 6 m.
  assert.deepEqual(guestIds(working(p, 2)), []);
  const og = working(p, 1);
  const scene = derivePlanScene(og, () => true);
  const runs = planSceneRuns(scene, []);
  assert.deepEqual(
    runs.filter((r) => r.kind === "guestWall").flatMap((r) => r.ids),
    ["w"],
  );
  assert.equal(scene.guests.get("w")!.storeyName, p.storeys[0]!.name);
  // Hidden layers hide guests too.
  assert.deepEqual(
    guestWalls(og, (id) => id !== "w").map((g) => g.wall.id),
    [],
  );
});

test("guests: a fixed tall wall counts too; corners of a guest are snap targets", () => {
  const p = threeStoreys();
  const tall = setWallHeightRule(p, p, {
    projectId: p.id,
    storeyId: p.storeys[0]!.id,
    wallIds: ["w"],
    rule: { kind: "fixed", height: p.storeys[0]!.height! + 1.5 },
  });
  const og = working(tall, 1);
  assert.deepEqual(guestIds(og), ["w"]);
  const exact = setWallHeightRule(p, p, {
    projectId: p.id,
    storeyId: p.storeys[0]!.id,
    wallIds: ["w"],
    rule: { kind: "fixed", height: p.storeys[0]!.height! + 1 },
  });
  // Ending exactly at the cut does not pass it.
  assert.deepEqual(guestIds(working(exact, 1)), []);
  const refs = projectSnapReferences(og).filter((r) => r.entityId === "w");
  assert.ok(refs.some((r) => r.feature === "vertex-0"));
  assert.equal(snapPointLabel(og, "w", "vertex-0"), `Wand aus ${p.storeys[0]!.name} · Ecke 1`);
});

// M4: windows over storeys.
test("windows: one above the home storey shows as a guest opening upstairs, not at home", () => {
  let p = bind(threeStoreys(), 2);
  const eg = p.storeys[0]!.height!;
  p = addWindow(p, {
    id: "unten",
    wallId: "w",
    position: 0.25,
    width: 1,
    height: 1.3,
    sillHeight: 0.9,
  });
  p = addWindow(p, {
    id: "oben",
    wallId: "w",
    position: 0.75,
    width: 1.2,
    height: 1.4,
    sillHeight: eg + 0.9,
  });
  const home = derivePlanScene(working(p, 0), () => true);
  assert.deepEqual(
    (home.openings.get("w") ?? []).map((o) => o.id),
    ["unten"],
  );
  const og = derivePlanScene(working(p, 1), () => true);
  const guest = og.guests.get("w")!;
  assert.deepEqual(
    guest.openings.map((o) => o.id),
    ["oben"],
  );
  // 1,2 m wide along the wall, as thick as the wall.
  const [a, b, , d] = guest.openings[0]!.ring;
  assert.ok(Math.abs(Math.hypot(b!.x - a!.x, b!.y - a!.y) - 1.2) < 1e-9);
  assert.ok(Math.abs(Math.hypot(d!.x - a!.x, d!.y - a!.y) - 0.3) < 1e-9);
});

// M5: exactly stacked walls meet in one plane, so 3D shows no step between them.
test("stacked walls: the side faces of both storeys lie in the same planes", () => {
  let p = createStandardProject("p", "eg", "og");
  const line = { start: { x: 0, y: 0 }, end: { x: 5, y: 0 }, thickness: 0.3 };
  p = addWall(p, { id: "unten", ...line, height: p.storeys[0]!.height! });
  p = selectWorkingStorey(p, p, p.storeys[1]!.id);
  p = addWall(p, { id: "oben", ...line, height: p.storeys[1]!.height! });
  const faces = buildBuildingSolid(p).faces;
  const sides = (id: string) =>
    faces
      .filter((f) => f.wallId === id && Math.abs(f.normal[2]) < 1e-9 && Math.abs(f.normal[1]) > 0.5)
      .map((f) => Math.round(f.vertices[0]![1] * 1e6) / 1e6)
      .sort();
  assert.deepEqual(sides("unten"), sides("oben"));
  const top = Math.max(
    ...faces.filter((f) => f.wallId === "unten").flatMap((f) => f.vertices.map((v) => v[2])),
  );
  const bottom = Math.min(
    ...faces.filter((f) => f.wallId === "oben").flatMap((f) => f.vertices.map((v) => v[2])),
  );
  assert.ok(Math.abs(top - bottom) < 1e-9, `${top} ${bottom}`);
});

// M6: section and IFC carry the wall through all its storeys.
test("section and IFC: one cut over the whole height, one IFC wall in its own storey", async () => {
  let p = bind(threeStoreys(), 2);
  const height = wallOf(p).height;
  p = addSection(p, { id: "s", start: { x: 3, y: -2 }, end: { x: 3, y: 2 }, look: "left" });
  const cut = sectionDrawing(
    p,
    p.sections!.find((s) => s.id === "s")!,
  ).cuts.find((c) => c.id === "w")!;
  const ys = cut.loops.flat().map((q) => q.y);
  assert.equal(cut.loops.length, 1);
  assert.ok(Math.abs(Math.min(...ys)) < 1e-6 && Math.abs(Math.max(...ys) - height) < 1e-6);
  const ifc = await exportIfc(p, new Date("2026-11-07T12:00:00Z"));
  const walls = ifc.split("\n").filter((l) => l.includes("=IFCWALL("));
  assert.equal(walls.length, 1);
  assert.ok(ifc.includes(`IFCEXTRUDEDAREASOLID(`) && ifc.includes(`,${height}.);`));
  const ground = /#(\d+)=IFCBUILDINGSTOREY\([^,]*,\$,'Erdgeschoss'/.exec(ifc)![1];
  const wallRef = /#(\d+)=IFCWALL\(/.exec(ifc)![1];
  assert.ok(
    new RegExp(`IFCRELCONTAINEDINSPATIALSTRUCTURE\\([^;]*#${wallRef}[,)][^;]*#${ground}\\);`).test(
      ifc,
    ),
  );
});
