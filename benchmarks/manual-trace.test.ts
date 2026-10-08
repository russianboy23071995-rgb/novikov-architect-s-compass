import test from "node:test";
import assert from "node:assert/strict";
import { createManualTrace } from "./manual-trace.ts";

test("manual trace bounds memory and reports discarded history", () => {
  const trace = createManualTrace(100, 3);
  for (let i = 0; i < 20; i++) trace.add({ kind: "frame", at: 100 + i, duration: 1 });
  const result = trace.snapshot(120);
  assert.equal(result.droppedEvents, 17);
  assert.deepEqual(
    result.events.map((e) => e.at),
    [17, 18, 19],
  );
});

test("observer entries and React commits share the relative input clock", () => {
  const trace = createManualTrace(100);
  trace.add({
    kind: "pointer",
    at: 110,
    name: "pointermove",
    x: 1,
    y: 2,
    shift: true,
    trusted: true,
    delayMs: 4,
  });
  trace.add({ kind: "react", at: 180, renderStartedAt: 120, duration: 40, phase: "update" });
  trace.add({ kind: "long-task", at: 115, duration: 60 });
  const events = trace.snapshot(190).events;
  assert.deepEqual(
    events.map((e) => [e.kind, e.at]),
    [
      ["pointer", 10],
      ["long-task", 15],
      ["react", 80],
    ],
  );
  const react = events[2];
  assert.ok(react?.kind === "react");
  assert.equal(react.renderStartedAt, 20);
});

test("events outside the capture window are excluded", () => {
  const trace = createManualTrace(100, 10, 30);
  for (const at of [99, 100, 130, 131, NaN, Infinity])
    trace.add({ kind: "frame", at, duration: 1 });
  assert.deepEqual(
    trace.snapshot(200).events.map((e) => e.at),
    [0, 30],
  );
  assert.equal(trace.snapshot(200).durationMs, 30);
});

test("export and input objects do not mutate the retained trace", () => {
  const trace = createManualTrace(0);
  const event = { kind: "frame" as const, at: 1, duration: 2 };
  trace.add(event);
  event.duration = 99;
  const first = trace.snapshot(2);
  first.events[0]!.at = 900;
  assert.deepEqual(trace.snapshot(2).events, [{ kind: "frame", at: 1, duration: 2 }]);
});

test("trace rejects invalid storage limits", () => {
  for (const capacity of [0, -1, 0.5, Infinity])
    assert.throws(() => createManualTrace(0, capacity));
  for (const duration of [0, -1, NaN, Infinity])
    assert.throws(() => createManualTrace(0, 10, duration));
  assert.throws(() => createManualTrace(NaN));
});
