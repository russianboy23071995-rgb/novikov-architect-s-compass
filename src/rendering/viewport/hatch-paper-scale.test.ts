import test from "node:test";
import assert from "node:assert/strict";
import { hatchPatternTile, hatchPatternStroke, type HatchPatternSizing } from "./hatch-pattern.ts";
import { resolvePaperLength } from "./display-size.ts";
import type { ScaleContext } from "../../domain/views/scale.ts";

const definition = {
  id: "asymmetric",
  name: "Asymmetrisch",
  width: 2,
  height: 3,
  lines: [
    { start: { x: 0.2, y: 2.7 }, end: { x: 1.8, y: 0.3 } },
    { start: { x: 0.2, y: 2.7 }, end: { x: 1, y: 2.7 } },
  ],
};
const application = { patternId: definition.id, mode: "model" as const, origin: { x: 10, y: 20 } };
const context = (denominator: number): ScaleContext => ({
  view: { kind: "working-plan", projectId: "p", storeyId: "s" },
  denominator,
});

test("model tile stays identical to previous geometry for every existing rotation", () => {
  for (const rotation of [0, 45, 90, 360]) {
    const { factor, ...tile } = hatchPatternTile(definition, { ...application, rotation })!;
    assert.equal(factor, 1);
    assert.deepEqual(tile, {
      x: 10,
      y: -23,
      width: 2,
      height: 3,
      viewBox: "0 0 2 3",
      patternTransform: `rotate(${-rotation} 10 -20)`,
      lines: definition.lines,
    });
    for (const zoom of [25, 100, 400]) assert.equal(hatchPatternStroke(zoom, factor), 1 / zoom);
  }
});

test("paper tile uses shared explicit scale, preserves aspect, anchor, orientation and owned inputs", () => {
  const before = JSON.stringify({ definition, application });
  for (const denominator of [50, 100])
    for (const rotation of [0, 45, 90]) {
      const tile = hatchPatternTile(
        definition,
        { ...application, rotation },
        { mode: "paper", paperWidthMetres: 0.002, context: context(denominator) },
      )!;
      assert.equal(tile.width, denominator === 50 ? 0.1 : 0.2);
      assert.ok(Math.abs(tile.height / tile.width - 1.5) < 1e-14);
      assert.equal(tile.y + tile.height, -20);
      assert.equal(tile.x, 10);
      assert.equal(tile.patternTransform, `rotate(${-rotation} 10 -20)`);
      assert.equal(tile.viewBox, "0 0 2 3");
      assert.equal(tile.lines, definition.lines);
      assert.equal(resolvePaperLength(tile.width, context(denominator)), 0.002);
      for (const zoom of [25, 100, 400])
        assert.ok(Math.abs(hatchPatternStroke(zoom, tile.factor) * tile.factor * zoom - 1) < 1e-14);
    }
  assert.equal(JSON.stringify({ definition, application }), before);
});

test("paper rendering has no missing-context fallback and rejects degenerate or overflowing extents", () => {
  const paper = { mode: "paper" as const, paperWidthMetres: 0.002, context: context(50) };
  for (const value of [0, -1, NaN, Infinity]) {
    assert.throws(() =>
      hatchPatternTile(definition, application, { ...paper, paperWidthMetres: value }),
    );
    assert.throws(() =>
      hatchPatternTile(definition, application, { ...paper, context: context(value) }),
    );
    assert.throws(() => hatchPatternStroke(value, 1));
    assert.throws(() => hatchPatternStroke(100, value));
  }
  assert.throws(() =>
    hatchPatternTile(definition, application, {
      ...paper,
      context: undefined,
    } as unknown as HatchPatternSizing),
  );
  assert.throws(() =>
    hatchPatternTile(definition, application, { ...paper, paperWidthMetres: Number.MAX_VALUE }),
  );
  assert.throws(() =>
    hatchPatternTile(definition, application, {
      ...paper,
      paperWidthMetres: Number.MIN_VALUE,
      context: context(0.1),
    }),
  );
  assert.throws(() =>
    hatchPatternTile({ ...definition, height: Number.MAX_VALUE }, application, {
      ...paper,
      paperWidthMetres: 1,
    }),
  );
  assert.throws(() => hatchPatternStroke(Number.MAX_VALUE, 100));
  assert.throws(() => hatchPatternStroke(Number.MIN_VALUE, 0.1));
});
