import { serializeProject, validateProject, type Project } from "../src/lib/bim/model.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
  readProjectFile,
} from "../src/lib/bim/history.ts";
import { prepareSelectionTranslation } from "../src/application/selection/storey-translation.ts";
import { prepareZTranslation } from "../src/application/selection/z-translation.ts";
import { fullSelectionMove } from "./selection-move-oracle.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { selectionMoveSurfaces } from "../src/rendering/viewport/selection-move-preview.ts";
import { prepareEndpoint } from "../src/application/direct-edit/prepared-endpoint.ts";
import { editAtPointer } from "../src/lib/bim/direct-edit.ts";
import { createProjectRecoveryCodec } from "../src/interop/project-file/recovery-codec.ts";
import { exportIfc } from "../src/lib/bim/ifc.ts";
export function equal(a: unknown, b: unknown, label: string) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(label);
}
export async function checkS1(p: Project) {
  const baseline = serializeProject(p),
    solid = buildBuildingSolid(p);
  const rows: {
    kind: string;
    iteration: number;
    prepareMs: number;
    pointerMs: number;
    commitMs: number;
  }[] = [];
  for (const ids of [Array.from({ length: 11 }, (_, i) => `s0-w${i}`), ["s0-w0", "s4-w1"]]) {
    const targets = ids.map((id) => ({ kind: "wall" as const, id }));
    for (let iteration = 0; iteration < 11; iteration++) {
      const delta = { x: 0.2 + iteration * 0.01, y: 0.1 };
      let oracle = p;
      for (const s of p.storeys) {
        const selected = targets.filter((t) => s.walls.some((w) => w.id === t.id));
        if (selected.length)
          oracle = fullSelectionMove({ ...oracle, workingStoreyId: s.id }, selected, delta);
      }
      oracle = validateProject({ ...oracle, workingStoreyId: p.workingStoreyId });
      const a = performance.now(),
        xy = prepareSelectionTranslation(p, ids),
        b = performance.now();
      const preview = xy.evaluate(delta),
        c = performance.now(),
        next = xy.materialize(p, delta),
        d = performance.now();
      equal(serializeProject(next), serializeProject(oracle), "XY full path differs");
      equal(
        selectionMoveSurfaces(solid, p, preview)
          .faces.map((f) => JSON.stringify(f))
          .sort(),
        buildBuildingSolid(next)
          .faces.map((f) => JSON.stringify(f))
          .sort(),
        "XY surfaces differ",
      );
      rows.push({
        kind: `XY-${ids.length}`,
        iteration,
        prepareMs: b - a,
        pointerMs: c - b,
        commitMs: d - c,
      });
      const e = performance.now(),
        z = prepareZTranslation(p, targets),
        f = performance.now();
      const zp = z.evaluate(p, targets, 0.3),
        g = performance.now(),
        zn = z.materialize(p, targets, 0.3),
        h = performance.now();
      const moving = new Set(ids);
      const expected = validateProject({
        ...p,
        storeys: p.storeys.map((s) => ({
          ...s,
          walls: s.walls.map((w) =>
            moving.has(w.id) ? { ...w, baseOffset: (w.baseOffset ?? 0) + 0.3 } : w,
          ),
          wallJoins: s.wallJoins.filter(
            (j) => moving.has(j.first.wallId) === moving.has(j.second.wallId),
          ),
          wallTJunctions: s.wallTJunctions.filter(
            (j) => moving.has(j.hostWallId) === moving.has(j.incoming.wallId),
          ),
        })),
      });
      equal(serializeProject(zn), serializeProject(expected), "Z full model differs");
      equal(
        selectionMoveSurfaces(solid, p, zp)
          .faces.map((f) => JSON.stringify(f))
          .sort(),
        buildBuildingSolid(zn)
          .faces.map((f) => JSON.stringify(f))
          .sort(),
        "Z surfaces differ",
      );
      rows.push({
        kind: `Z-${ids.length}`,
        iteration,
        prepareMs: f - e,
        pointerMs: g - f,
        commitMs: h - g,
      });
      for (const candidate of [next, zn]) {
        const history = commitProject(createHistory(p), candidate);
        equal(history.past.length, 1, "Undo count");
        equal(serializeProject(undoProject(history).present), baseline, "Undo content");
        equal(
          serializeProject(redoProject(undoProject(history)).present),
          serializeProject(candidate),
          "Redo content",
        );
      }
      equal(serializeProject(p), baseline, "Preview/cancel mutated input");
    }
  }
  const host = p.storeys[0]!.walls[0]!;
  const endpoint = prepareEndpoint(p, host.id),
    point = { x: host.end.x + 0.2, y: host.end.y };
  const full = editAtPointer(
    { base: p, target: { kind: "wall", id: host.id }, action: "point", index: 1, anchor: host.end },
    p,
    point,
  );
  equal(
    serializeProject(endpoint.evaluate(point).project),
    serializeProject(full),
    "Endpoint differs",
  );
  const loaded = readProjectFile(baseline);
  equal(serializeProject(loaded), baseline, "Portable roundtrip");
  const codec = createProjectRecoveryCodec();
  equal(
    serializeProject(await codec.restore(await codec.prepare(p))),
    baseline,
    "Recovery codec roundtrip",
  );
  const date = new Date("2026-10-15T12:00:00Z"),
    ifc = await exportIfc(p, date);
  equal(await exportIfc(loaded, date), ifc, "IFC roundtrip");
  for (const [entity, count] of [
    ["IFCWALL", 300],
    ["IFCWINDOW", 200],
    ["IFCBUILDINGSTOREY", 5],
  ] as const)
    equal(ifc.split("\n").filter((l) => l.includes(`=${entity}(`)).length, count, entity);
  return {
    status: "PASS",
    bytes: new TextEncoder().encode(baseline).length,
    assets: p.assets.length,
    logicalPixels: p.assets.reduce((n, a) => n + a.pixelWidth * a.pixelHeight, 0),
    rows,
    limits:
      "First iteration is process-warm, not browser cold. Codec roundtrip is not persisted autosave. IFC external acceptance separate.",
  };
}
