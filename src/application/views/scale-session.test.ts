import test from "node:test";
import assert from "node:assert/strict";
import { changeViewScale, readViewScale, parseOutputScale } from "./scale-session.ts";
import {
  resolveModelLength,
  resolveScreenLength,
  resolvePaperLength,
  paperMillimetresToMetres,
} from "../../rendering/viewport/display-size.ts";
import type { WorkingPlanIdentity, ScaleContext } from "../../domain/views/scale.ts";
import { createProject, serializeProject } from "../../lib/bim/model.ts";
import { createHistory } from "../../lib/bim/history.ts";

const view: WorkingPlanIdentity = { kind: "working-plan", projectId: "p", storeyId: "s" };
const context = (denominator: number): ScaleContext => ({ view, denominator });

test("semantic plan scales survive pane rebinding and keep projects/storeys independent", () => {
  const original = Object.freeze({});
  const first = readViewScale(original, view);
  assert.equal(first.denominator, 100);
  const next = changeViewScale(original, first.view, 50);
  assert.equal(readViewScale(next, { ...view }).denominator, 50);
  assert.equal(readViewScale(next, { ...view, storeyId: "other" }).denominator, 100);
  assert.equal(readViewScale(next, { ...view, projectId: "other" }).denominator, 100);
  const other = changeViewScale(next, { ...view, storeyId: "other" }, 200);
  assert.equal(readViewScale(other, view).denominator, 50);
  assert.equal(changeViewScale(other, view, 50), other);
  assert.deepEqual(original, {});
  assert.equal(
    readViewScale(changeViewScale(next, { ...view, projectId: "p:s" }, 25), {
      ...view,
      storeyId: "s:s",
    }).denominator,
    100,
  );
});

test("scale session does not write model, saved JSON or model history", () => {
  const project = createProject("p", "s");
  const history = createHistory(project);
  const before = JSON.stringify(history);
  const file = serializeProject(project);
  const session = changeViewScale({}, view, 25);
  assert.equal(readViewScale(session, view).denominator, 25);
  assert.equal(JSON.stringify(history), before);
  assert.equal(serializeProject(project), file);
});

test("free scale input is strict and supports decimal comma and 1:S", () => {
  for (const [input, expected] of [
    ["1:50", 50],
    [" 1 : 12,5 ", 12.5],
    ["200", 200],
    ["0.5", 0.5],
  ] as const)
    assert.equal(parseOutputScale(input), expected);
  for (const input of [
    "",
    "1:0",
    "-2",
    "1:-50",
    "1:50junk",
    "2:100",
    "Infinity",
    "1:NaN",
    "0x10",
    "1:1:50",
    "1e9",
    "9".repeat(400),
  ])
    assert.throws(() => parseOutputScale(input));
  for (const value of [0, -1, NaN, Infinity]) assert.throws(() => changeViewScale({}, view, value));
  assert.throws(() => readViewScale({}, { ...view, storeyId: "" }));
});

test("one metric resolver separates paper size, model size, output scale and camera zoom", () => {
  const paper = Object.freeze({ mode: "paper" as const, metres: paperMillimetresToMetres(2) });
  const model = Object.freeze({ mode: "model" as const, metres: 0.2 });
  for (const scale of [50, 100]) {
    assert.equal(resolveModelLength(paper, context(scale)), scale === 50 ? 0.1 : 0.2);
    assert.equal(resolveModelLength(model, context(scale)), 0.2);
    assert.equal(
      resolvePaperLength(resolveModelLength(paper, context(scale)), context(scale)),
      0.002,
    );
    for (const zoom of [25, 100, 400]) {
      assert.equal(resolveScreenLength(paper, context(scale), zoom), 0.002 * scale * zoom);
      assert.equal(resolveScreenLength(model, context(scale), zoom), 0.2 * zoom);
    }
  }
  assert.equal(resolveModelLength(model), 0.2);
  assert.equal(resolvePaperLength(0.2, context(50)), 0.004);
});

test("missing contexts and non-finite, zero, underflow or overflowing lengths fail explicitly", () => {
  assert.throws(() => resolveModelLength({ mode: "paper", metres: 0.002 }));
  for (const value of [0, -1, NaN, Infinity]) {
    assert.throws(() => resolveModelLength({ mode: "paper", metres: value }, context(50)));
    assert.throws(() => resolveModelLength({ mode: "paper", metres: 0.002 }, context(value)));
    assert.throws(() => resolveScreenLength({ mode: "model", metres: 1 }, undefined, value));
  }
  assert.throws(() => resolveModelLength({ mode: "paper", metres: Number.MAX_VALUE }, context(50)));
  assert.throws(() =>
    resolveModelLength({ mode: "paper", metres: Number.MIN_VALUE }, context(0.1)),
  );
  assert.throws(() =>
    resolveScreenLength({ mode: "model", metres: Number.MAX_VALUE }, undefined, 400),
  );
  assert.throws(() => resolvePaperLength(Number.MIN_VALUE, context(100)));
  assert.throws(() => paperMillimetresToMetres(Number.MIN_VALUE));
});
