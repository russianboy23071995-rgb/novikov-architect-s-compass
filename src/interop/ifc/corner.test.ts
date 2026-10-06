import test from "node:test";
import assert from "node:assert/strict";
import { addWall, addWindow, createProject } from "../../lib/bim/model.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { exportCornerIfc } from "./corner.ts";
import { writeIfc } from "./writer.ts";
const date = new Date("2026-10-05T00:00:00Z");
const targets = [
  { wallId: "A", endpoint: 1 as const },
  { wallId: "B", endpoint: 0 as const },
] as const;
function fixture() {
  let p = createProject("p", "s");
  for (const wall of [
    { id: "A", start: { x: 0, y: 0 }, end: { x: 3, y: 0 } },
    { id: "B", start: { x: 3, y: 0 }, end: { x: 3, y: 3 } },
    { id: "C", start: { x: 8, y: 0 }, end: { x: 11, y: 0 } },
  ])
    p = addWall(p, { ...wall, thickness: 0.36, height: 2.8 });
  p.storey.wallJoins = []; // Explicit acceptance path, independent from automatic joins.
  return addWindow(p, {
    id: "window",
    wallId: "A",
    width: 1.2,
    height: 1.35,
    sillHeight: 0.9,
    position: 0.5,
  });
}
const rows = (s: string, type: string) => s.split("\n").filter((l) => l.includes(`=${type}(`));
const identities = (s: string) =>
  [...s.matchAll(/^#\d+=IFC\w+\('([0-3][0-9A-Za-z_$]{21})'/gm)].map((m) => m[1]).sort();
test("explicit corner uses two closed profiles; unrelated wall and opening stay rectangular", async () => {
  const p = fixture(),
    before = structuredClone(p),
    s = await exportCornerIfc(p, ...targets, date);
  assert.equal(rows(s, "IFCARBITRARYCLOSEDPROFILEDEF").length, 2);
  assert.equal(rows(s, "IFCRECTANGLEPROFILEDEF").length, 2);
  assert.equal(rows(s, "IFCRELVOIDSELEMENT").length, 1);
  assert.equal(rows(s, "IFCRELFILLSELEMENT").length, 1);
  for (const line of rows(s, "IFCPOLYLINE")) {
    const refs = [...line.split("=")[1]!.matchAll(/#\d+/g)].map((m) => m[0]);
    assert.equal(refs.length, 5);
    assert.equal(refs[0], refs[4]);
    assert.equal(new Set(refs).size, 4);
  }
  assert.deepEqual(p, before);
  const normal = await exportIfc(p, date);
  assert.equal(rows(normal, "IFCARBITRARYCLOSEDPROFILEDEF").length, 0);
  assert.equal(rows(normal, "IFCRECTANGLEPROFILEDEF").length, 4);
  assert.deepEqual(identities(s), identities(normal));
  assert.equal(await exportCornerIfc(p, targets[1], targets[0], date), s);
  assert.equal(await exportCornerIfc(JSON.parse(JSON.stringify(p)), ...targets, date), s);
});
test("corner IFC snapshots input and date before asynchronous GUID hashing", async () => {
  const p = fixture(),
    d = new Date(date),
    expected = await exportCornerIfc(p, ...targets, d);
  const pending = exportCornerIfc(p, ...targets, d);
  p.storey.walls[0]!.height = 7;
  p.storey.windows[0]!.width = 0.5;
  d.setFullYear(2040);
  assert.equal(await pending, expected);
});
test("unsupported openings and invalid target fail without fallback geometry", async () => {
  const p = fixture();
  await assert.rejects(exportCornerIfc(p, { wallId: "missing", endpoint: 0 }, targets[1], date));
  p.storey.windows[0]!.position = 2.22 / 3;
  await assert.rejects(exportCornerIfc(p, ...targets, date), /touching/);
  p.storey.windows[0]!.position = 0.79;
  await assert.rejects(exportCornerIfc(p, ...targets, date), /outside/);
  p.storey.walls[0]!.height = -1;
  await assert.rejects(exportCornerIfc(p, ...targets, date));
});
test("shared writer rejects unknown and invalid profile overrides", async () => {
  const ccw = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 0.36 },
    { x: 0, y: 0.36 },
  ];
  await assert.rejects(
    writeIfc(fixture(), date, new Map([["missing", ccw]])),
    /Invalid IFC wall profile/,
  );
  await assert.rejects(
    writeIfc(fixture(), date, new Map([["A", [...ccw].reverse()]])),
    /Invalid IFC wall profile/,
  );
  await assert.rejects(
    writeIfc(fixture(), date, new Map([["A", [ccw[0]!, ccw[2]!, ccw[1]!, ccw[3]!]]])),
    /Invalid IFC wall profile/,
  );
});
