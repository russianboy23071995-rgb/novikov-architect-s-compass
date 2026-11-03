import test from "node:test";
import assert from "node:assert/strict";
import { gesamtCounts, gesamtFixture } from "./gesamt-fixture.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
import { loadProjectData } from "../src/interop/project-file/load.ts";

// The Gesamtnachweis model stays valid as the product evolves (docs/performance/GESAMTNACHWEIS_2026-11.md).
test("Gesamtnachweis model: every feature present, valid and round-tripping", () => {
  const p = gesamtFixture(1000);
  assert.deepEqual(gesamtCounts(p), {
    walls: 200,
    trimmedWalls: 40,
    windows: 100,
    lines: 700,
    slabs: 4,
    slabOpenings: 40,
    rooms: 100,
    roofs: 1,
    references: 0,
    sections: 8,
    documents: 13,
    layouts: 6,
    placedDrawings: 12,
  });
  assert.ok(p.storeys[0]!.walls.every((w) => w.topBinding));
  assert.ok(p.storeys[1]!.walls.every((w) => w.assemblyId));
  assert.ok(p.storeys[4]!.walls.every((w) => w.trimPlane));
  assert.deepEqual(loadProjectData(JSON.parse(serializeProject(p))), p);
});
