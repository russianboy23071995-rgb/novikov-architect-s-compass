import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addRailing, defaultRailingLayerId, updateRailing } from "./actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import {
  RAILING_MEMBERS,
  railingLength,
  railingMembers,
  type RailingMember,
} from "../../domain/elements/railing/model.ts";
import { railingBody } from "../../rendering/viewport/railing-solid.ts";
import { buildBuildingSolid } from "../../rendering/viewport/building-solid.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { previewDeleteSelection } from "../elements/delete.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import type { Project } from "../../domain/project/schema.ts";
import { selectionSummary } from "../../components/cad/demand-menu.ts";
import { railingSettings, railingToolDefaults, railingValues } from "./defaults.ts";
import { derivePlanScene, planSceneRuns } from "../../rendering/viewport/plan-scene.ts";

// docs/GELAENDER.md, L42 Teil G1.
const straight = [
  { x: 0, y: 0 },
  { x: 2.4, y: 0 },
];
const corner = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 1.5 },
];
const of = (members: RailingMember[], kind: RailingMember["kind"]) =>
  members.filter((m) => m.kind === kind);
const length = (m: RailingMember) => Math.hypot(m.end.x - m.start.x, m.end.y - m.start.y);
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

function withRailings(): Project {
  let p = createStandardProject("p", "eg", "og");
  p = addRailing(p, { id: "g1", points: straight });
  p = addRailing(p, { id: "g2", points: corner, infill: "panel", height: 1.1, renovation: "new" });
  return p;
}

test("members: posts at most the spacing apart, bars with gaps of at most 12 cm", () => {
  const members = railingMembers({
    points: straight,
    height: 1,
    baseOffset: 0,
    postSpacing: 1.2,
    infill: "bars",
  });
  const m = RAILING_MEMBERS;
  // 2,40 m at 1,20 m: two fields, three posts; one handrail and one bottom rail per field.
  assert.equal(of(members, "post").length, 3);
  assert.equal(of(members, "handrail").length, 1);
  assert.equal(of(members, "bottomRail").length, 2);
  const [handrail] = of(members, "handrail");
  assert.ok(near(handrail!.top, 1) && near(handrail!.bottom, 1 - m.handrail));
  assert.ok(of(members, "post").every((p) => near(p.bottom, 0) && near(p.top, 1 - m.handrail)));
  // Clear gaps along the line between posts and bars, field by field, never above 12 cm.
  const xs = (kind: RailingMember["kind"]) =>
    of(members, kind).map((b) => ({
      from: Math.min(b.start.x, b.end.x),
      to: Math.max(b.start.x, b.end.x),
    }));
  const solids = [...xs("post"), ...xs("bar")].sort((a, b) => a.from - b.from);
  for (let i = 0; i + 1 < solids.length; i++) {
    const gap = solids[i + 1]!.from - solids[i]!.to;
    assert.ok(gap <= m.barGap + 1e-9 && gap > 0, `gap ${gap}`);
  }
  // Bars stand on the bottom rail and end under the handrail.
  const bar = of(members, "bar")[0]!;
  assert.ok(near(bar.bottom, m.bottomRailLift + m.bottomRail) && near(bar.top, 1 - m.handrail));
});

test("members: a corner keeps one post and closes the handrail; panels per field", () => {
  const members = railingMembers({
    points: corner,
    height: 1.1,
    baseOffset: 0.2,
    postSpacing: 1.2,
    infill: "panel",
  });
  // 2,00 m → 2 fields, 1,50 m → 2 fields: posts 3 + 2 (the corner post only once).
  assert.equal(of(members, "post").length, 5);
  assert.equal(of(members, "panel").length, 4);
  assert.equal(of(members, "bar").length, 0);
  const rails = of(members, "handrail");
  // Both handrails run on by half their width at the inner point.
  assert.ok(near(length(rails[0]!), 2 + RAILING_MEMBERS.handrail / 2));
  assert.ok(near(length(rails[1]!), 1.5 + RAILING_MEMBERS.handrail / 2));
  assert.ok(near(rails[0]!.top, 1.3));
  const panel = of(members, "panel")[0]!;
  assert.ok(near(panel.bottom, 0.2 + RAILING_MEMBERS.panelGap));
  assert.ok(near(railingLength({ points: corner }), 3.5));
});

test("add: tool start values on the Geländer layer; invalid railings are refused", () => {
  const p = withRailings();
  const g1 = storeyOf(p).railings![0]!;
  assert.deepEqual(
    { ...g1, layerId: undefined },
    {
      id: "g1",
      points: straight,
      height: 1,
      baseOffset: 0,
      postSpacing: 1.2,
      infill: "bars",
      layerId: undefined,
    },
  );
  assert.equal(g1.layerId, defaultRailingLayerId(p));
  assert.equal(p.layers.find((l) => l.id === g1.layerId)!.name, "Geländer");
  const changed = updateRailing(p, "g1", { height: 0.9, postSpacing: 1 });
  assert.equal(storeyOf(changed).railings![0]!.height, 0.9);
  assert.throws(() => updateRailing(p, "x", { height: 1 }), /Unbekanntes Geländer/);
  assert.throws(() => updateRailing(p, "g1", { height: 5 }));
  assert.throws(() => updateRailing(p, "g1", { layerId: "missing" }), /Unknown layer/);
  assert.throws(
    () =>
      addRailing(p, {
        id: "g3",
        points: [
          { x: 0, y: 0 },
          { x: 0.005, y: 0 },
        ],
      }),
    /kürzer als 1 cm/,
  );
  assert.throws(() => addRailing(p, { id: "g3", points: [{ x: 0, y: 0 }] }));
  // Delete runs through the element registry.
  const removed = previewDeleteSelection(p, [{ kind: "railing", id: "g1" }], undefined).result;
  assert.deepEqual(
    storeyOf(removed).railings!.map((r) => r.id),
    ["g2"],
  );
});

test("schema 54: files round-trip; v53 files get the layer and refuse smuggled railings", () => {
  assert.equal(PROJECT_SCHEMA_VERSION, 54);
  const p = withRailings();
  const back = readProjectFile(serializeProject(p));
  assert.deepEqual(storeyOf(back).railings, storeyOf(p).railings);
  const stored = JSON.parse(serializeProject(createStandardProject("p", "eg", "og")));
  stored.layers = stored.layers.filter((l: { name: string }) => l.name !== "Geländer");
  const loaded = loadProjectData({ ...stored, schemaVersion: 53 });
  assert.equal(loaded.schemaVersion, 54);
  assert.ok(loaded.layers.some((l) => l.id === "layer:railing" && l.name === "Geländer"));
  // A project that keeps its Geländer layer is unchanged.
  const kept = loadProjectData({
    ...JSON.parse(serializeProject(createStandardProject("p", "eg", "og"))),
    schemaVersion: 53,
  });
  assert.equal(kept.layers.filter((l) => l.name === "Geländer").length, 1);
  const smuggled = JSON.parse(serializeProject(p));
  assert.throws(() => loadProjectData({ ...smuggled, schemaVersion: 53 }));
  assert.throws(() => loadProjectData({ ...smuggled, schemaVersion: 52 }));
});

test("3D: closed boxes per member on the storey floor, tagged as railing", () => {
  const body = railingBody(
    { id: "g", points: straight, height: 1, baseOffset: 0, postSpacing: 1.2, infill: "bars" },
    3,
  );
  const members = railingMembers({
    points: straight,
    height: 1,
    baseOffset: 0,
    postSpacing: 1.2,
    infill: "bars",
  });
  assert.equal(body.faces.length, members.length * 6);
  assert.ok(body.faces.every((f) => f.railing && f.vertices.every((v) => v[2] >= 3 - 1e-9)));
  assert.ok(Math.max(...body.faces.flatMap((f) => f.vertices.map((v) => v[2]))) <= 4 + 1e-9);
  const expected = members.reduce((n, m) => n + length(m) * m.width * (m.top - m.bottom), 0);
  assert.ok(near(body.volume, expected));
  const building = buildBuildingSolid(withRailings());
  assert.ok(building.faces.some((f) => f.railing && f.wallId === "g2"));
  // No railing face poses as a wall.
  assert.ok(building.faces.filter((f) => f.wallId === "g1").every((f) => f.railing));
});

test("IFC: IfcRailing GUARDRAIL with one swept member each, height and status", async () => {
  const ifc = await exportIfc(withRailings(), new Date("2026-11-04T12:00:00Z"));
  const lines = ifc.split("\n");
  assert.equal(lines.filter((l) => l.includes("=IFCRAILING(")).length, 2);
  assert.ok(lines.some((l) => l.includes("=IFCRAILING(") && l.includes(".GUARDRAIL.")));
  assert.ok(ifc.includes("'Pset_RailingCommon'"));
  assert.ok(ifc.includes("'Height',$,IFCPOSITIVELENGTHMEASURE(1.1)"));
  assert.ok(ifc.includes("'Status',$,IFCLABEL('NEW')"));
  assert.ok(ifc.includes("'Infill',$,IFCLABEL('panel')"));
  const members = railingMembers({
    points: corner,
    height: 1.1,
    baseOffset: 0,
    postSpacing: 1.2,
    infill: "panel",
  });
  const shape = lines.find(
    (l) =>
      l.includes("IFCSHAPEREPRESENTATION(") &&
      (l.match(/#\d+/g)?.length ?? 0) === members.length + 2, // own id, context, items
  );
  assert.ok(shape, "one body item per member");
});

// docs/GELAENDER.md, G2: tool settings and plan.
test("tool settings make a railing and read one back; the plan draws its posts", () => {
  const p = createStandardProject("p", "eg", "og");
  const defaults = railingToolDefaults(defaultRailingLayerId(p));
  assert.deepEqual(railingValues(defaults), {
    layerId: defaultRailingLayerId(p),
    height: 1,
    baseOffset: 0,
    postSpacing: 1.2,
    infill: "bars",
    renovation: "new",
  });
  const placed = addRailing(p, {
    id: "g",
    points: corner,
    ...railingValues({ ...defaults, infill: "panel", height: 0.9 }),
  });
  const back = railingSettings(storeyOf(placed).railings![0]!);
  assert.equal(back.infill, "panel");
  assert.equal(back.height, 0.9);
  const scene = derivePlanScene(placed, () => true);
  // 2,00 m and 1,50 m at 1,20 m: five posts, each a 4 × 4 cm square.
  const posts = scene.railingViews.get("g")!.posts;
  assert.equal(posts.length, 5);
  assert.ok(posts.every((c) => c.length === 4));
  assert.ok(planSceneRuns(scene, []).some((r) => r.kind === "railing" && r.ids[0] === "g"));
  // Hidden by its layer: neither drawn nor in a run.
  const hidden = derivePlanScene(placed, (id) => id !== "g");
  assert.equal(hidden.railings.size, 0);
});

test("menu summary: Geländer with infill, height and length", () => {
  assert.deepEqual(selectionSummary(withRailings(), { kind: "railing", id: "g2" }), {
    title: "Geländer",
    details: "Platte / Glas · Höhe 1,10 m · Länge 3,50 m",
  });
});
