import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addDimension, defaultDimensionLayerId, updateDimension } from "./actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import {
  dimensionLayout,
  dimensionValues,
  dimensionPointAt,
  dimensionFigure,
  formatDimension,
} from "../../domain/elements/dimension/model.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { projectSnapReferences } from "../snapping/project-references.ts";
import { snapPointLabel } from "../snapping/point-label.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { prepareTranslation } from "../../domain/project/prepared-translation.ts";
import { previewDeleteSelection } from "../elements/delete.ts";
import { selectionSummary } from "../../components/cad/demand-menu.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";

// docs/MASSKETTE.md, L12: the dimension chain as a 2D tool.
function withChain() {
  return addDimension(createStandardProject("p", "eg", "og"), {
    id: "m1",
    orientation: "horizontal",
    offset: -1.5,
    // Clicked in any order; one point twice (same station) counts once.
    points: [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 2.365, y: 0.3 },
      { x: 3.5, y: 0 },
      { x: 3.5, y: 0.3 },
    ],
  });
}

test("a chain measures neighbouring stations along its direction, on the Bemaßung layer", () => {
  const p = withChain();
  const chain = storeyOf(p).dimensions![0]!;
  assert.equal(chain.layerId, defaultDimensionLayerId(p));
  assert.equal(p.layers.find((l) => l.id === chain.layerId)!.name, "Bemaßung");
  const values = dimensionValues(chain).map((v) => Math.round(v * 1000) / 1000);
  assert.deepEqual(values, [2.365, 1.135, 4.5]);
  const layout = dimensionLayout(chain);
  assert.deepEqual(layout.line, { start: { x: 0, y: -1.5 }, end: { x: 8, y: -1.5 } });
  assert.equal(layout.extensions.length, 5);
  assert.deepEqual(layout.extensions[2], {
    start: { x: 2.365, y: 0.3 },
    end: { x: 2.365, y: -1.5 },
  });
  assert.equal(layout.ticks.length, 4);
  assert.deepEqual(readProjectFile(serializeProject(p)), p);
});

test("vertical chains measure in y; a chain without two distinct stations is refused", () => {
  const p = withChain();
  const vertical = updateDimension(p, "m1", { orientation: "vertical", offset: 9 });
  assert.deepEqual(
    dimensionValues(storeyOf(vertical).dimensions![0]!).map((v) => Math.round(v * 10) / 10),
    [0.3],
  );
  assert.throws(() =>
    addDimension(p, {
      id: "m2",
      orientation: "horizontal",
      offset: 0,
      points: [
        { x: 1, y: 0 },
        { x: 1, y: 5 },
      ],
    }),
  );
  assert.throws(() => updateDimension(p, "nope", { offset: 1 }), /Unbekannte Maßkette/);
});

test("value text after German building drawings: cm below 1 m, m with two decimals above", () => {
  // Below 1 m in cm, from 1 m in m; half centimetres as superscript 5 (docs/MASSKETTE.md).
  assert.equal(formatDimension(0.365), "36⁵");
  assert.equal(formatDimension(0.24), "24");
  assert.equal(formatDimension(1), "1,00");
  assert.equal(formatDimension(2.365), "2,36⁵");
  assert.equal(formatDimension(12.5), "12,50");
  assert.deepEqual(dimensionFigure(2.015), { main: "2,01", sup: "5" });
  assert.deepEqual(dimensionFigure(2.015, "m"), { main: "2,015", sup: "" });
  assert.deepEqual(dimensionFigure(1.2, "m"), { main: "1,20", sup: "" });
  assert.deepEqual(dimensionFigure(2.365, "cm"), { main: "236", sup: "5" });
});

test("move, delete, menu summary; schema 37 files load, smuggled chains are refused", () => {
  const p = withChain();
  const moved = prepareTranslation(p, ["m1"]).materialize(p, { x: 1, y: 2 });
  const chain = storeyOf(moved).dimensions![0]!;
  assert.equal(chain.offset, 0.5);
  assert.deepEqual(chain.points[0], { x: 1, y: 2 });
  assert.deepEqual(selectionSummary(p, { kind: "dimension", id: "m1" }), {
    title: "Maßkette",
    details: "Waagerecht · 3 Maße · gesamt 8,00",
  });
  const removed = previewDeleteSelection(p, [{ kind: "dimension", id: "m1" }], undefined).result;
  assert.equal(storeyOf(removed).dimensions!.length, 0);
  assert.equal(PROJECT_SCHEMA_VERSION, 39);
  const plain = JSON.parse(serializeProject(createStandardProject("p", "eg", "og")));
  assert.equal(loadProjectData({ ...plain, schemaVersion: 37 }).schemaVersion, 39);
  const smuggled = JSON.parse(serializeProject(p));
  assert.throws(() => loadProjectData({ ...smuggled, schemaVersion: 37 }));
});

// docs/MASSKETTE.md, M1–M3.
test("windows offer their four jamb corners as snap points, like doors", () => {
  const p = createExampleProject();
  const window = storeyOf(p).windows[0]!;
  const jambs = projectSnapReferences(p).filter((r) => r.entityId === window.id);
  assert.deepEqual(jambs.map((r) => r.feature).sort(), [
    "jamb-end--1",
    "jamb-end-1",
    "jamb-start--1",
    "jamb-start-1",
  ]);
  assert.equal(snapPointLabel(p, window.id, "jamb-start-1"), "Fenster · Laibung");
});

test("a click removes the nearest measured point, at the point or its line end", () => {
  const chain = storeyOf(withChain()).dimensions![0]!;
  // At the point itself (2,365 | 0,3) and at its extension end on the line (2,365 | −1,5).
  assert.equal(dimensionPointAt(chain, { x: 2.37, y: 0.31 }, 0.3), 2);
  assert.equal(dimensionPointAt(chain, { x: 2.36, y: -1.45 }, 0.3), 2);
  assert.equal(dimensionPointAt(chain, { x: 5.5, y: 3 }, 0.3), null);
  const p = withChain();
  const fewer = updateDimension(p, "m1", {
    points: chain.points.filter((_, i) => i !== 2),
  });
  assert.equal(dimensionValues(storeyOf(fewer).dimensions![0]!).length, 2);
  const added = updateDimension(p, "m1", { points: [...chain.points, { x: 6, y: 0 }] });
  assert.equal(dimensionValues(storeyOf(added).dimensions![0]!).length, 4);
  // Below two distinct stations the chain is refused; the user deletes the chain instead.
  assert.throws(() => updateDimension(p, "m1", { points: [chain.points[0]!] }));
});
