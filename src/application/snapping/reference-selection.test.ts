import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyReferenceSelection,
  reduceReferenceSelection,
  segmentKey,
} from "./reference-selection.ts";
import { createLocalSnapSources } from "./local-sources.ts";
import { createToolSourceQuery } from "../tools/snapping.ts";
import { pickReferenceSegments } from "../../rendering/viewport/reference-picking.ts";
import { validateProject } from "../../lib/bim/model.ts";
import { sameHoverSession } from "../../constraints/inference/hover-reference.ts";

test("reference selection draft, cancel, validation and clear never change committed selection early", () => {
  let s = reduceReferenceSelection(emptyReferenceSelection(), { type: "begin" });
  assert.deepEqual(reduceReferenceSelection(s, { type: "apply", allowed: new Set() }), s);
  s = reduceReferenceSelection(s, { type: "toggle", key: "one" });
  assert.equal(s.confirmed, null);
  s = reduceReferenceSelection(s, { type: "apply", allowed: new Set(["one"]) });
  assert.deepEqual(s.confirmed, ["one"]);
  assert.equal(s.draft, null);
  let draft = reduceReferenceSelection(s, { type: "begin" });
  draft = reduceReferenceSelection(draft, { type: "toggle", key: "two" });
  assert.deepEqual(reduceReferenceSelection(draft, { type: "cancel" }), s);
  assert.deepEqual(
    reduceReferenceSelection(draft, { type: "apply", allowed: new Set(["one"]) }).confirmed,
    ["one"],
  );
  assert.deepEqual(reduceReferenceSelection(s, { type: "clear" }), emptyReferenceSelection());
});
function fixture() {
  return validateProject({
    schemaVersion: 1,
    unit: "m",
    id: "refs",
    storey: {
      id: "s",
      walls: [],
      windows: [],
      lines: Array.from({ length: 48 }, (_, i) => ({
        id: "l" + i,
        kind: "polyline",
        points: [
          { x: -10, y: -i - 1 },
          { x: 10, y: i + 1 },
          { x: 20, y: i + 1 },
        ],
        color: "#334155",
        penWidth: 0.25,
        style: "solid",
      })),
    },
  });
}
test("selected segment pairs before density guard; unrelated points and remote guides remain", () => {
  const model = createLocalSnapSources(fixture());
  const query = createToolSourceQuery(model, null);
  const all = model.queryPrimitives({ x: 0, y: 0 }, 100, 10);
  const selected = new Set(all.segments.slice(0, 2).map((s) => segmentKey(s.source)));
  assert.equal(query.inspect({ x: 0, y: 0 }, 100, 10).segments.length, 48);
  assert.equal(query.inspect({ x: 0, y: 0 }, 100, 10, selected).segmentPairs, 1);
  const refs = query({ x: 0, y: 0 }, 100, 10, [], false, selected);
  assert.equal(refs.filter((r) => r.kind === "segment-intersection").length, 1);
  assert.equal(refs.filter((r) => r.kind === "midpoint").length, 48);
  assert.equal(
    query({ x: 0, y: 0 }, 100, 10, [], false, new Set()).some(
      (r) => r.kind === "segment-intersection",
    ),
    false,
  );
  const active = all.segments[10]!.source;
  assert.ok(
    query({ x: 100, y: 0 }, 100, 10, [active], false, selected).some(
      (r) => r.entityId === active.entityId,
    ),
  );
  assert.equal(query.inspect({ x: 15, y: 1 }, 100, 10, selected).segments.length, 0);
  const context = { enabled: true, references: [], sourceQuery: query, pixelsPerMetre: 100 };
  assert.ok(sameHoverSession(context, { ...context, selectedSegments: selected, suspended: true }));
});
test("ambiguous picking uses actual segments and deterministic order, with per-segment identity", () => {
  const segments = createLocalSnapSources(fixture()).allSegments;
  const hits = pickReferenceSegments(segments, { x: 0, y: 0 }, 100);
  assert.equal(hits.length, 48);
  assert.deepEqual(hits, pickReferenceSegments([...segments].reverse(), { x: 0, y: 0 }, 100));
  assert.equal(pickReferenceSegments(segments, { x: 0, y: 1000 }, 100).length, 0);
  assert.equal(
    pickReferenceSegments(segments, { x: 15, y: 1 }, 100)[0]?.feature,
    "segment-1-midpoint:[10,1,20,1]",
  );
});
