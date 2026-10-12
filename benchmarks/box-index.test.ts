import assert from "node:assert/strict";
import test from "node:test";
import { createBoxIndex } from "../src/geometry/spatial/box-index.ts";
import { createBoxIndex as baseline } from "./box-index-baseline.ts";

test("spatial tree preserves ordered queries across sparse, dense, tied and degenerate bounds", () => {
  let seed = 91231;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (const count of [0, 1, 8, 9, 100, 10000]) {
    const entries = Array.from({ length: count }, (_, id) => {
      const x = id % 3 === 0 ? 0 : Math.floor(random() * 200) - 100;
      const y = id % 5 === 0 ? 0 : Math.floor(random() * 200) - 100;
      const box = Object.freeze({ minX: x, minY: y, maxX: x + (id % 4), maxY: y + (id % 7) });
      return Object.freeze({ box, value: Object.freeze({ id }) });
    });
    Object.freeze(entries);
    const old = baseline(entries),
      next = createBoxIndex(entries);
    assert.ok(Object.isFrozen(next));
    for (let i = 0; i < 120; i++) {
      const x = i === 0 ? -1000 : Math.floor(random() * 220) - 110;
      const y = i === 0 ? -1000 : Math.floor(random() * 220) - 110;
      const size = i === 0 ? 2000 : i % 15;
      const query = { minX: x, minY: y, maxX: x + size, maxY: y + size };
      const result = next.query(query);
      assert.deepEqual(result, old.query(query));
      for (const value of result) assert.equal(value, entries[value.id]!.value);
    }
  }
});

test("spatial tree retains boundary, extreme coordinate and invalid bounds behavior", () => {
  for (const x of [-Number.MAX_VALUE, -0, 0, Number.MAX_VALUE]) {
    const box = { minX: x, maxX: x, minY: -0, maxY: 0 };
    assert.deepEqual(
      createBoxIndex([{ box, value: x }]).query(box),
      baseline([{ box, value: x }]).query(box),
    );
  }
  for (const box of [
    { minX: NaN, maxX: 1, minY: 0, maxY: 1 },
    { minX: 0, maxX: Infinity, minY: 0, maxY: 1 },
    { minX: 2, maxX: 1, minY: 0, maxY: 1 },
  ]) {
    assert.throws(() => createBoxIndex([{ box, value: 1 }]), /Invalid spatial bounds/);
    assert.throws(() => createBoxIndex([]).query(box), /Invalid spatial bounds/);
  }
  const box = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  const index = createBoxIndex([{ box, value: 1 }]);
  box.minX = box.maxX = 100;
  assert.deepEqual(index.query({ minX: 0, maxX: 0, minY: 0, maxY: 0 }), [1]);
});
