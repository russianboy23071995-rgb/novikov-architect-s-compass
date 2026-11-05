// node --experimental-strip-types benchmarks/snap-index-equality.ts [out.json]
// Equality proof for the blocked workspace snap index (docs/performance/EDIT_CYCLE.md, Teil B):
// on the school model (l, working storey s0) and after wall, door and line edits, the blocked
// index answers every query, lookup and segment listing exactly like one index over all parts.
// A counter-check proves the comparison detects a missing reference.
import { writeFileSync } from "node:fs";
import { deepStrictEqual } from "node:assert/strict";
import { schoolPlanFixture } from "./school-plan-fixture.ts";
import { commitProject, createHistory } from "../src/application/history/project-history.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import { previewDeleteSelection } from "../src/application/elements/delete.ts";
import type { ElementTarget } from "../src/application/selection/target.ts";
const deleteElements = (p: Project, targets: ElementTarget[]) =>
  previewDeleteSelection(p, targets, undefined).result;
import {
  createLocalSnapSources,
  getLocalSnapSources,
} from "../src/application/snapping/local-sources.ts";
import { referenceKey } from "../src/constraints/inference/construction-reference.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import type { Project } from "../src/domain/project/schema.ts";

const keyed = (r: { entityId: string; feature: string }) => `${r.entityId}:${r.feature}`;
function compare(project: Project, label: string) {
  const blocked = getLocalSnapSources(project),
    single = createLocalSnapSources(project);
  deepStrictEqual(blocked.sourceCount, single.sourceCount, `${label}: source count`);
  deepStrictEqual([...blocked.allSegments], [...single.allSegments], `${label}: segments`);
  let queries = 0;
  const storey = storeyOf(project);
  const probes = [
    ...storey.walls.flatMap((w) => [w.start, w.end]),
    ...(storey.lines ?? []).filter((_, i) => i % 7 === 0).map((l) => l.points[0]!),
    { x: 25.2, y: 10.1 },
    { x: -40, y: -40 },
  ];
  for (const p of probes)
    for (const [scale, radius] of [
      [40, 12],
      [8, 30],
      [200, 6],
    ] as const) {
      for (const query of ["query", "queryPrimitives"] as const) {
        const a = blocked[query]({ x: p.x + 0.03, y: p.y - 0.02 }, scale, radius),
          b = single[query]({ x: p.x + 0.03, y: p.y - 0.02 }, scale, radius);
        deepStrictEqual(a.references.map(keyed), b.references.map(keyed), `${label}: refs`);
        deepStrictEqual(a.segments, b.segments, `${label}: query segments`);
        deepStrictEqual(a.segmentPairs, b.segmentPairs, `${label}: pairs`);
        queries++;
      }
    }
  for (const r of createLocalSnapSources(project).query({ x: 25, y: 10 }, 1, 400).references)
    deepStrictEqual(blocked.lookup(referenceKey(r)), single.lookup(referenceKey(r)), label);
  return queries;
}

let history = createHistory(schoolPlanFixture({ wings: 3, desksPerRoom: 50 }));
const results: { label: string; queries: number }[] = [];
const step = (label: string, next?: (p: Project) => Project) => {
  if (next) history = commitProject(history, next(history.present));
  results.push({ label, queries: compare(history.present, label) });
};
step("geladen");
step("Wandlänge", (p) => updateWall(p, "s0-w0-par-n3", { end: { x: 25, y: 19 } }));
step("Wand zurück", (p) => updateWall(p, "s0-w0-par-n3", { end: { x: 25, y: 19.85 } }));
step("Linie löschen", (p) => deleteElements(p, [{ kind: "line", id: "s0-w0-desk-s1-3" }]));
step("Tür löschen", (p) => deleteElements(p, [{ kind: "door", id: "s0-w0-door-n2" }]));

// Counter-check: a blocked index without one block must fail the comparison.
let detected = false;
try {
  const p = history.present,
    single = createLocalSnapSources(p);
  const without = single.query({ x: 1, y: 1 }, 1, 4000).references.slice(1).map(keyed);
  deepStrictEqual(
    without,
    getLocalSnapSources(p).query({ x: 1, y: 1 }, 1, 4000).references.map(keyed),
  );
} catch {
  detected = true;
}
if (!detected) throw new Error("counter-check failed");

const report = {
  runtime: `node ${process.version} ${process.platform} ${process.arch}`,
  date: new Date().toISOString(),
  states: results.length,
  queries: results.reduce((n, r) => n + r.queries, 0),
  counterCheckDetected: detected,
  results,
};
const text = JSON.stringify(report, null, 2);
if (process.argv[2]) writeFileSync(process.argv[2], text + "\n");
process.stdout.write(text + "\n");
