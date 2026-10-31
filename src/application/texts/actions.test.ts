import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addText, defaultTextLayerId, updateText } from "./actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import {
  TEXT_DECORATION_DEFAULTS,
  TEXT_DEFAULTS,
  convertTextSize,
  textBlock,
  textBox,
  textHeight,
} from "../../domain/elements/text/model.ts";
import { selectionSummary } from "../../components/cad/demand-menu.ts";
import { planDenominator } from "../../domain/views/scale.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { prepareTranslation } from "../../domain/project/prepared-translation.ts";
import { previewDeleteSelection } from "../elements/delete.ts";
import { pickupToolDefaults } from "../tools/pickup.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";

// docs/TEXT.md, T1.
function withText() {
  return addText(createStandardProject("p", "eg", "og"), {
    id: "t1",
    position: { x: 2, y: 3 },
    content: "Wohnen\nEG",
    ...TEXT_DEFAULTS,
    size: { unit: "paper", value: 2.5 },
  });
}
const text = (p: ReturnType<typeof withText>) => storeyOf(p).texts![0]!;

test("a text sits on the Textelemente layer and round-trips", () => {
  const p = withText();
  assert.equal(text(p).layerId, defaultTextLayerId(p));
  assert.equal(p.layers.find((l) => l.id === text(p).layerId)!.name, "Textelemente");
  assert.deepEqual(readProjectFile(serializeProject(p)), p);
  assert.throws(() => updateText(p, "t1", { content: "   " }), /Inhalt/);
  assert.throws(() => updateText(p, "nope", { rotation: 1 }), /Unbekannter Text/);
});

test("paper size follows the output scale, model size stays in the model", () => {
  const p = withText();
  assert.equal(planDenominator(p), 100);
  assert.ok(Math.abs(textHeight(text(p), 100) - 0.25) < 1e-12);
  assert.ok(Math.abs(textHeight(text(p), 50) - 0.125) < 1e-12);
  const model = { size: { unit: "model" as const, value: 0.3 } };
  assert.equal(textHeight(model, 100), 0.3);
  assert.equal(textHeight(model, 50), 0.3);
});

test("the text block follows alignment, anchor and rotation", () => {
  const base = {
    position: { x: 0, y: 0 },
    content: "ABCD",
    size: { unit: "model" as const, value: 1 },
    align: "left" as const,
    anchor: "bottom" as const,
    rotation: 0,
  };
  assert.deepEqual(textBox(base, 100)[2], { x: 2.4, y: 1 });
  const centred = textBox({ ...base, align: "center", anchor: "middle" }, 100);
  assert.ok(Math.abs(centred[0]!.x + 1.2) < 1e-12 && Math.abs(centred[0]!.y + 0.5) < 1e-12);
  const turned = textBox({ ...base, rotation: 90 }, 100)[1]!;
  assert.ok(Math.abs(turned.x) < 1e-12 && Math.abs(turned.y - 2.4) < 1e-12);
});

test("move, delete, pipette; schema 38 files load and refuse smuggled texts", () => {
  const p = withText();
  const moved = prepareTranslation(p, ["t1"]).materialize(p, { x: 1, y: -1 });
  assert.deepEqual(text(moved).position, { x: 3, y: 2 });
  const removed = previewDeleteSelection(p, [{ kind: "text", id: "t1" }], undefined).result;
  assert.equal(storeyOf(removed).texts!.length, 0);
  const picked = pickupToolDefaults(p, createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE), {
    kind: "text",
    id: "t1",
  });
  assert.equal(picked?.tool, "text");
  assert.equal(PROJECT_SCHEMA_VERSION, 39);
  const plain = JSON.parse(serializeProject(createStandardProject("p", "eg", "og")));
  assert.equal(loadProjectData({ ...plain, schemaVersion: 38 }).schemaVersion, 39);
  assert.throws(() => loadProjectData({ ...JSON.parse(serializeProject(p)), schemaVersion: 38 }));
});

test("switching paper and model size keeps the visible height at the output scale", () => {
  assert.deepEqual(convertTextSize({ unit: "paper", value: 2.5 }, "model", 100), {
    unit: "model",
    value: 0.25,
  });
  assert.deepEqual(convertTextSize({ unit: "model", value: 0.25 }, "paper", 50), {
    unit: "paper",
    value: 5,
  });
  assert.deepEqual(selectionSummary(withText(), { kind: "text", id: "t1" }), {
    title: "Text",
    details: "Wohnen · 2,5 mm Papier",
  });
});

// docs/TEXT.md, T2.
test("type style and decorations are stored, removable and checked", () => {
  const p = updateText(withText(), "t1", {
    bold: true,
    italic: true,
    underline: true,
    background: { ...TEXT_DECORATION_DEFAULTS.background },
    frame: { color: "#ff0000", width: 0.35 },
    halo: { ...TEXT_DECORATION_DEFAULTS.halo },
  });
  assert.deepEqual(text(p).frame, { color: "#ff0000", width: 0.35 });
  assert.equal(text(p).bold, true);
  assert.deepEqual(readProjectFile(serializeProject(p)), p);
  const plain = updateText(p, "t1", { background: undefined, bold: undefined });
  assert.equal(JSON.parse(serializeProject(plain)).storeys[0].texts[0].background, undefined);
  assert.throws(() => updateText(p, "t1", { frame: { color: "red", width: 0.35 } }));
  assert.throws(() => updateText(p, "t1", { halo: { color: "#ffffff", width: 0 } }));
});

test("the drawn block grows by the background padding on every side", () => {
  const base = {
    position: { x: 0, y: 0 },
    content: "AB",
    size: { unit: "model" as const, value: 1 },
    align: "left" as const,
    anchor: "bottom" as const,
    rotation: 0,
  };
  const tight = textBlock(base, 100, 2);
  const padded = textBlock(base, 100, 2, 0.3);
  assert.deepEqual(tight[0], { x: 0, y: -0.25 });
  assert.deepEqual(tight[2], { x: 2, y: 1 });
  assert.ok(Math.abs(padded[0]!.x + 0.3) < 1e-12 && Math.abs(padded[2]!.y - 1.3) < 1e-12);
});
