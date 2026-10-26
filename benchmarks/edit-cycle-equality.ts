// node --experimental-strip-types benchmarks/edit-cycle-equality.ts [out.json]
// Equality proof for docs/performance/EDIT_CYCLE.md on the school model (s): every command is
// applied through the new path (trusted own preview, shared wall extrusions) and through the
// former path (re-run of the action, uncached extrusion); models and wall solids must match.
// A counter-check proves the comparison detects a changed wall solid.
import { writeFileSync } from "node:fs";
import { deepStrictEqual } from "node:assert/strict";
import { schoolPlanFixture } from "./school-plan-fixture.ts";
import { commitProject, createHistory } from "../src/application/history/project-history.ts";
import {
  applySelectionCommand,
  previewSelectionCommand,
} from "../src/application/commands/selection-command.ts";
import {
  ALL_LAYERS_VISIBLE,
  createLayerVisibilityPolicy,
} from "../src/application/layers/visibility.ts";
import {
  connectedWallSolids,
  createWallSolidReuse,
} from "../src/domain/elements/wall/connections.ts";
import { selectWorkingStorey } from "../src/application/storeys/working-storey.ts";
import type { Project } from "../src/domain/project/schema.ts";
import type { ElementTarget } from "../src/application/selection/target.ts";

type Case = { target: ElementTarget | ElementTarget[]; text: string; storey?: string };
const wall = (id: string) => ({ kind: "wall" as const, id });
const cases: Case[] = [
  { target: wall("s0-w0-par-n3"), text: "Wandlänge auf 8,2 m" },
  { target: wall("s0-w0-par-n3"), text: "Wandlänge auf 8 m" },
  { target: wall("s0-w0-par-s3"), text: "Wandstärke auf 24 cm" },
  { target: wall("s0-w0-par-n4"), text: "Wandstärke auf 20 cm" },
  { target: { kind: "window", id: "s0-w0-win-s0a" }, text: "Fensterbreite auf 1,2 m" },
  { target: { kind: "window", id: "s0-w0-win-n3b" }, text: "Brüstungshöhe auf 80 cm" },
  { target: { kind: "window", id: "s0-w0-win-s4a" }, text: "Fenster zentrieren" },
  { target: { kind: "door", id: "s0-w0-door-n2" }, text: "Tür DIN rechts" },
  { target: { kind: "door", id: "s0-w0-door-s1" }, text: "Türbreite auf 1,135 m" },
  { target: { kind: "door", id: "s0-w0-door-s3" }, text: "Tür zentrieren" },
  { target: { kind: "line", id: "s0-w0-desk-s0-0" }, text: "Offset um 10 cm" },
  {
    target: [
      { kind: "line", id: "s0-w0-desk-s2-1" },
      { kind: "line", id: "s0-w0-desk-s2-2" },
    ],
    text: "Auswahl um 30 cm bei 90 Grad verschieben",
  },
  { target: [{ kind: "line", id: "s0-w0-desk-s1-3" }], text: "Auswahl löschen" },
  { target: wall("s2-w0-par-s4"), text: "Wandlänge auf 8,4 m", storey: "s2" },
  { target: [wall("s2-w0-par-n5")], text: "Auswahl löschen", storey: "s2" },
  { target: wall("s4-w0-par-s2"), text: "Wandhöhe auf 3 m", storey: "s4" },
  { target: wall("s4-w0-ext-e"), text: "Wandhöhe auf 3,4 m", storey: "s4" },
];

/** Former path: wall solids from scratch on a fresh copy (no snapshot or extrusion cache). */
const uncachedSolids = (p: Project) =>
  connectedWallSolids(structuredClone(p), createWallSolidReuse([]));
const modelOf = (p: Project) => JSON.parse(JSON.stringify(p));

let history = createHistory(schoolPlanFixture());
const results: { text: string; model: boolean; solids: number }[] = [];
const rejected: { text: string; reason: string }[] = [];
for (const c of cases) {
  if (c.storey && (history.present.workingStoreyId ?? "s0") !== c.storey)
    history = commitProject(
      history,
      selectWorkingStorey(history.present, history.present, c.storey),
    );
  const p = history.present;
  const targets = Array.isArray(c.target) ? c.target : [c.target];
  const visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  let preview;
  try {
    preview = previewSelectionCommand(p, targets, visibility, c.text);
  } catch (error) {
    // Domain rules reject some edits (e.g. a T junction needs equal thickness and height);
    // the preview is shared by both paths, so a rejection is identical by construction.
    rejected.push({ text: c.text, reason: (error as Error).message });
    continue;
  }
  const applied = applySelectionCommand(p, targets, visibility, preview);
  // Former path: re-run the action instead of trusting the preview.
  const rerun = previewSelectionCommand(p, targets, visibility, c.text).result;
  deepStrictEqual(modelOf(applied), modelOf(rerun), `model differs: ${c.text}`);
  history = commitProject(history, applied);
  const solids = connectedWallSolids(history.present);
  deepStrictEqual(solids, uncachedSolids(history.present), `wall solids differ: ${c.text}`);
  results.push({ text: c.text, model: true, solids: solids.length });
}

// Counter-check: one changed vertex in one wall solid must fail the comparison.
const reference = uncachedSolids(history.present);
const tampered = structuredClone(reference);
tampered[0]!.faces[0]!.vertices[0]![0] += 1e-9;
let detected = false;
try {
  deepStrictEqual(tampered, reference);
} catch {
  detected = true;
}
if (!detected) throw new Error("counter-check failed: comparison misses a changed solid");

const report = {
  runtime: `node ${process.version} ${process.platform} ${process.arch}`,
  date: new Date().toISOString(),
  cases: results.length,
  identical: results.filter((r) => r.model).length,
  counterCheckDetected: detected,
  results,
  rejected,
};
const text = JSON.stringify(report, null, 2);
if (process.argv[2]) writeFileSync(process.argv[2], text + "\n");
process.stdout.write(text + "\n");
