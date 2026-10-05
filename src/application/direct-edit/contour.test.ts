import test from "node:test";
import assert from "node:assert/strict";
import { boundedEdgeTarget } from "./contour.ts";
import { createProject, addLine } from "../../lib/bim/model.ts";
import type { EditSession } from "../../lib/bim/direct-edit.ts";
const rectangle = (height: number) => [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: height },
  { x: 0, y: height },
  { x: 0, y: 0 },
];
const base = () =>
  addLine(createProject("p", "s"), {
    id: "line",
    kind: "polyline",
    points: rectangle(3),
    color: "#000000",
    penWidth: 0.25,
    style: "solid",
  });
test("session cap reuses bounded targets without leaking mutable outputs or stale geometry", () => {
  const session: EditSession = {
    base: base(),
    target: { kind: "line", id: "line" },
    action: "edge",
    index: 0,
    anchor: { x: 2, y: 0 },
  };
  const raw = { x: 2, y: 10 },
    first = boundedEdgeTarget(session, raw),
    expected = { ...first };
  assert.ok(first.y > 2.9 && first.y < 3);
  assert.deepEqual(boundedEdgeTarget(session, first), first);
  first.y = 999;
  assert.deepEqual(boundedEdgeTarget(session, raw), expected);
  const fresh = { ...session, base: base() };
  fresh.base.storey.lines![0]!.points = rectangle(2);
  const changed = boundedEdgeTarget(fresh, raw);
  assert.ok(changed.y > 1.9 && changed.y < 2);
  assert.deepEqual(boundedEdgeTarget(session, raw), expected);
  const back = boundedEdgeTarget(session, { x: 2, y: 1 });
  assert.equal(back.y, 1);
  const stale = { ...session, target: { kind: "line" as const, id: "missing" } };
  assert.throws(() => boundedEdgeTarget(stale, raw));
});
