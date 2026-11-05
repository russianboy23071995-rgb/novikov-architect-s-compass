import assert from "node:assert/strict";
import os from "node:os";
import { tTransitionFixture } from "./t-transition-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import {
  editAtPointer,
  editAtPointerSnapshot,
  type EditSession,
} from "../src/application/direct-edit/session.ts";
import { connectSnappedT } from "../src/application/walls/t-axis-snap.ts";
import { wallTransitionPatch } from "../src/application/direct-edit/wall-transition-patch.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import type { SnapCandidate } from "../src/constraints/snapping/engine.ts";

const runs = [];
type Sample = {
  kind: "first" | "changed";
  preparationMs: number;
  moveMs: number;
  inputSnapshotMs: number;
  connectMs: number;
  snapshotMs: number;
  scopeMs: number;
  phasedTotalMs: number;
  actualEvaluateMs: number;
  warmMs: number;
  legacyMs: number;
  previousMs: number;
};
const stats = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
  };
};
for (const foreign of [0, 100, 1000]) {
  const raw = tTransitionFixture();
  storeyOf(raw).walls.push({
    ...storeyOf(raw).walls[0]!,
    id: "alternate-host",
    start: { x: 0, y: 7 },
    end: { x: 6, y: 7 },
  });
  for (let i = 0; i < foreign; i++) {
    storeyOf(raw).walls.push({
      ...storeyOf(raw).walls[0]!,
      id: `foreign-${i}`,
      start: { x: 30 + i * 8, y: 0 },
      end: { x: 36 + i * 8, y: 0 },
    });
  }
  const base = createProjectSnapshot(raw);
  const original = JSON.stringify(base);
  const session: EditSession = {
    base,
    target: { kind: "wall", id: "wall-2" },
    action: "point",
    index: 1,
    anchor: { x: 3, y: 0 },
  };
  const samples: Sample[] = [];
  // Fresh capability per pair separates first target from a changed target.
  // Model is already owned; session preparation is measured separately.
  for (let i = 0; i < 28; i++) {
    const t0 = performance.now();
    const prepared = prepareDirectEditPreview(session)!;
    const preparationMs = performance.now() - t0;
    for (const [kind, y] of [
      ["first", 3],
      ["changed", 7],
    ] as const) {
      const point = { x: 3, y };
      const candidate: SnapCandidate = {
        kind: "endpoint",
        worldPoint: point,
        sourceEntityId: kind === "first" ? "new-host" : "alternate-host",
        sourceFeature: "t-axis",
        distanceOnScreen: 0,
        priority: 0,
      };
      // Reproduce production phase order with public functions, no production timers.
      const start = performance.now();
      const moved = editAtPointerSnapshot(session, base, point);
      const a = performance.now();
      const movedSnapshot = createProjectSnapshot(moved);
      const a2 = performance.now();
      const connected = connectSnappedT(session, movedSnapshot, point, candidate);
      const b = performance.now();
      const owned = createProjectSnapshot(connected);
      const c = performance.now();
      const patch = wallTransitionPatch(base, owned, "wall-2");
      const d = performance.now();
      const actual = prepared.evaluate(base, session.target, point, candidate);
      const e = performance.now();
      const warm = prepared.evaluate(base, session.target, point, candidate);
      const f = performance.now();
      const legacy = wallTransitionPatch(
        base,
        createProjectSnapshot(
          connectSnappedT(session, editAtPointer(session, base, point), point, candidate),
        ),
        "wall-2",
      );
      const g = performance.now();
      const previous = wallTransitionPatch(
        base,
        createProjectSnapshot(
          connectSnappedT(
            session,
            createProjectSnapshot(editAtPointer(session, base, point)),
            point,
            candidate,
          ),
        ),
        "wall-2",
      );
      const h = performance.now();
      assert.deepEqual(actual, previous);
      assert.deepEqual(actual, patch);
      assert.deepEqual(actual, legacy);
      assert.deepEqual(connected, connectSnappedT(session, moved, point, candidate));
      assert.equal(warm, actual);
      assert.equal(patch.replacedIds.length, kind === "first" ? 7 : 5);
      assert.equal(storeyOf(connected).windows.length, 3);
      assert.equal(storeyOf(connected).wallTJunctions.length, 2);
      if (i >= 7)
        samples.push({
          kind,
          preparationMs,
          moveMs: a - start,
          inputSnapshotMs: a2 - a,
          connectMs: b - a2,
          snapshotMs: c - b,
          scopeMs: d - c,
          phasedTotalMs: d - start,
          actualEvaluateMs: e - d,
          warmMs: f - e,
          legacyMs: g - f,
          previousMs: h - g,
        });
    }
  }
  assert.equal(JSON.stringify(base), original);
  const summary = Object.fromEntries(
    ["first", "changed"].map((kind) => [
      kind,
      Object.fromEntries(
        [
          "preparationMs",
          "moveMs",
          "inputSnapshotMs",
          "connectMs",
          "snapshotMs",
          "scopeMs",
          "phasedTotalMs",
          "actualEvaluateMs",
          "warmMs",
          "legacyMs",
          "previousMs",
        ].map((key) => [
          key,
          stats(
            samples
              .filter((s) => s.kind === kind)
              .map((s) => s[key as Exclude<keyof typeof s, "kind">]),
          ),
        ]),
      ),
    ]),
  );
  runs.push({ foreign, summary, samples });
}
console.log(
  JSON.stringify(
    {
      node: process.version,
      cpu: os.cpus()[0]?.model,
      platform: process.platform,
      method:
        "7 warmup + 21 samples per first/changed target; owned base, fresh capability per pair; changed host from new-host to alternate-host; production phase order reconstructed, equality against actual evaluator; no frame/native claim; first is session-cold, not process-cold; phase and actual times are separate executions",
      runs,
    },
    null,
    2,
  ),
);
