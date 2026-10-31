import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addStair, updateStair } from "./actions.ts";
import { stairSettings, stairToolDefaults, stairValues } from "./defaults.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import {
  stairDirectionTo,
  stairGeometry,
  stairLayout,
  stairPlan,
  stairTurnTo,
  type Stair,
} from "../../domain/elements/stair/model.ts";
import { stairBody } from "../../domain/elements/stair/body.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";

// docs/TREPPE.md, TR3.
const close = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 1e-9, `${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
const area = (points: readonly { x: number; y: number }[]) =>
  points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length]!;
    return sum + (p.x * q.y - q.x * p.y) / 2;
  }, 0);
const base = {
  start: { x: 0, y: 0 },
  direction: 0,
  width: 1,
  riserTarget: 0.175,
  waist: 0.16,
  ruleSet: "residential" as const,
  baseOffset: 0,
  height: 2.8,
};

test("L and U split the risers into two flights with a landing; the check covers both", () => {
  const g = stairGeometry({ ...base, shape: "l" }, null)!;
  assert.deepEqual(g.flights, [8, 8]);
  assert.equal(g.landing, 1);
  assert.equal(g.treadCount, 14);
  assert.ok(Math.abs(g.run - 14 * g.tread) < 1e-9);
  assert.deepEqual(g.issues, []);
  // Fixed first flight and landing depth; limits reported, never refused.
  const fixed = stairGeometry({ ...base, shape: "u", firstRisers: 2, landingDepth: 0.8 }, null)!;
  assert.deepEqual(fixed.flights, [2, 14]);
  assert.match(fixed.issues.join(" "), /1\. Lauf mit weniger als 3 Steigungen/);
  assert.match(fixed.issues.join(" "), /Podesttiefe 80 cm unter Laufbreite 100 cm/);
  // More than 18 risers in one flight need a landing (DIN 18065).
  const tall = stairGeometry({ ...base, shape: "straight", height: 3.6 }, null)!;
  assert.ok(tall.riserCount > 18);
  assert.match(tall.issues.join(" "), /Zwischenpodest/);
  assert.doesNotMatch(
    stairGeometry({ ...base, shape: "l", height: 3.6 }, null)!.issues.join(" "),
    /Zwischenpodest/,
  );
});

test("an L turns its second flight to the chosen side at the landing's far edge", () => {
  const g = stairGeometry({ ...base, shape: "l" }, null)!;
  const run1 = 7 * g.tread;
  for (const turn of ["left", "right"] as const) {
    const σ = turn === "left" ? 1 : -1;
    const layout = stairLayout({ ...base, shape: "l", turn }, g);
    const [, second] = layout.flights;
    close(second!.frame.d, { x: 0, y: σ });
    close(second!.frame.origin, { x: run1 + 0.5, y: 0.5 * σ });
    assert.equal(second!.first, 8);
    // Footprint: flight 1 with the landing, plus flight 2 beside it; counterclockwise.
    assert.equal(layout.footprint.length, 6);
    assert.ok(Math.abs(area(layout.footprint) - ((run1 + 1) * 1 + 7 * g.tread)) < 1e-9);
    assert.ok(Math.abs(area(layout.landing!) - 1) < 1e-9);
  }
});

test("a U returns parallel beside the first flight with the stair well between", () => {
  const g = stairGeometry({ ...base, shape: "u" }, null)!;
  const run1 = 7 * g.tread;
  const layout = stairLayout({ ...base, shape: "u", eye: 0.2 }, g);
  const [, second] = layout.flights;
  close(second!.frame.d, { x: -1, y: 0 });
  close(second!.frame.origin, { x: run1, y: 1.2 });
  const run2 = 7 * g.tread;
  assert.ok(Math.abs(area(layout.footprint) - (run1 + 1 + 1 * 1.2 + run2)) < 1e-9);
  // Walking line through the landing centre to the top of flight 2.
  const plan = stairPlan({ ...base, shape: "u", eye: 0.2 }, g);
  assert.equal(plan.risers.length, 16);
  assert.equal(
    plan.risers.findIndex((r) => r.above),
    5,
  );
  const walk = [...plan.walk.below, ...plan.walk.above!];
  assert.ok(walk.some((p) => Math.abs(p.x - (run1 + 0.5)) < 1e-9 && Math.abs(p.y) < 1e-9));
  assert.ok(walk.some((p) => Math.abs(p.x - (run1 + 0.5)) < 1e-9 && Math.abs(p.y - 1.2) < 1e-9));
  close(plan.walk.above!.at(-1)!, { x: run1 - run2, y: 1.2 });
});

test("the body has both flights at their heights and the landing slab under the landing", () => {
  const stair = { ...base, id: "t", layerId: "x", shape: "l" as const } satisfies Stair;
  const body = stairBody(stair, 0, null)!;
  assert.deepEqual(
    body.parts.map((p) => p.kind),
    ["flight", "flight", "landing"],
  );
  const zs = (i: number) => body.parts[i]!.faces.flatMap((f) => f.vertices.map((v) => v[2]));
  assert.ok(Math.abs(Math.max(...zs(0)) - 1.4) < 1e-9);
  assert.ok(Math.abs(Math.min(...zs(1)) - 1.4) < 1e-9);
  assert.ok(Math.abs(Math.max(...zs(1)) - 2.8) < 1e-9);
  assert.ok(Math.abs(Math.max(...zs(2)) - 1.4) < 1e-9);
  assert.ok(Math.abs(Math.min(...zs(2)) - (1.4 - 0.16)) < 1e-9);
  assert.ok(Math.abs(body.parts[2]!.volume - 0.16) < 1e-9);
  assert.ok(body.volume > body.parts[2]!.volume);
});

test("drawing: direction to the second click, turn to the side of the third", () => {
  assert.equal(stairDirectionTo({ x: 1, y: 1 }, { x: 1, y: 3 }), 90);
  assert.equal(stairDirectionTo({ x: 1, y: 1 }, { x: 1, y: 1 }), null);
  assert.equal(stairTurnTo({ x: 0, y: 0 }, 0, { x: 2, y: 1 }), "left");
  assert.equal(stairTurnTo({ x: 0, y: 0 }, 0, { x: 2, y: -1 }), "right");
  assert.equal(stairTurnTo({ x: 0, y: 0 }, 90, { x: 1, y: 2 }), "right");
});

test("L/U settings are stored only for L/U, round-trip, and go back with a straight stair", async () => {
  const p = createStandardProject("p", "eg", "og");
  const layerId = p.layers[0]!.id;
  assert.deepEqual(
    Object.keys(stairValues(stairToolDefaults(layerId))).filter((k) =>
      ["turn", "firstRisers", "landingDepth", "eye"].includes(k),
    ),
    [],
  );
  const u = {
    ...stairToolDefaults(layerId),
    shape: "u" as const,
    turn: "right" as const,
    firstRisersMode: "fixed" as const,
    firstRisers: 7,
    eye: 0.1,
  };
  const q = addStair(p, { id: "t", start: { x: 0, y: 0 }, ...stairValues(u) });
  const t = storeyOf(q).stairs![0]!;
  assert.equal(t.turn, "right");
  assert.equal(t.firstRisers, 7);
  assert.equal(t.eye, 0.1);
  assert.equal(t.landingDepth, undefined);
  assert.deepEqual(stairValues(stairSettings(t)), stairValues(u));
  assert.deepEqual(readProjectFile(serializeProject(q)), q);
  const ifc = await exportIfc(q, new Date("2026-10-31T12:00:00Z"));
  assert.ok(ifc.includes(".HALF_TURN_STAIR."));
  assert.equal(ifc.split("\n").filter((l) => l.includes("=IFCSTAIRFLIGHT(")).length, 2);
  assert.ok(ifc.split("\n").some((l) => l.includes("=IFCSLAB(") && l.includes(".LANDING.")));
  // Back to straight the way the properties do it: L/U values are removed.
  const straight = updateStair(q, "t", {
    turn: undefined,
    firstRisers: undefined,
    landingDepth: undefined,
    eye: undefined,
    ...stairValues({ ...stairSettings(t), shape: "straight" }),
  });
  const s = storeyOf(straight).stairs![0]!;
  assert.equal(s.shape, "straight");
  assert.equal(s.turn, undefined);
  assert.equal(s.firstRisers, undefined);
  assert.equal(s.eye, undefined);
});
