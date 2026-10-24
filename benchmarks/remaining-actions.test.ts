import test from "node:test";
import assert from "node:assert/strict";
import { fullHeightFixture } from "./bound-height-fixture.ts";
import { validateProject, type Project } from "../src/lib/bim/model.ts";
import {
  createProjectSnapshot,
  isOwnedProjectSnapshot,
} from "../src/domain/project/owned-snapshot.ts";
import {
  addStorey,
  renameStorey,
  setGroundDatum,
  setStoreyHeight,
} from "../src/application/storeys/actions.ts";
import { changeDrawingDocument } from "../src/application/views/documents.ts";
import { changeProjectScale } from "../src/application/views/project-scale.ts";
import {
  previewLayerAssignment,
  previewLayerManagement,
} from "../src/application/layers/actions.ts";
import { previewHatch } from "../src/application/hatches/actions.ts";
import { previewCreateReference } from "../src/application/references/actions.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";

const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
const hatch = (x: number) => ({
  id: "hatch-new",
  points: [
    { x, y: 0 },
    { x: x + 3, y: 0 },
    { x: x + 3, y: 2 },
    { x, y: 2 },
  ],
  fill: { color: "#aabbcc", opacity: 0.5 },
});

/** Each case runs on the same content: as a mutable validated project (previous contract) and
 * as an owned snapshot (new path). Valid and invalid requests per action family.
 */
const cases: [string, (p: Project) => Project][] = [
  ["storey rename", (p) => renameStorey(p, p, { projectId: p.id, storeyId: "og", name: "OG neu" })],
  [
    "storey rename empty",
    (p) => renameStorey(p, p, { projectId: p.id, storeyId: "og", name: " " }),
  ],
  ["storey height", (p) => setStoreyHeight(p, p, { projectId: p.id, storeyId: "dg", height: 3.4 })],
  [
    "storey height joined conflict",
    (p) => setStoreyHeight(p, p, { projectId: p.id, storeyId: "og", height: 3.4 }),
  ],
  [
    "storey height too low",
    (p) => setStoreyHeight(p, p, { projectId: p.id, storeyId: "eg", height: 1 }),
  ],
  [
    "storey insert",
    (p) =>
      addStorey(p, p, { projectId: p.id, storeyId: "dg", side: "above", id: "new", height: 3 }),
  ],
  [
    "ground datum",
    (p) => setGroundDatum(p, p, { projectId: p.id, storeyId: "eg", elevation: 1.5 }),
  ],
  [
    "document folder",
    (p) => changeDrawingDocument(p, p, { kind: "create-folder", id: "f", name: "Pläne" }),
  ],
  [
    "document folder missing",
    (p) => changeDrawingDocument(p, p, { kind: "rename-folder", id: "x", name: "A" }),
  ],
  [
    "scale",
    (p) => changeProjectScale(p, { kind: "working-plan", projectId: p.id, storeyId: "eg" }, 50),
  ],
  [
    "scale invalid",
    (p) => changeProjectScale(p, { kind: "working-plan", projectId: p.id, storeyId: "eg" }, 0),
  ],
  [
    "layer create",
    (p) => previewLayerManagement(p, p, { kind: "create", id: "custom", name: "Bestand" }),
  ],
  [
    "layer rename duplicate",
    (p) =>
      previewLayerManagement(p, p, {
        kind: "rename",
        id: p.layers[1]!.id,
        name: p.layers[0]!.name,
      }),
  ],
  [
    "layer delete used",
    (p) => previewLayerManagement(p, p, { kind: "delete", id: p.defaultLayerIds.wall }),
  ],
  [
    "layer assign",
    (p) =>
      previewLayerAssignment(p, p, {
        projectId: p.id,
        elementIds: [storeyOf(p).walls[0]!.id],
        layerId: p.layers[1]!.id,
      }),
  ],
  [
    "layer assign missing",
    (p) =>
      previewLayerAssignment(p, p, {
        projectId: p.id,
        elementIds: ["nope"],
        layerId: p.layers[1]!.id,
      }),
  ],
  [
    "hatch create",
    (p) => previewHatch(p, p, { projectId: p.id, kind: "create", hatch: hatch(20) }),
  ],
  [
    "hatch create invalid",
    (p) =>
      previewHatch(p, p, {
        projectId: p.id,
        kind: "create",
        hatch: { ...hatch(20), points: hatch(20).points.slice(0, 2) },
      }),
  ],
  [
    "reference create",
    (p) =>
      previewCreateReference(p, p, {
        projectId: p.id,
        asset: { id: "asset", mimeType: "image/png", pixelWidth: 1, pixelHeight: 1, data: png },
        reference: {
          id: "ref",
          kind: "image-reference",
          assetId: "asset",
          layerId: p.defaultLayerIds.line,
          origin: { x: 3, y: 4 },
          rotation: 0.4,
          metresPerPixel: 2,
        },
      }),
  ],
];

const outcome = (run: () => Project) => {
  try {
    const result = run();
    return { ok: JSON.stringify(result), owned: isOwnedProjectSnapshot(result) };
  } catch (error) {
    return { error: (error as Error).message };
  }
};

for (const [name, action] of cases)
  test(`${name}: owned input gives the same outcome as a mutable input`, () => {
    const mutable = outcome(() => action(validateProject(fullHeightFixture())));
    const owned = outcome(() => action(createProjectSnapshot(fullHeightFixture())));
    if ("error" in mutable) return assert.deepEqual(owned, mutable);
    assert.equal(owned.ok, mutable.ok);
    assert.equal(mutable.owned, false);
    // A changed result from an owned input is owned, so the commit need not validate it again.
    assert.equal(owned.owned, true);
  });
