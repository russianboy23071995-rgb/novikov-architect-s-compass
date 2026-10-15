import { originFixture } from "./local-origin-fixture.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { linearMovementOriginQuery } from "./movement-origin-oracle.ts";
import { createMovementOriginQuery } from "../src/rendering/viewport/movement-origin.ts";
test("local origin matches frozen scan across camera, zoom, visibility and height", () => {
  for (const yaw of [0, 0.7, Math.PI])
    for (const zoom of [0.3, 2]) {
      const { project, view, cursors } = originFixture(10, yaw, zoom);
      for (const allows of [() => true, (id: string) => id.startsWith("s1"), () => false]) {
        const local = createMovementOriginQuery(project, view, allows),
          full = linearMovementOriginQuery(project, view, allows);
        for (const c of cursors)
          for (const height of [undefined, 0, 3, NaN])
            assert.deepEqual(local(c, 10, height), full(c, 10, height));
      }
    }
});
test("origin retains zero radius, radius boundary and invalid input behavior", () => {
  const { project, view, cursors } = originFixture();
  const local = createMovementOriginQuery(project, view, () => true),
    full = linearMovementOriginQuery(project, view, () => true);
  for (const radius of [0, 10, 1e6, Number.MAX_VALUE, -1, NaN, Infinity])
    for (const c of [
      cursors[0]!,
      { x: NaN, y: 0 },
      { x: 1e6, y: -1e6 },
      { x: Number.MAX_VALUE, y: 0 },
    ])
      assert.deepEqual(local(c, radius), full(c, radius));
  for (const c of cursors)
    for (const dx of [10 - 1e-8, 10, 10 + 1e-8]) {
      const cursor = { x: c.x + dx, y: c.y };
      assert.deepEqual(local(cursor, 10), full(cursor, 10));
    }
});
test("dense projected candidates retain stable ties and occlusion policy", () => {
  const { project, view, cursors } = originFixture(100, 0, 0.02);
  const local = createMovementOriginQuery(project, view, () => true),
    full = linearMovementOriginQuery(project, view, () => true);
  for (const c of cursors) assert.deepEqual(local(c, 100), full(c, 100));
});
